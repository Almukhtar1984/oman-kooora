import decode from "jwt-decode";
import { useCallback,useEffect,useState } from "react";
import { getNewToken,useGetCurrentUser } from "../../graphql";
import useStore from "../../store/useStore";

import { useLocation,useNavigate } from "react-router-dom";
import LoadingWidget from "../../components/Loading/LoadingWidget";

const PUBLIC_ROUTES = ["/"];

const isPublicRoute = (pathname: string) => PUBLIC_ROUTES.includes(pathname);

export const useAuth = (getCurrentUserLazy: any) => {
    const token = useStore((state: any) => state.token);

    const location = useLocation();
    const navigate = useNavigate();

    const loadCurrentUser = useCallback(async () => {
        return await new Promise((resolve) => {
            getCurrentUserLazy({
                fetchPolicy: "network-only",
                onCompleted: (data: any) => {
                    useStore.setState({ userData: data?.currentUser });
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
                useStore.setState({ isAuth: true });
                await loadCurrentUser();
                return true;
            }

            const { data }: any = await getNewToken();
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
            useStore.setState({ isAuth: false, token: undefined, userData: {} });
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

export const AuthProvider = ({ client, children }: Props): any => {

    const isAuth = useStore((state: any) => state.isAuth);
    const location = useLocation();
    const navigate = useNavigate();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [getCurrentUserLazy]: any = useGetCurrentUser();

    const { checkAuth, checkRefreshToken } = useAuth(getCurrentUserLazy);

    useEffect(() => {
        let mounted = true;

        (async function () {
            if (isPublicRoute(location.pathname)) {
                setIsCheckingAuth(false);
                return;
            }

            setIsCheckingAuth(true);
            const authenticated = await checkAuth();

            if (!mounted) {
                return;
            }

            if (!authenticated) {
                navigate("/");
                return;
            }

            setIsCheckingAuth(false);
        })();
        return () => {
            mounted = false;
        };
    }, [checkAuth, location.pathname, navigate]);

    useEffect(() => {
        const intervalId = setInterval(async function () {
            await checkRefreshToken();
        }, 1000 * 60 * 0.75)
        return () => clearInterval(intervalId);
    }, [checkRefreshToken]);

    if (isCheckingAuth || (!isAuth && !isPublicRoute(location.pathname))) {
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
