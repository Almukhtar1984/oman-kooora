import React from "react";
import type { PrintProgress as PrintProgressData } from "../hooks/usePrintAssets";

interface Props {
    progress: PrintProgressData;
    label?: string;
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

const PrintProgress: React.FC<Props> = ({ progress, label }) => {
    const total = progress.imagesTotal + progress.qrTotal;
    const done = progress.imagesLoaded + progress.qrLoaded;
    const pct = total === 0 ? 100 : Math.round((done / total) * 100);
    const phase =
        progress.imagesLoaded < progress.imagesTotal
            ? `تحميل الصور (${progress.imagesLoaded}/${progress.imagesTotal})`
            : progress.qrLoaded < progress.qrTotal
              ? `توليد رموز QR (${progress.qrLoaded}/${progress.qrTotal})`
              : "تجهيز ملف PDF…";

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
        </div>
    );
};

export default PrintProgress;
