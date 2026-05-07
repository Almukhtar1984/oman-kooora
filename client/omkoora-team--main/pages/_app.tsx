import "../styles/globals.css";
import type { AppProps } from "next/app";
import { client } from "../lib/graphql";
import { MantineProvider } from "@mantine/core";
import Layout from "../components/Layout/Layout";
import { breakPoints, colors } from "../lib/theme/theme";
import { rtlCache } from "../lib/emotionCache";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { ApolloProvider } from "@apollo/client/react";
import {ProtectedPage} from "../lib/helpers/_auth";
import { Notifications } from '@mantine/notifications';
import 'notyf/notyf.min.css';

dayjs.extend(customParseFormat);
dayjs.extend(duration)
dayjs.extend(relativeTime)

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ApolloProvider client={client}>
            <ProtectedPage client={client}>
                <MantineProvider
                    withGlobalStyles
                    withNormalizeCSS
                    emotionCache={rtlCache}
                    theme={{
                        datesLocale: "ar-sa",
                        fontFamily: ["NeoSansArabic", "sans-serif"].join(","),
                        fontSizes: {
                            "2xs": 10,
                            xs: 11,
                            sm: 12,
                            md: 14,
                            lg: 16,
                            xl: 18,
                        } as any,
                        dir: "rtl",
                        colorScheme: "light",
                        colors: {
                            slate: colors.slate as any,
                            gray: colors.gray as any,
                            green: colors.green as any,
                            cyan: colors.cyan as any,
                            blue: colors.blue as any,
                            orange: colors.orange as any,
                        },
                        primaryColor: "blue",
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
                    <Notifications position="bottom-left" />
                    <Layout>
                        <Component {...pageProps} />
                    </Layout>
                </MantineProvider>
            </ProtectedPage>
        </ApolloProvider>
    );
}
