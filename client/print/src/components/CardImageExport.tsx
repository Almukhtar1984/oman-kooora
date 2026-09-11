import React, { useEffect, useMemo, useRef, useState } from "react";

import { apiUrl } from "../config";
import { buildFullName, formatBirthLine, generateQrDataUrl, cardPalette } from "./PDF/Card";

// Real ID-1 card at 300 dpi, landscape (85.6 × 54 mm). Printing this PNG at
// 100% gives a credit-card-sized card — no full A4 page, no cutting guesswork.
const W = 1012;
const H = 638;

interface Props {
    player: any;
    title?: string;
}

// Fetch an image as a same-origin data URI so drawing it onto the canvas never
// taints it (a cross-origin <img> without CORS would make toDataURL throw).
const fetchImageDataUrl = async (url: string): Promise<string | null> => {
    try {
        const res = await fetch(url, { cache: "default" });
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise((resolve) => {
            const fr = new FileReader();
            fr.onload = () => resolve(String(fr.result));
            fr.onerror = () => resolve(null);
            fr.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
};

const loadImg = (dataUrl: string | null): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
        if (!dataUrl) return resolve(null);
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = dataUrl;
    });

// Best-effort load of the app font so the PNG matches the on-screen card; falls
// back silently to the system Arabic font if the face can't be fetched.
const ensureFont = async (): Promise<string> => {
    try {
        const anyDoc = document as any;
        if (!anyDoc.fonts) return "sans-serif";
        const faces = [
            new FontFace("Montserrat-Arabic", "url(/fonts/Montserrat-Arabic-Regular.ttf)", { weight: "400" }),
            new FontFace("Montserrat-Arabic", "url(/fonts/Montserrat-Arabic-Medium.ttf)", { weight: "700" }),
        ];
        await Promise.all(
            faces.map((f) => f.load().then((loaded) => anyDoc.fonts.add(loaded)).catch(() => null)),
        );
        return "Montserrat-Arabic, sans-serif";
    } catch {
        return "sans-serif";
    }
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
};

// Draw an image "cover"-fit inside a rect, clipped to it.
const drawCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    ctx.restore();
};

// Shrink the font until the text fits maxWidth (down to a floor), then draw.
const fitText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, weight: string, size: number, font: string) => {
    let s = size;
    ctx.font = `${weight} ${s}px ${font}`;
    while (ctx.measureText(text).width > maxWidth && s > 12) {
        s -= 1;
        ctx.font = `${weight} ${s}px ${font}`;
    }
    ctx.fillText(text, x, y);
};

