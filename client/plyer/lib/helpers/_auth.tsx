import React, { useCallback, useEffect, useState } from "react";
import Route, { useRouter } from "next/router";
import { Loader, Stack } from "@mantine/core";
import useStore from "../../store/useStore";
import { useGetCurrentUser, usePortalMe } from "../../graphql";
import {
    applyNewToken,
    clearAuth,
    decodeExpiryMs,
    hydrateAuthFromStorage,
    isPortalToken,
    runRefresh,
} from "./authToken";

const PUBLIC_ROUTES = [
    "/login",
    "/login/createAccount",
    "/login/forGotPassword",
    "/login/verification/[token]",
    "/login/changePassword/[token]"
];

const isPublicRoute = (pathname: string) => PUBLIC_ROUTES.includes(pathname);

const useAuth = (getCurrentUserLazy: any, getPortalMeLazy?: any) => {
    const loadCurrentUser = useCallback(async () => {
        return await new Promise((resolve) => {
            getCurrentUserLazy({
                fetchPolicy: "network-only",
                onCompleted: (data: any) => {
                    useStore.setState({ userData: data?.currentUser });
                    useStore.setState({ numPoints: data?.currentUser?.person?.company?.points });
                    resolve(true);
                },
                onError: () => {
                    useStore.setState({ userData: {} });
                    resolve(false);
                }
            });
        });
    }, [getCurrentUserLazy]);

    // A member signed in with phone + civil ID has no `users` row, so
    // CURRENT_USER would (correctly) reject the token. Load the person's own
    // record instead and keep the account path untouched.
    const loadPortalMe = useCallback(async () => {
        if (!getPortalMeLazy) return false;
        return await new Promise((resolve) => {
            getPortalMeLazy({
                fetchPolicy: "network-only",
                onCompleted: (data: any) => {
                    if (!data?.portalMe) {
                        useStore.setState({ portalData: null });
                        resolve(false);
                        return;
                    }
                    useStore.setState({ portalData: data.portalMe, userData: {} });
                    resolve(true);
                },
                onError: () => {
                    useStore.setState({ portalData: null });
                    resolve(false);
                }
            });
        });
    }, [getPortalMeLazy]);

    const checkAuth = useCallback(async (): Promise<boolean> => {
        try {
            const restored = hydrateAuthFromStorage();
            const expMs = decodeExpiryMs(restored);
            const stillValid = restored && expMs && expMs > Date.now();

            if (isPortalToken(restored)) {
                if (!stillValid) {
                    clearAuth();
                    return false;
                }
                const ok = await loadPortalMe();
                if (!ok) clearAuth();
                return ok as boolean;
            }

            if (stillValid) {
                const ok = await loadCurrentUser();
                if (ok) return true;
            }

            const next = await runRefresh();
            if (!next) {
                clearAuth();
                return false;
            }
            applyNewToken(next);
            const ok = await loadCurrentUser();
            return ok as boolean;
        } catch {
            clearAuth();
            return false;
        }
    }, [loadCurrentUser, loadPortalMe]);

    return { checkAuth };
};

interface Props {
    client?: any;
    children?: any;
}

const ProtectedPage = ({ children }: Props): any => {
    const router = useRouter();
    const isAuth = useStore((state: any) => state.isAuth);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [getCurrentUserLazy]: any = useGetCurrentUser();
    const [getPortalMeLazy]: any = usePortalMe();

    const { checkAuth } = useAuth(getCurrentUserLazy, getPortalMeLazy);

    useEffect(() => {
        let mounted = true;

        (async function () {
            if (isPublicRoute(router.pathname)) {
                setIsCheckingAuth(false);
                return;
            }

            setIsCheckingAuth(true);
            const authenticated = await checkAuth();

            if (!mounted) return;

            if (!authenticated) {
                await Route.replace("/login");
                return;
            }

            // The complaint / proposal / request / expense pages all read
            // `userData.person.player.id`, which a portal member does not have.
            const isPortalSession = Boolean((useStore.getState() as any).portalData);
            if (isPortalSession && router.pathname !== "/me") {
                await Route.replace("/me");
                return;
            }

            setIsCheckingAuth(false);
        })();

        return () => {
            mounted = false;
        };
    }, [checkAuth, router.pathname]);

    if (isCheckingAuth || (!isAuth && !isPublicRoute(router.pathname))) return <LoadingPage />;
    return <>{children}</>;
};

export { useAuth, ProtectedPage };

const LoadingPage = () => {
    return (
        <Stack bg={"#fff"} justify={"center"} align={"center"} style={{ width: "100%", height: "100vh" }}>
            <Loader size="xl" variant="dots" />
        </Stack>
    );
};
