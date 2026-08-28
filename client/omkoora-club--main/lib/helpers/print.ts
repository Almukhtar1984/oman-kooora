/**
 * Printing helpers for records the user reads on screen — a message, a meeting
 * minute — and for the scanned files attached to them.
 *
 * Everything is printed from a window we write ourselves: the attachments are
 * served from the API's own origin, and printing cannot be driven from inside a
 * cross-origin document, so handing the browser a document of our own is the
 * only way to open the dialog on the user's behalf.
 */

export type PrintField = {
    label: string;
    value?: string | null;
};

export type PrintDocument = {
    /** Window title — also what most browsers suggest as the file name. */
    title: string;
    heading?: string | null;
    subtitle?: string | null;
    logoUrl?: string | null;
    fields?: PrintField[];
    /** Rich-text body, already HTML (message content, meeting description). */
    bodyHtml?: string | null;
    /** Scanned attachments; each image gets its own page. */
    images?: string[];
    /** Attachments that cannot be laid out (PDF, docx) — listed as links. */
    files?: { label: string; url: string }[];
};

const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

const isImageUrl = (url: string): boolean =>
    /\.(jpe?g|png|gif|webp|bmp|svg)(\?|#|$)/i.test(url);

// Waits for every image to settle before printing, so a scan never prints as a
// blank box, and closes the window once the dialog is done with it.
const PRINT_SCRIPT = `
(function () {
    var images = Array.prototype.slice.call(document.images);
    var pending = images.length;
    var printed = false;
    function print() {
        if (printed) return;
        printed = true;
        window.focus();
        window.print();
    }
    function settle() { if (--pending <= 0) print(); }
    if (!pending) { print(); }
    else {
        images.forEach(function (image) {
            if (image.complete) { settle(); return; }
            image.addEventListener('load', settle);
            image.addEventListener('error', function () { image.style.display = 'none'; settle(); });
        });
        // Never leave the user staring at a window that will not print.
        setTimeout(print, 8000);
    }
    window.onafterprint = function () { window.close(); };
})();
`;

const styles = `
    @page { margin: 12mm; }
    * { box-sizing: border-box; }
    body {
        margin: 0;
        padding: 0 4mm;
        background: #fff;
        color: #1a1b1e;
        font-family: "Segoe UI", Tahoma, "Noto Naskh Arabic", sans-serif;
        line-height: 1.7;
    }
    header { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #1a1b1e; padding-bottom: 10px; margin-bottom: 16px; }
    header img { width: 64px; height: 64px; object-fit: contain; }
    h1 { font-size: 20px; margin: 0; }
    .subtitle { font-size: 13px; color: #495057; margin-top: 2px; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; margin: 0 0 16px; font-size: 13px; }
    dt { font-weight: 700; color: #495057; }
    dd { margin: 0; }
    .body { font-size: 14px; border-top: 1px solid #dee2e6; padding-top: 12px; }
    .body img { max-width: 100%; }
    .files { font-size: 13px; margin-top: 12px; }
    .attachment { page-break-before: always; text-align: center; }
    .attachment img { max-width: 100%; max-height: 250mm; object-fit: contain; }
    .attachment .caption { font-size: 11px; color: #868e96; margin-bottom: 6px; }
`;

/** Opens `html` in a print window. Returns false when the popup was blocked. */
function openPrintWindow(title: string, html: string): boolean {
    if (typeof window === "undefined") return false;

    // Opened synchronously, before any await, so the browser still treats the
    // window as user-initiated and does not block it.
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return false;

    win.document.write(`<!doctype html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>${styles}</style></head>
<body>${html}<script>${PRINT_SCRIPT}<\/script></body>
</html>`);
    win.document.close();
    return true;
}

/**
 * Print one attachment on its own. Images are laid out on a page of their own;
 * a PDF or docx is handed to the browser's viewer, which carries its own print
 * action. Returns false when the popup was blocked.
 */
export function printAttachment(url: string, title = "طباعة المرفق"): boolean {
    if (typeof window === "undefined" || !url) return false;

    if (!isImageUrl(url)) {
        const win = window.open("", "_blank", "width=900,height=1200");
        if (!win) return false;
        win.location.href = url;
        return true;
    }

    return openPrintWindow(title, `
<div class="attachment" style="page-break-before: auto;">
    <img src="${escapeHtml(url)}" alt="${escapeHtml(title)}" />
</div>`);
}

/** Print a record the user is reading: heading, details, body and attachments. */
export function printDocument(doc: PrintDocument): boolean {
    const fields = (doc.fields || []).filter((f) => f.value !== null && f.value !== undefined && `${f.value}`.trim() !== "");
    const images = (doc.images || []).filter(Boolean);
    const files = (doc.files || []).filter((f) => f?.url);

    const html = `
<header>
    ${doc.logoUrl ? `<img src="${escapeHtml(doc.logoUrl)}" alt="" />` : ""}
    <div>
        <h1>${escapeHtml(doc.heading || doc.title)}</h1>
        ${doc.subtitle ? `<div class="subtitle">${escapeHtml(doc.subtitle)}</div>` : ""}
    </div>
</header>
${fields.length ? `<dl>${fields.map((f) => `<dt>${escapeHtml(f.label)}</dt><dd>${escapeHtml(`${f.value}`)}</dd>`).join("")}</dl>` : ""}
${doc.bodyHtml ? `<div class="body">${doc.bodyHtml}</div>` : ""}
${files.length ? `<div class="files"><strong>مرفقات أخرى:</strong> ${files.map((f) => escapeHtml(f.label)).join("، ")}</div>` : ""}
${images.map((url, i) => `
<div class="attachment">
    <div class="caption">مرفق ${i + 1} من ${images.length}</div>
    <img src="${escapeHtml(url)}" alt="مرفق ${i + 1}" />
</div>`).join("")}`;

    return openPrintWindow(doc.title, html);
}