const headerFooter = (ctx: CanvasRenderingContext2D, font: string, title: string, subtitle: string, backSubtitle = false) => {
    // Header
    ctx.fillStyle = cardPalette.primary;
    ctx.fillRect(0, 0, W, 96);
    ctx.textAlign = "center";
    ctx.direction = "rtl";
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 38px ${font}`;
    ctx.fillText(title || "بطاقة لاعب", W / 2, 52);
    if (subtitle) {
        ctx.fillStyle = cardPalette.primaryLight;
        ctx.font = `400 24px ${font}`;
        ctx.fillText(subtitle, W / 2, 84);
    }
    // Accent under header
    ctx.fillStyle = cardPalette.accent;
    ctx.fillRect(0, 96, W, 6);
    // Footer
    const fh = 48;
    ctx.fillStyle = cardPalette.accent;
    ctx.fillRect(0, H - fh - 6, W, 6);
    ctx.fillStyle = cardPalette.primaryDark;
    ctx.fillRect(0, H - fh, W, fh);
    ctx.fillStyle = cardPalette.primaryLight;
    ctx.font = `400 22px ${font}`;
    ctx.textAlign = "right";
    ctx.fillText("منصة طموح", W - 28, H - 16);
    ctx.textAlign = "left";
    ctx.fillText("omkooora.com", 28, H - 16);
};

interface Assets {
    photo: HTMLImageElement | null;
    teamLogo: HTMLImageElement | null;
    clubLogo: HTMLImageElement | null;
    qr: HTMLImageElement | null;
    font: string;
}

const drawFront = (ctx: CanvasRenderingContext2D, player: any, a: Assets, title: string) => {
    const font = a.font;
    const team = player?.team;
    const club = team?.club;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = cardPalette.surface;
    ctx.fillRect(0, 0, W, H);
    // outer border
    ctx.strokeStyle = cardPalette.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    headerFooter(ctx, font, title || "بطاقة لاعب", team?.name || "");

    // Photo (right, RTL)
    const photoW = 300;
    const photoH = 360;
    const photoX = W - 32 - photoW;
    const photoY = 128;
    if (a.photo) {
        drawCover(ctx, a.photo, photoX, photoY, photoW, photoH);
        ctx.strokeStyle = cardPalette.primary;
        ctx.lineWidth = 3;
        ctx.strokeRect(photoX, photoY, photoW, photoH);
    } else {
        ctx.fillStyle = cardPalette.surfaceMuted;
        ctx.fillRect(photoX, photoY, photoW, photoH);
        ctx.strokeStyle = cardPalette.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(photoX, photoY, photoW, photoH);
        // simple silhouette
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.arc(photoX + photoW / 2, photoY + photoH / 2 - 30, 55, 0, Math.PI * 2);
        ctx.fill();
        roundRect(ctx, photoX + photoW / 2 - 90, photoY + photoH / 2 + 30, 180, 110, 90);
        ctx.fill();
    }

    // Data column (left of photo)
    const dataRight = photoX - 32;
    const dataLeft = 32;
    const colW = dataRight - dataLeft;
    ctx.textAlign = "right";
    ctx.direction = "rtl";
    let y = photoY + 8;

    const label = (t: string) => {
        ctx.fillStyle = cardPalette.textMuted;
        ctx.font = `700 20px ${font}`;
        ctx.fillText(t, dataRight, y);
        y += 34;
    };
    const value = (t: string, strong = false) => {
        ctx.fillStyle = cardPalette.textDark;
        fitText(ctx, t || "—", dataRight, y, colW, strong ? "700" : "500", strong ? 32 : 26, font);
        y += strong ? 40 : 34;
    };
    const divider = () => {
        ctx.strokeStyle = cardPalette.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dataLeft, y - 8);
        ctx.lineTo(dataRight, y - 8);
        ctx.stroke();
        y += 8;
    };

    label("الاسم الكامل");
    value(buildFullName(player?.person), true);
    divider();
    if (player?.occupation) {
        label("الصفة");
        value(String(player.occupation));
    }
    label("تاريخ الميلاد");
    value(formatBirthLine(player?.person?.date_birth) || "—");
    label("الرقم المدني");
    value(player?.person?.card_number || "—");

    // Bottom row: QR + team logo + club logo, inside the data column
    const rowY = H - 48 - 6 - 150;
    const qr = 120;
    const tl = 120;
    const cl = 96;
    // right-to-left: team logo (right), qr (middle), club logo (left)
    if (a.teamLogo) drawCover(ctx, a.teamLogo, dataRight - tl, rowY + (qr - tl) / 2, tl, tl);
    const qrX = dataLeft + (colW - qr) / 2;
    if (a.qr) ctx.drawImage(a.qr, qrX, rowY, qr, qr);
    if (a.clubLogo) drawCover(ctx, a.clubLogo, dataLeft, rowY + (qr - cl) / 2, cl, cl);
};

const drawBack = (ctx: CanvasRenderingContext2D, player: any, a: Assets, title: string) => {
    const font = a.font;
    const team = player?.team;
    const club = team?.club;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = cardPalette.surface;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = cardPalette.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);

    headerFooter(ctx, font, title || "بطاقة لاعب", "");

    const logoSize = 190;
    const cy = H / 2 - 30;
    const gap = 120;
    const teamCx = W / 2 + logoSize / 2 + gap / 2; // right block (RTL: team first)
    const clubCx = W / 2 - logoSize / 2 - gap / 2; // left block

    const block = (cx: number, logo: HTMLImageElement | null, name: string, kind: string) => {
        const x = cx - logoSize / 2;
        const yy = cy - logoSize / 2;
        if (logo) {
            drawCover(ctx, logo, x, yy, logoSize, logoSize);
        } else {
            ctx.strokeStyle = cardPalette.border;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, yy, logoSize, logoSize);
        }
        ctx.textAlign = "center";
        ctx.direction = "rtl";
        ctx.fillStyle = cardPalette.textDark;
        fitText(ctx, name || "", cx, yy + logoSize + 40, logoSize + gap - 10, "700", 26, font);
        ctx.fillStyle = cardPalette.textMuted;
        ctx.font = `400 20px ${font}`;
        ctx.fillText(kind, cx, yy + logoSize + 72);
    };

    block(teamCx, a.teamLogo, team?.name || "", "فريق");
    block(clubCx, a.clubLogo, club?.name || "", "نادي");
};

const download = (canvas: HTMLCanvasElement | null, filename: string) => {
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default function CardImageExport({ player, title }: Props) {
    // Defined inside the component (not at module scope) so a circular import
    // with ./PDF/Card can't read cardPalette before it is initialised.
    const btnStyle: React.CSSProperties = {
        backgroundColor: cardPalette.primary,
        color: "#fff",
        border: "none",
        padding: "8px 16px",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
    };
    const frontRef = useRef<HTMLCanvasElement>(null);
    const backRef = useRef<HTMLCanvasElement>(null);
    const [ready, setReady] = useState(false);

    const safeName = useMemo(() => {
        const n = buildFullName(player?.person) || "card";
        return n.replace(/\s+/g, "_");
    }, [player]);

    useEffect(() => {
        let cancelled = false;
        setReady(false);
        (async () => {
            const [font, qrUrl] = await Promise.all([
                ensureFont(),
                generateQrDataUrl(player?.id ? `${window.location.origin}/#/${player.id}` : " "),
            ]);
            const photoFile = player?.person?.personal_picture;
            const teamFile = player?.team?.logo;
            const clubFile = player?.team?.club?.logo;
            const [photo, teamLogo, clubLogo, qr] = await Promise.all([
                photoFile ? fetchImageDataUrl(`${apiUrl}/images/${photoFile}?w=600`).then(loadImg) : Promise.resolve(null),
                teamFile ? fetchImageDataUrl(`${apiUrl}/images/${teamFile}?w=300`).then(loadImg) : Promise.resolve(null),
                clubFile ? fetchImageDataUrl(`${apiUrl}/images/${clubFile}?w=300`).then(loadImg) : Promise.resolve(null),
                loadImg(qrUrl),
            ]);
            if (cancelled) return;
            const assets: Assets = { photo, teamLogo, clubLogo, qr, font };
            const fc = frontRef.current?.getContext("2d");
            const bc = backRef.current?.getContext("2d");
            if (fc) drawFront(fc, player, assets, title || "بطاقة لاعب");
            if (bc) drawBack(bc, player, assets, title || "بطاقة لاعب");
            setReady(true);
        })();
        return () => {
            cancelled = true;
        };
    }, [player, title]);

    return (
        <div
            data-testid="card-image-export"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "10px 14px",
                backgroundColor: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
                direction: "rtl",
            }}
        >
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "#6b7280", fontFamily: "sans-serif" }}>
                    تحميل البطاقة كصورة (بحجم بطاقة حقيقي — تتحكم في الطباعة):
                </span>
                <button
                    type="button"
                    data-testid="download-front-png"
                    style={btnStyle}
                    disabled={!ready}
                    onClick={() => download(frontRef.current, `${safeName}_front.png`)}
                >
                    ⬇︎ الوجه الأمامي PNG
                </button>
                <button
                    type="button"
                    data-testid="download-back-png"
                    style={{ ...btnStyle, backgroundColor: cardPalette.primaryDark }}
                    disabled={!ready}
                    onClick={() => download(backRef.current, `${safeName}_back.png`)}
                >
                    ⬇︎ الوجه الخلفي PNG
                </button>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <canvas
                    ref={frontRef}
                    width={W}
                    height={H}
                    style={{ width: 340, height: "auto", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff" }}
                />
                <canvas
                    ref={backRef}
                    width={W}
                    height={H}
                    style={{ width: 340, height: "auto", border: "1px solid #e5e7eb", borderRadius: 6, background: "#fff" }}
                />
            </div>
        </div>
    );
}
