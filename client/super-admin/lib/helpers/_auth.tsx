import React, { useCallback, useEffect, useState } from "react";
import useStore from "../../store/useStore";
import decode from "jwt-decode";
import {getNewToken, useGetCurrentUser} from "../../graphql";
import Route, {useRouter} from "next/router";
import {Loader, Stack} from "@mantine/core";

const PUBLIC_ROUTES = [
    "/login",
    "/login/createAccount",
    "/login/forGotPassword",
    "/login/verification/[token]",
    "/login/changePassword/[token]"
];

const isPublicRoute = (pathname: string) => PUBLIC_ROUTES.includes(pathname);

const useAuth = (getCurrentUserLazy) => {
    const token = useStore((state: any) => state.token);

    const loadCurrentUser = useCallback(async () => {
        return await new Promise((resolve) => {
            getCurrentUserLazy({
                fetchPolicy: "network-only",
                onCompleted: (data: any ) => {
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

    let checkRefreshToken = useCallback(async () => {
        try {
            let decodedJWT: any = null;

            try {
                decodedJWT = token ? decode(token) : null;
            } catch {
                decodedJWT = null;
            }

            if (decodedJWT && decodedJWT.exp * 1000 >= Date.now()) {
                useStore.setState({isAuth: true});
                await loadCurrentUser();
                return true;
            }

            const {data}: any = await getNewToken();
            const nextToken = data?.refreshToken?.token;

            if (!nextToken) {
                throw new Error("Unable to refresh token");
            }

            useStore.setState({
                isAuth: true,
                token: nextToken,
            });
            await loadCurrentUser();
            return true;
        } catch {
            useStore.setState({isAuth: false, token: "", userData: {}});
            return false;
        }
    }, [loadCurrentUser, token]);

    let checkAuth = useCallback(async () => {
        return await checkRefreshToken();
    }, [checkRefreshToken]);

    return {
        checkAuth,
        checkRefreshToken,
    };
};

interface Props {
    client?: any;
    children?: any;
}

const ProtectedPage = ( { client, children }: Props ): any => {
    const router = useRouter();
    const isAuth = useStore((state: any) => state.isAuth);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [getCurrentUserLazy]: any = useGetCurrentUser();


    const { checkAuth, checkRefreshToken } = useAuth(getCurrentUserLazy);

    useEffect(() => {
        let mounted = true;

        (async function () {
            if (isPublicRoute(router.pathname)) {
                setIsCheckingAuth(false);
                return;
            }

            setIsCheckingAuth(true);
            const authenticated = await checkAuth();

            if (!mounted) {
                return;
            }

            if (!authenticated) {
                await Route.replace("/login");
                return;
            }

            // The super-admin app is reserved for role "1" (super-admin) users.
            // Authentication alone is not enough — anyone with a valid token
            // for any role would otherwise reach the dashboard.
            const userData = (useStore.getState() as any)?.userData;
            if (userData?.role !== "1") {
                useStore.setState({isAuth: false, token: "", userData: {}});
                await Route.replace("/login");
                return;
            }

            setIsCheckingAuth(false);
        })();
        return () => {
            mounted = false;
        };
    }, [checkAuth, router.pathname]);

    useEffect(() => {
        const intervalId = setInterval(async function () {
            await checkRefreshToken();
        }, 1000*60*0.75)
        return () => clearInterval(intervalId);
    }, [checkRefreshToken]);

    if (isCheckingAuth || (!isAuth && !isPublicRoute(router.pathname))) return <LoadingPage />;
    return <>{children}</>;
};

export { useAuth, ProtectedPage };

const LoadingPage = () => {
    return (
        <Stack bg={"#fff"} justify={"center"} align={"center"} style={{width: "100%", height: "100vh"}}>
            <Loader size="xl" variant="dots" />
        </Stack>
    )
}
