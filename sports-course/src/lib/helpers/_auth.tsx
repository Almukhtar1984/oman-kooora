import React, { useEffect } from "react";
import useStore from "../../store/useStore";
import decode from "jwt-decode";
import { getNewToken, useGetCurrentUser } from "../../graphql";

import LoadingWidget from "../../components/Loading/LoadingWidget";
import {redirect, useLocation, useNavigate} from "react-router-dom";

export const useAuth = (getCurrentUserLazy: any) => {
    let token = (useStore.getState() as any)?.token;

    let checkAuth = async () => {
        await checkRefreshToken();
        return true;
    };

    const location = useLocation();
    const navigate = useNavigate();

    let checkRefreshToken = async () => {
        let currentDate = new Date();
        let decodedJWT: any = token && decode(token);

        // console.log({currentDate, decodedJWT})

        if (!decodedJWT || decodedJWT.exp * 1000 < currentDate.getTime()) {
            getNewToken()
                .then(({ data }: any) => {
                    const { refreshToken } = data

                    if (refreshToken?.token) {
                        useStore.setState({
                            isAuth: true,
                            token: refreshToken.token,
                        });

                        getCurrentUserLazy({
                            onCompleted: (data: any) => {
                                useStore.setState({ userData: data?.currentUser });
                                //useValidAccessesStock
                            },
                            onError: (error: any) => {
                                useStore.setState({ userData: {} });
                            }
                        })

                        return;
                    }
                })
                .catch((error: any) => {
                    useStore.setState({ isAuth: false, token: undefined });
                    if (!["/", "/login/createAccount", "/login/forGotPassword", "/login/verification/[token]", "/login/changePassword/[token]"].includes(location.pathname)) {
                        navigate("/");
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

export const AuthProvider = ({ client, children }: Props): any => {

    const isAuth = useStore((state: any) => state.isAuth);


    const [getCurrentUserLazy, { data, loading, error }]: any = useGetCurrentUser();

    const { checkAuth, checkRefreshToken } = useAuth(getCurrentUserLazy);

    useEffect(() => {
        (async function () {
            await checkAuth();
        })();
    }, []);

    useEffect(() => {
        setInterval(async function () {
            await checkRefreshToken();
        }, 1000 * 60 * 0.75)
    }, []);

    if (!isAuth && loading) {
        return (
            <div className="w-full min-h-screen">
                <LoadingWidget />
            </div>
        )
    }

    return <>
        {children}
    </>;
};