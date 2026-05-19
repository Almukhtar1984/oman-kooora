import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

import { apiUrl, printUrl } from "../config";

export interface PrintProgress {
    imagesLoaded: number;
    imagesTotal: number;
    qrLoaded: number;
    qrTotal: number;
    ready: boolean;
    bytesIn: number;
    bytesOut: number;
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

const IMAGE_CONCURRENCY = 8;
const QR_BATCH_SIZE = 12;

// Target sizes are tuned to the actual on-card dimensions × 2 for retina
// crispness. The originals coming from /images are often 1–3 MB DSLR photos
// while the card prints them at 70×78 pt, so downscaling is a 10–20× memory
// and PDF-size win for large leagues.
const PHOTO_TARGET = { w: 280, h: 320, quality: 0.82 };
const LOGO_TARGET = { w: 256, h: 256, quality: 0.85 };

const fetchAsBlob = async (url: string, signal: AbortSignal): Promise<Blob> => {
    const res = await fetch(url, { signal, cache: "force-cache" });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return res.blob();
};

// Decode + downscale + re-encode an image blob to JPEG. Returns the resulting
// blob plus its size so we can show "saved X MB" feedback. Falls back to the
// original blob if the browser refuses to decode (e.g. SVG with foreignObject
// or HEIF that the codec doesn't support).
const downscaleBlob = async (
    blob: Blob,
    target: { w: number; h: number; quality: number },
): Promise<Blob> => {
    try {
        if (blob.type === "image/svg+xml") return blob;
        const bitmap = await createImageBitmap(blob).catch(() => null);
        if (!bitmap) return blob;
        const ratio = Math.min(target.w / bitmap.width, target.h / bitmap.height, 1);
        const outW = Math.max(1, Math.round(bitmap.width * ratio));
        const outH = Math.max(1, Math.round(bitmap.height * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            bitmap.close?.();
            return blob;
        }
        ctx.drawImage(bitmap, 0, 0, outW, outH);
        bitmap.close?.();
        const out: Blob | null = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", target.quality),
        );
        if (!out || out.size >= blob.size) return blob;
        return out;
    } catch {
        return blob;
    }
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
 * Pre-loads every distinct image (player photo, team logo, club logo) once,
 * downscales it via canvas to roughly card-display size, and generates QR
 * codes in small batches. @react-pdf/renderer re-downloads images even when
 * the same URL repeats inside a Document, so deduplicate + compress up-front
 * is the single biggest win for leagues with 200–300+ participants.
 */
export const usePrintAssets = (players: PlayerLike[] | undefined): PrintAssets => {
    const safePlayers = useMemo(() => players || [], [players]);

    // Walk the list once, recording which files are photos vs logos so we
    // can pick the right downscale target per filename.
    const imageJobs = useMemo(() => {
        const map = new Map<string, "photo" | "logo">();
        for (const pp of safePlayers) {
            const photo = pp.player?.person?.personal_picture;
            const teamLogo = pp.participating_team?.team?.logo;
            const clubLogo = pp.participating_team?.team?.club?.logo;
            if (photo && !map.has(photo)) map.set(photo, "photo");
            if (teamLogo && !map.has(teamLogo)) map.set(teamLogo, "logo");
            if (clubLogo && !map.has(clubLogo)) map.set(clubLogo, "logo");
        }
        return Array.from(map.entries()).map(([name, kind]) => ({ name, kind }));
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
    const [bytesIn, setBytesIn] = useState(0);
    const [bytesOut, setBytesOut] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        const localCreated: string[] = [];
        setImages({});
        setQr({});
        setImagesLoaded(0);
        setQrLoaded(0);
        setBytesIn(0);
        setBytesOut(0);

        const nextImages: Record<string, string> = {};

        const imageTasks = imageJobs.map(({ name, kind }) => async () => {
            try {
                const raw = await fetchAsBlob(`${apiUrl}/images/${name}`, controller.signal);
                if (controller.signal.aborted) return;
                const target = kind === "photo" ? PHOTO_TARGET : LOGO_TARGET;
                const compressed = await downscaleBlob(raw, target);
                if (controller.signal.aborted) return;
                const url = URL.createObjectURL(compressed);
                nextImages[name] = url;
                localCreated.push(url);
                setBytesIn((n) => n + raw.size);
                setBytesOut((n) => n + compressed.size);
            } catch {
                // Network or decode failed — fall back to the remote URL so the
                // card still renders, it just won't get the compression benefit.
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

        return () => {
            controller.abort();
            for (const u of localCreated) URL.revokeObjectURL(u);
        };
    }, [imageJobs, qrTargets]);

    const ready =
        imagesLoaded >= imageJobs.length && qrLoaded >= qrTargets.length;

    return {
        images,
        qr,
        progress: {
            imagesLoaded,
            imagesTotal: imageJobs.length,
            qrLoaded,
            qrTotal: qrTargets.length,
            ready,
            bytesIn,
            bytesOut,
        },
    };
};
