import React from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { history } from './lib/helpers/history';
import {Layout} from './components/Layouts';

import Login from "./pages/Login";
import {Home} from "./pages/Dashboard";

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
