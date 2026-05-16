import React, { useCallback, useEffect, useState } from "react";
import Route, { useRouter } from "next/router";
import { Loader, Stack } from "@mantine/core";
import useStore from "../../store/useStore";
import { useGetCurrentUser } from "../../graphql";
import {
    applyNewToken,
    clearAuth,
    decodeExpiryMs,
    hydrateAuthFromStorage,
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

const useAuth = (getCurrentUserLazy: any) => {
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

    const checkAuth = useCallback(async (): Promise<boolean> => {
        try {
            const restored = hydrateAuthFromStorage();
            const expMs = decodeExpiryMs(restored);
            const stillValid = restored && expMs && expMs > Date.now();

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
    }, [loadCurrentUser]);

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

    const { checkAuth } = useAuth(getCurrentUserLazy);

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
