import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { usePrintAssets } from "./usePrintAssets";

// jsdom lacks createImageBitmap / canvas.toBlob, so we stub them with
// deterministic fakes. The fakes also let us observe that the hook actually
// goes through the decode → canvas → re-encode pipeline.
const canvasToBlobMock = vi.fn();

beforeEach(() => {
    // createImageBitmap: pretend every blob decodes to a 1000×1000 image.
    (globalThis as any).createImageBitmap = vi.fn(async () => ({
        width: 1000,
        height: 1000,
        close: () => {},
    }));

    // jsdom doesn't ship a real 2D canvas. Hand the hook a no-op context so
    // it proceeds to the encode step instead of bailing back to the source.
    (HTMLCanvasElement.prototype as any).getContext = vi.fn(() => ({
        drawImage: vi.fn(),
    }));

    // HTMLCanvasElement.toBlob: return a tiny blob so the hook records the
    // "compressed" size as smaller than the input.
    canvasToBlobMock.mockReset();
    canvasToBlobMock.mockImplementation((cb: BlobCallback) => {
        cb(new Blob([new Uint8Array(50)], { type: "image/jpeg" }));
    });
    (HTMLCanvasElement.prototype as any).toBlob = canvasToBlobMock;

    // Object URL plumbing — jsdom has it but throws on revoke of unknown ids,
    // so we replace with a counter-based stub to avoid noise.
    let counter = 0;
    (globalThis as any).URL.createObjectURL = vi.fn(() => `blob:fake/${++counter}`);
    (globalThis as any).URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
    vi.restoreAllMocks();
});

const mockFetchOnce = (sizeBytes: number) => {
    const fetchMock = vi.fn(async () => ({
        ok: true,
        blob: async () =>
            new Blob([new Uint8Array(sizeBytes)], { type: "image/jpeg" }),
    }));
    (globalThis as any).fetch = fetchMock as any;
    return fetchMock;
};

// Tiny harness so we can read the hook's return value out of the React tree.
const Harness: React.FC<{ players: any[]; onChange: (v: any) => void }> = ({
    players,
    onChange,
}) => {
    const assets = usePrintAssets(players);
    React.useEffect(() => {
        onChange(assets);
    }, [assets, onChange]);
    return (
        <div data-testid="harness">
            ready={String(assets.progress.ready)} images={assets.progress.imagesTotal}
        </div>
    );
};

const samplePlayers = (overrides?: any) => [
    {
        id: "pp-1",
        player: {
            id: "player-1",
            person: { personal_picture: "photo-a.jpg" },
        },
        participating_team: {
            team: { logo: "team-x.png", club: { logo: "club-z.png" } },
        },
    },
    {
        id: "pp-2",
        player: {
            id: "player-2",
            person: { personal_picture: "photo-b.jpg" },
        },
        // Same team logo as pp-1 → must dedupe to a single fetch.
        participating_team: {
            team: { logo: "team-x.png", club: { logo: "club-z.png" } },
        },
    },
    {
        id: "pp-3",
        player: {
            id: "player-3",
            // No personal_picture on purpose to verify the hook tolerates gaps.
            person: { personal_picture: null },
        },
        participating_team: {
            team: { logo: "team-y.png", club: null },
        },
        ...overrides,
    },
];

