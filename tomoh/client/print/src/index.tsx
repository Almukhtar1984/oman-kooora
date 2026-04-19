import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ApolloProvider } from "@apollo/client/react";
import {client} from "./graphql/graphql";
import {HashRouter, Route, Routes} from "react-router-dom";
import Players from "./Players";
import Members from "./Members";
import Technicals from "./Technicals";
import Assembly from "./Assembly";
import CardAssembly from "./CardAssembly";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);
dayjs.extend(duration)
dayjs.extend(relativeTime)


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
    <ApolloProvider client={client}>
        <React.StrictMode>
            <HashRouter>
                <Routes>
                    <Route path="/:id" element={<App />} />
                    <Route path="/assembly-card/:id" element={<CardAssembly />} />
                    <Route path="/players/:id/:type/:className?/:op?/:age?" element={<Players />} />
                    <Route path="/members/:id/:type" element={<Members />} />
                    <Route path="/technicals/:id/:type" element={<Technicals />} />
                    <Route path="/assembly/:id/:type" element={<Assembly />} />
                </Routes>
            </HashRouter>
        </React.StrictMode>
    </ApolloProvider>
);

reportWebVitals();