import React, { useEffect } from "react";
import useStore from "../../store/useStore";
import decode from "jwt-decode";
import {getNewToken, useGetCurrentUser} from "../../graphql";
import Route from "next/router";
import {Loader, Stack} from "@mantine/core";

const useAuth = (getCurrentUserLazy) => {
    let token = (useStore.getState() as any)?.token;

    let checkAuth = async () => {
        await checkRefreshToken();
        return true;
    };

    let checkRefreshToken = async () => {
        let currentDate = new Date();
        let decodedJWT: any = token && decode(token);

        // console.log({currentDate, decodedJWT})

        if (!decodedJWT || decodedJWT.exp * 1000 < currentDate.getTime()) {
            getNewToken()
                .then(({data}: any) => {
                    const { refreshToken } = data

                    if (refreshToken?.token) {
                        useStore.setState({
                            isAuth: true,
                            token: refreshToken.token,
                        });

                        getCurrentUserLazy({
                            onCompleted: (data: any ) => {
                                useStore.setState({ userData: data?.currentUser });
                                useStore.setState({ numPoints: data?.currentUser?.person?.company?.points });
                                //useValidAccessesStock
                            },
                            onError: (error: any) => {
                                useStore.setState({ userData: {} });
                            }
                        })

                        return;
                    }
                })
                .catch(() => {
                    useStore.setState({isAuth: false, token: ""});
                    if(!["/login", "/login/createAccount", "/login/forGotPassword", "/login/verification/[token]", "/login/changePassword/[token]"].includes(Route.pathname)) {
                        Route.push("/login");
                    }
                    return false;
                })
        }
    };

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
    let isAuth = (useStore.getState() as any)?.isAuth;
    const [getCurrentUserLazy, {data, loading, error}]: any = useGetCurrentUser();


    const { checkAuth, checkRefreshToken } = useAuth(getCurrentUserLazy);

    useEffect(() => {
        (async function () {
            await checkAuth();
        })();
    }, []);

    useEffect(() => {
        setInterval(async function () {
            await checkRefreshToken();
        }, 1000*60*0.75)
    }, []);

    if (!isAuth && loading) return <LoadingPage />;
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