describe("usePrintAssets", () => {
    it("dedupes repeated logos and only fetches each unique image once", async () => {
        const fetchMock = mockFetchOnce(800_000);
        const captured: any[] = [];

        render(<Harness players={samplePlayers()} onChange={(v) => captured.push(v)} />);

        await waitFor(() => {
            const latest = captured[captured.length - 1];
            expect(latest?.progress.ready).toBe(true);
        });

        // Unique filenames: photo-a, photo-b, team-x, team-y, club-z → 5 fetches.
        expect(fetchMock).toHaveBeenCalledTimes(5);
        const urls = (fetchMock.mock.calls as any[][]).map((c) => String(c[0]));
        // Photos request the photo-sized baseline transform, logos the logo size.
        expect(urls.some((u) => u.endsWith("/images/photo-a.jpg?w=280&h=320"))).toBe(true);
        expect(urls.some((u) => u.endsWith("/images/photo-b.jpg?w=280&h=320"))).toBe(true);
        expect(urls.some((u) => u.endsWith("/images/team-x.png?w=256&h=256"))).toBe(true);
        expect(urls.some((u) => u.endsWith("/images/team-y.png?w=256&h=256"))).toBe(true);
        expect(urls.some((u) => u.endsWith("/images/club-z.png?w=256&h=256"))).toBe(true);
    });

    it("downscales fetched blobs through canvas and reports bytesIn/bytesOut", async () => {
        mockFetchOnce(900_000);
        const captured: any[] = [];

        render(<Harness players={samplePlayers()} onChange={(v) => captured.push(v)} />);

        await waitFor(() => {
            const latest = captured[captured.length - 1];
            expect(latest?.progress.ready).toBe(true);
        });

        const final = captured[captured.length - 1];
        // 5 unique 900 KB images → bytesIn ≈ 4.5 MB.
        expect(final.progress.bytesIn).toBeGreaterThan(4_000_000);
        // Each compressed blob is the 50-byte stub → bytesOut should be tiny.
        expect(final.progress.bytesOut).toBeLessThan(final.progress.bytesIn / 100);
        // toBlob must have been called once per unique image.
        expect(canvasToBlobMock).toHaveBeenCalledTimes(5);
    });

    it("exposes every player's image map and QR data URL once ready", async () => {
        mockFetchOnce(100_000);
        const captured: any[] = [];

        render(<Harness players={samplePlayers()} onChange={(v) => captured.push(v)} />);

        await waitFor(() => {
            const latest = captured[captured.length - 1];
            expect(latest?.progress.ready).toBe(true);
            expect(latest?.progress.qrLoaded).toBe(latest?.progress.qrTotal);
        });

        const final = captured[captured.length - 1];
        expect(Object.keys(final.images).sort()).toEqual(
            ["club-z.png", "photo-a.jpg", "photo-b.jpg", "team-x.png", "team-y.png"].sort(),
        );
        // Every image is embedded as a base64 data URI so @react-pdf/renderer
        // renders it identically in the viewer and the downloaded PDF (blob:
        // object URLs render unreliably and race with revoke-on-cleanup).
        for (const url of Object.values(final.images)) {
            expect(String(url)).toMatch(/^data:image\//);
        }
        // QR generated for each participating player that has a player.id.
        expect(final.qr["pp-1"]).toMatch(/^data:image\//);
        expect(final.qr["pp-2"]).toMatch(/^data:image\//);
        expect(final.qr["pp-3"]).toMatch(/^data:image\//);
    });

    it("falls back to the remote URL when fetch fails so the card still renders", async () => {
        (globalThis as any).fetch = vi.fn(async () => {
            throw new Error("offline");
        });
        const captured: any[] = [];

        render(<Harness players={samplePlayers()} onChange={(v) => captured.push(v)} />);

        await waitFor(() => {
            const latest = captured[captured.length - 1];
            expect(latest?.progress.ready).toBe(true);
        });

        const final = captured[captured.length - 1];
        // Every image key still resolves to *some* URL — just the remote one,
        // which stays the baseline-resize transform so react-pdf can render it.
        expect(final.images["photo-a.jpg"]).toMatch(/\/images\/photo-a\.jpg\?w=280&h=320$/);
        expect(final.images["team-x.png"]).toMatch(/\/images\/team-x\.png\?w=256&h=256$/);
        // No compression happened.
        expect(final.progress.bytesOut).toBe(0);
    });

    it("reports zero work when given no players", async () => {
        const fetchMock = mockFetchOnce(100);
        const captured: any[] = [];

        render(<Harness players={[]} onChange={(v) => captured.push(v)} />);

        await waitFor(() => {
            const latest = captured[captured.length - 1];
            expect(latest?.progress.ready).toBe(true);
        });

        const final = captured[captured.length - 1];
        expect(final.progress.imagesTotal).toBe(0);
        expect(final.progress.qrTotal).toBe(0);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("aborts in-flight fetches on unmount to avoid leaking work", async () => {
        // Images are now embedded as data URIs (no object URLs to revoke), so
        // the only cleanup concern is cancelling outstanding fetches. Capture
        // the AbortSignal handed to fetch and assert unmount aborts it.
        const signals: AbortSignal[] = [];
        (globalThis as any).fetch = vi.fn(async (_url: string, opts: any) => {
            if (opts?.signal) signals.push(opts.signal);
            return {
                ok: true,
                blob: async () => new Blob([new Uint8Array(100_000)], { type: "image/jpeg" }),
            };
        });
        const captured: any[] = [];

        const { unmount } = render(
            <Harness players={samplePlayers()} onChange={(v) => captured.push(v)} />,
        );

        await waitFor(() => {
            const latest = captured[captured.length - 1];
            expect(latest?.progress.ready).toBe(true);
        });

        expect(signals.length).toBeGreaterThan(0);
        expect(signals.every((s) => !s.aborted)).toBe(true);

        act(() => unmount());
        // Cleanup aborts the controller, flipping every captured signal.
        expect(signals.every((s) => s.aborted)).toBe(true);
    });
});
