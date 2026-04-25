import { ApolloProvider } from "@apollo/client";
import { DirectionProvider,MantineProvider } from "@mantine/core";
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { client } from "./lib/graphql";
import { AuthProvider } from "./lib/helpers/_auth";
import { breakPoints,colors } from "./lib/theme/theme";
import reportWebVitals from './reportWebVitals';
import './styles/index.css';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import dayjs from "dayjs";
import "dayjs/locale/ar";
import customParseFormat from "dayjs/plugin/customParseFormat";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

import 'notyf/notyf.min.css';
dayjs.extend(customParseFormat);
dayjs.extend(duration)
dayjs.extend(relativeTime)

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <ApolloProvider client={client}>
        <React.StrictMode>
            <BrowserRouter>
                <AuthProvider client={client}>
                    <DirectionProvider initialDirection={"rtl"}>
                        <MantineProvider
                            withCssVariables
                            defaultColorScheme="light"
                            theme={{
                                fontFamily: 'Cairo, sans-serif',
                                fontFamilyMonospace: 'Cairo',
                                headings: { fontFamily: 'Cairo, sans-serif' },

                                fontSizes: {
                                    xs: 11,
                                    sm: 12,
                                    md: 14,
                                    lg: 16,
                                    xl: 18
                                } as any,
                                colors: {
                                    slate: colors.slate as any,
                                    gray: colors.gray as any,
                                    green: colors.green as any,
                                    cyan: colors.cyan as any,
                                },
                                primaryColor: "cyan",
                                components: {
                                    Container: {
                                        defaultProps: {
                                            sizes: {
                                                ...breakPoints,
                                            },
                                        },
                                    },
                                },
                            }}
                        >
                            <App />
                        </MantineProvider>
                    </DirectionProvider>
                </AuthProvider>
            </BrowserRouter>
        </React.StrictMode>
    </ApolloProvider>
);

// If you want to start measuring performance in your app, pass a function
// to record results with a custom analytics callback
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
