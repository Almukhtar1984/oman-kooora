import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

import { apiUrl, printUrl } from "../config";

export interface PrintProgress {
    imagesLoaded: number;
    imagesTotal: number;
    qrLoaded: number;
    qrTotal: number;
    ready: boolean;
}

export interface PrintAssets {
    images: Record<string, string>;
    qr: Record<string, string>;
    progress: PrintProgress;
}

interface PlayerLike {
    id?: string;
    player?: {
        id?: string;
        person?: { personal_picture?: string | null } | null;
    } | null;
    participating_team?: {
        team?: {
            logo?: string | null;
            club?: { logo?: string | null } | null;
        } | null;
    } | null;
}

const IMAGE_CONCURRENCY = 6;
const QR_BATCH_SIZE = 10;

const fetchAsObjectUrl = async (url: string, signal: AbortSignal): Promise<string> => {
    const res = await fetch(url, { signal, cache: "force-cache" });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
};

const runWithConcurrency = async <T,>(
    tasks: Array<() => Promise<T>>,
    concurrency: number,
    signal: AbortSignal,
): Promise<void> => {
    let index = 0;
    const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
        while (!signal.aborted) {
            const current = index++;
            if (current >= tasks.length) return;
            try {
                await tasks[current]();
            } catch {
                // swallow — individual failures should not abort the whole preload
            }
        }
    });
    await Promise.all(workers);
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Pre-loads every distinct image (player photo, team logo, club logo) once and
 * generates QR codes in small batches. @react-pdf/renderer re-downloads images
 * even when the same URL repeats inside a Document, so deduplicating up-front
 * is the single biggest win for large leagues.
 */
export const usePrintAssets = (players: PlayerLike[] | undefined): PrintAssets => {
    const safePlayers = useMemo(() => players || [], [players]);

    const uniqueImageNames = useMemo(() => {
        const set = new Set<string>();
        for (const pp of safePlayers) {
            const photo = pp.player?.person?.personal_picture;
            const teamLogo = pp.participating_team?.team?.logo;
            const clubLogo = pp.participating_team?.team?.club?.logo;
            if (photo) set.add(photo);
            if (teamLogo) set.add(teamLogo);
            if (clubLogo) set.add(clubLogo);
        }
        return Array.from(set);
    }, [safePlayers]);

    const qrTargets = useMemo(() => {
        const out: Array<{ ppId: string; playerId: string }> = [];
        for (const pp of safePlayers) {
            const playerId = pp.player?.id;
            if (pp.id && playerId) out.push({ ppId: pp.id, playerId });
        }
        return out;
    }, [safePlayers]);

    const [images, setImages] = useState<Record<string, string>>({});
    const [qr, setQr] = useState<Record<string, string>>({});
    const [imagesLoaded, setImagesLoaded] = useState(0);
    const [qrLoaded, setQrLoaded] = useState(0);
    const createdUrlsRef = useRef<string[]>([]);

    useEffect(() => {
        const controller = new AbortController();
        const localCreated: string[] = [];
        setImages({});
        setQr({});
        setImagesLoaded(0);
        setQrLoaded(0);

        const nextImages: Record<string, string> = {};

        const imageTasks = uniqueImageNames.map((name) => async () => {
            try {
                const url = await fetchAsObjectUrl(`${apiUrl}/images/${name}`, controller.signal);
                if (controller.signal.aborted) {
                    URL.revokeObjectURL(url);
                    return;
                }
                nextImages[name] = url;
                localCreated.push(url);
            } catch {
                nextImages[name] = `${apiUrl}/images/${name}`;
            } finally {
                if (!controller.signal.aborted) {
                    setImagesLoaded((n) => n + 1);
                }
            }
        });

        const run = async () => {
            await runWithConcurrency(imageTasks, IMAGE_CONCURRENCY, controller.signal);
            if (controller.signal.aborted) return;
            setImages({ ...nextImages });

            const nextQr: Record<string, string> = {};
            for (let i = 0; i < qrTargets.length; i += QR_BATCH_SIZE) {
                if (controller.signal.aborted) return;
                const batch = qrTargets.slice(i, i + QR_BATCH_SIZE);
                const generated = await Promise.all(
                    batch.map(async ({ ppId, playerId }) => {
                        try {
                            const url = await QRCode.toDataURL(`${printUrl}/#/${playerId}`, {
                                margin: 2,
                            });
                            return [ppId, url] as const;
                        } catch {
                            return [ppId, ""] as const;
                        }
                    }),
                );
                for (const [ppId, url] of generated) nextQr[ppId] = url;
                if (controller.signal.aborted) return;
                setQrLoaded((n) => n + batch.length);
                // Yield to the browser between batches so the UI stays responsive.
                await sleep(0);
            }
            if (!controller.signal.aborted) setQr({ ...nextQr });
        };

        run();

        createdUrlsRef.current = localCreated;
        return () => {
            controller.abort();
            for (const u of localCreated) URL.revokeObjectURL(u);
        };
    }, [uniqueImageNames, qrTargets]);

    const ready =
        imagesLoaded >= uniqueImageNames.length && qrLoaded >= qrTargets.length;

    return {
        images,
        qr,
        progress: {
            imagesLoaded,
            imagesTotal: uniqueImageNames.length,
            qrLoaded,
            qrTotal: qrTargets.length,
            ready,
        },
    };
};
