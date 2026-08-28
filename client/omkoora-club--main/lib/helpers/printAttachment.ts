/**
 * Print one message attachment.
 *
 * Attachments are almost always a scan of the letter, so an image is laid out
 * on its own page and the print dialog opens by itself once the file has
 * loaded. Anything else (PDF, docx) is handed to the browser's own viewer,
 * which carries its own print action — we cannot drive printing inside a
 * cross-origin document ourselves.
 *
 * Returns false when the popup was blocked, so the caller can say so.
 */
export function printAttachment(url: string, title = "طباعة المرفق"): boolean {
    if (typeof window === "undefined" || !url) return false;

    // Opened synchronously, before any await, so the browser still treats the
    // window as user-initiated and does not block it.
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return false;

    const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)(\?|#|$)/i.test(url);
    if (!isImage) {
        win.location.href = url;
        return true;
    }

    const safeUrl = url.replace(/"/g, "&quot;");
    const safeTitle = title.replace(/</g, "&lt;");

    win.document.write(`<!doctype html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>
    @page { margin: 10mm; }
    html, body { margin: 0; padding: 0; background: #fff; }
    .sheet { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    img { max-width: 100%; max-height: 100vh; object-fit: contain; }
    .failed { font-family: sans-serif; padding: 40px; text-align: center; color: #c92a2a; }
    @media print { .sheet { min-height: auto; } }
</style>
</head>
<body>
<div class="sheet">
    <img src="${safeUrl}" alt="${safeTitle}"
         onload="window.focus(); window.print();"
         onerror="document.body.innerHTML='<p class=\\'failed\\'>تعذّر تحميل المرفق للطباعة</p>';" />
</div>
<script>window.onafterprint = function () { window.close(); };</script>
</body>
</html>`);
    win.document.close();
    return true;
}
