import React from "react";
import type { PrintProgress as PrintProgressData } from "../hooks/usePrintAssets";

interface Props {
    progress: PrintProgressData;
    label?: string;
    totalPlayers?: number;
}

const barShell: React.CSSProperties = {
    width: "100%",
    maxWidth: 420,
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 12,
};

const formatMB = (bytes: number): string => {
    if (bytes <= 0) return "0 ميغا";
    const mb = bytes / (1024 * 1024);
    if (mb < 0.1) return `${Math.round(bytes / 1024)} كيلو`;
    return `${mb.toFixed(1)} ميغا`;
};

const PrintProgress: React.FC<Props> = ({ progress, label, totalPlayers }) => {
    const total = progress.imagesTotal + progress.qrTotal;
    const done = progress.imagesLoaded + progress.qrLoaded;
    const pct = total === 0 ? 100 : Math.round((done / total) * 100);
    const phase =
        progress.imagesLoaded < progress.imagesTotal
            ? `تحميل وضغط الصور (${progress.imagesLoaded}/${progress.imagesTotal})`
            : progress.qrLoaded < progress.qrTotal
              ? `توليد رموز QR (${progress.qrLoaded}/${progress.qrTotal})`
              : "تجهيز ملف PDF…";

    const showSavings = progress.bytesIn > 0 && progress.bytesOut > 0;
    const savedPct = showSavings
        ? Math.max(0, Math.round(((progress.bytesIn - progress.bytesOut) / progress.bytesIn) * 100))
        : 0;

    return (
        <div
            data-testid="print-progress"
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                color: "#1f2937",
                fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
                direction: "rtl",
            }}
        >
            <div style={{ fontWeight: 600, fontSize: 16 }}>
                {label || "جارٍ تجهيز البطاقات"}
                {typeof totalPlayers === "number" && totalPlayers > 0 ? (
                    <span style={{ color: "#6b7280", fontWeight: 400, marginRight: 6 }}>
                        ({totalPlayers} لاعب)
                    </span>
                ) : null}
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#6b7280" }}>{phase}</div>
            <div style={barShell}>
                <div
                    style={{
                        width: `${pct}%`,
                        height: "100%",
                        backgroundColor: "#0891b2",
                        transition: "width 120ms linear",
                    }}
                />
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>{pct}%</div>
            {showSavings ? (
                <div style={{ marginTop: 8, fontSize: 11, color: "#059669" }}>
                    تم تقليل حجم الصور من {formatMB(progress.bytesIn)} إلى {formatMB(progress.bytesOut)} (-{savedPct}%)
                </div>
            ) : null}
        </div>
    );
};

export default PrintProgress;
