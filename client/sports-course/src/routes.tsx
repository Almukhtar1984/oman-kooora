import { Route,Routes,useLocation,useNavigate } from 'react-router-dom';

import { Layout } from './components/Layouts';
import { history } from './lib/helpers/history';

import { Home } from "./pages/Dashboard";
import Login from "./pages/Login";

export const MainRoutes = () => {
    history.navigate = useNavigate();
    history.location = useLocation();

    return (
        <main>
            <Routes>
                <Route index path="/" element={<Login />} />

                <Route element={<Layout />}>
                    <Route path={'/dashboard'} element={<Home />} />
                </Route>
            </Routes>
        </main>
    )
}
