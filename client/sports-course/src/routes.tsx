import React, { useEffect, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import useStore from './store/useStore';
import { history } from './lib/helpers/history';
import {Layout} from './components/Layouts';

import Login from "./pages/Login";
import {Home} from "./pages/Dashboard";

export const MainRoutes = () => {
    const userData = useStore((state: any) => state.userData);

    history.navigate = useNavigate();
    history.location = useLocation();

    useEffect(() => {
        userData.store !== undefined &&
        console.log(userData);
    }, [userData])

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