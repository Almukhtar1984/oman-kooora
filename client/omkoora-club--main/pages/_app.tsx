import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { client } from "../lib/graphql";
import { Box, MantineProvider } from "@mantine/core";
import { Notifications } from '@mantine/notifications';
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

import 'notyf/notyf.min.css';
dayjs.extend(customParseFormat);
dayjs.extend(duration)
dayjs.extend(relativeTime)

export default function App({ Component, pageProps }: AppProps) {
    const router = useRouter();

    // Auto-recover from stale-deploy ChunkLoadErrors. After a new build is
    // deployed, an open page still references the old code-split chunks; clicking
    // a tab then throws (the chunk 404s), the Next router stalls, the URL updates
    // but the page doesn't, and every later click appears dead. Force one full
    // reload to the target so the fresh HTML + chunks load and navigation works.
    useEffect(() => {
        const isChunk = (x: any) => {
            const m = String(x?.message || x?.reason?.message || x || "");
            const n = x?.name || x?.reason?.name || "";
            return n === "ChunkLoadError" || /Loading chunk [\w-]+ failed|ChunkLoadError|Loading CSS chunk/i.test(m);
        };
        const recover = (target?: string) => {
            try {
                const K = "omkoora.chunkReloadAt";
                if (Date.now() - Number(sessionStorage.getItem(K) || 0) < 10000) return; // never loop
                sessionStorage.setItem(K, String(Date.now()));
            } catch (e) { /* ignore */ }
            if (target) window.location.assign(target); else window.location.reload();
        };
        const onRoute = (e: any, u: string) => { if (isChunk(e)) recover(u); };
        const onErr = (e: ErrorEvent) => { if (isChunk(e)) recover(); };
        const onRej = (e: PromiseRejectionEvent) => { if (isChunk(e)) recover(); };
        router.events.on("routeChangeError", onRoute);
        window.addEventListener("error", onErr);
        window.addEventListener("unhandledrejection", onRej);
        return () => {
            router.events.off("routeChangeError", onRoute);
            window.removeEventListener("error", onErr);
            window.removeEventListener("unhandledrejection", onRej);
        };
    }, [router]);

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
