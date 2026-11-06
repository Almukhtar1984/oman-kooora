// What the design audit looks for on a rendered page. Runs INSIDE the browser
// (page.evaluate), so it must stay a self-contained function: no imports, no
// closures over module scope.
//
// Each finding is { kind, detail }. The kinds:
//   leaked-value  — "null", "undefined", "NaN", "Invalid Date", "[object Object]"
//                   printed where a value should be.
//   table-grid    — a table-library table whose column widths do not match its
//                   columns, or a row that broke onto two lines (the loans and
//                   transfers pages, 2026-11-03).
//   page-overflow — the whole page scrolls sideways.
//   covered       — a button, link or field hidden under another element (the
//                   tracking page's bulk bar once covered the last request).
//   overlap       — two pieces of text or controls drawn on top of each other.
//   escapes-card  — a control or badge sticking out past the side of its card
//                   (the payments card on a phone pushed «رفض» over its edge).
//   busy-loop     — (design-audit.mjs) a page that keeps the CPU busy while idle:
//                   an endless re-render left the technical staff page unable to
//                   answer clicks (2026-11-05).
//   menu-clipped / menu-empty — (auditOpenMenu) a ⋮ menu that opens to nothing: its
//                   dropdown cut off by a table cell, or holding no item at all
//                   (the team's «طلبات اللاعبين», 2026-11-05).

export function auditPage() {
    const findings = [];
    const add = (kind, detail) => findings.push({ kind, detail });
    // Mantine's class under the app's RTL cache is mantine-rtl-Paper-root, and
    // mantine-Paper-root without it: match the part both share. A plain
    // ".mantine-Paper-root" here matched nothing on the real pages.
    const M = (part) => `[class*="-${part}"]`;

    const isVisible = (el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return false;
        for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
            const s = getComputedStyle(node);
            if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
        }
        return true;
    };
    const label = (el) => {
        const text = (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ");
        const tag = el.tagName.toLowerCase();
        const cls = String(el.className || "").split(/\s+/).find((c) => c && !c.startsWith("css-")) || "";
        return `${tag}${cls ? "." + cls : ""}${text ? ` «${text.slice(0, 40)}»` : ""}`;
    };
    // Inside a horizontally scrolling box (a wide table): what sticks out is meant to.
    const inScroller = (el) => {
        for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
            const s = getComputedStyle(node);
            if (/(auto|scroll|hidden|clip)/.test(s.overflowX) && node.scrollWidth > node.clientWidth + 1) return node;
        }
        return null;
    };
    // Part of the element that the user can actually see, after every clipping ancestor.
    const visibleRect = (el) => {
        let r = el.getBoundingClientRect();
        let box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        for (let node = el.parentElement; node && node !== document.documentElement; node = node.parentElement) {
            const s = getComputedStyle(node);
            if (/(auto|scroll|hidden|clip)/.test(s.overflowX + s.overflowY)) {
                const p = node.getBoundingClientRect();
                box = {
                    left: Math.max(box.left, p.left), top: Math.max(box.top, p.top),
                    right: Math.min(box.right, p.right), bottom: Math.min(box.bottom, p.bottom),
                };
            }
        }
        return box.right - box.left > 1 && box.bottom - box.top > 1 ? box : null;
    };

    // ── leaked values ─────────────────────────────────────────────────────────
    const LEAK = /(^|[\s«(:—\-،,])(null|undefined|NaN|Invalid Date|\[object Object\])($|[\s»).,،:])/;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const leaks = new Set();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement;
        if (!parent || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(parent.tagName)) continue;
        const m = node.textContent.match(LEAK);
        if (m && isVisible(parent)) leaks.add(`${m[2]} في ${label(parent)}`);
    }
    for (const field of document.querySelectorAll("input:not([type=hidden]), textarea")) {
        if (/^(null|undefined|NaN|Invalid Date)$/.test(String(field.value).trim()) && isVisible(field)) {
            leaks.add(`${field.value} في الحقل ${label(field)}`);
        }
    }
    [...leaks].slice(0, 8).forEach((detail) => add("leaked-value", detail));

    // ── table-library grids ───────────────────────────────────────────────────
    const tracksOf = (template) => {
        let depth = 0, count = 0, inTrack = false;
        for (const ch of template.trim()) {
            if (ch === "(") depth++;
            if (ch === ")") depth--;
            if (/\s/.test(ch) && depth === 0) { inTrack = false; continue; }
            if (!inTrack) { count++; inTrack = true; }
        }
        return count;
    };
    document.querySelectorAll("table").forEach((table, index) => {
        const template = getComputedStyle(table).getPropertyValue("--data-table-library_grid-template-columns").trim();
        if (!template || template === "''" || /repeat\(/.test(template)) return;
        const header = table.querySelector(".tr-header, thead tr, .tr");
        const headers = header ? header.querySelectorAll(".th").length : 0;
        const tracks = tracksOf(template);
        if (headers && tracks !== headers) {
            add("table-grid", `الجدول ${index + 1}: ${headers} عموداً على ${tracks} عرضاً`);
        }
        let broken = 0;
        table.querySelectorAll(".tr").forEach((row) => {
            const tops = new Set([...row.querySelectorAll(":scope > .td, :scope > .th")]
                .filter(isVisible).map((cell) => Math.round(cell.getBoundingClientRect().top)));
            if (tops.size > 1) broken++;
        });
        if (broken) add("table-grid", `الجدول ${index + 1}: ${broken} سطراً انكسر على أكثر من خط`);
    });

    // ── whole-page sideways scroll ────────────────────────────────────────────
    const viewport = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > viewport + 2) {
        const culprits = [...document.body.querySelectorAll("*")]
            .filter((el) => {
                const r = el.getBoundingClientRect();
                return (r.right > viewport + 2 || r.left < -2) && r.width <= viewport * 3 && isVisible(el) && !inScroller(el);
            })
            .filter((el, _, all) => !all.some((other) => other !== el && other.contains(el)))
            .slice(0, 3)
            .map(label);
        add("page-overflow", `الصفحة أعرض من الشاشة (${document.documentElement.scrollWidth} > ${viewport})${culprits.length ? ": " + culprits.join("، ") : ""}`);
    }

    // ── covered controls and overlapping text ─────────────────────────────────
    // With a window or drawer open, the page behind it is meant to be covered:
    // judge only the topmost open layer.
    const layers = [...document.querySelectorAll(`[role=dialog], ${M("Modal-content")}, ${M("Drawer-content")}`)]
        .filter(isVisible);
    const scope = layers.length ? layers[layers.length - 1] : document.body;
    const CONTROLS = "button, a[href], input:not([type=hidden]), select, textarea, [role=tab], [role=button], [role=checkbox]";
    const height = window.innerHeight;
    const inView = (box) => box && box.top >= 0 && box.bottom <= height && box.left >= 0 && box.right <= viewport;

    const covered = [];
    scope.querySelectorAll(CONTROLS).forEach((el) => {
        if (!isVisible(el) || getComputedStyle(el).pointerEvents === "none") return;
        const box = visibleRect(el);
        if (!inView(box)) return;
        const x = (box.left + box.right) / 2, y = (box.top + box.bottom) / 2;
        const hit = document.elementFromPoint(x, y);
        if (!hit || el === hit || el.contains(hit) || hit.contains(el)) return;
        // A label or wrapper drawn over its own field (Mantine checkboxes, inputs).
        if (hit.closest("label")?.contains(el) || el.closest("label")?.contains(hit)) return;
        if (el.parentElement && el.parentElement.contains(hit) && getComputedStyle(hit).pointerEvents === "none") return;
        covered.push(`${label(el)} تحت ${label(hit)}`);
    });
    covered.slice(0, 6).forEach((detail) => add("covered", detail));

    const escapes = [];
    scope.querySelectorAll(`${CONTROLS}, ${M("Badge-root")}`).forEach((el) => {
        if (!isVisible(el)) return;
        const card = el.parentElement && el.parentElement.closest(`${M("Paper-root")}, ${M("Card-root")}`);
        if (!card) return;
        const scroller = inScroller(el);
        if (scroller && card.contains(scroller)) return;   // a scrolling strip inside the card
        const r = el.getBoundingClientRect(), c = card.getBoundingClientRect();
        if (r.left < c.left - 2 || r.right > c.right + 2) escapes.push(`${label(el)} يخرج من بطاقته`);
    });
    escapes.slice(0, 6).forEach((detail) => add("escapes-card", detail));

    const TEXTY = `button, a[href], [role=tab], label, h1, h2, h3, h4, h5, ${M("Badge-root")}, ${M("Text-root")}, ${M("Title-root")}, .th, .td`;
    const items = [...scope.querySelectorAll(TEXTY)]
        .filter((el) => isVisible(el) && (el.innerText || "").trim())
        .filter((el) => !el.querySelector(TEXTY))   // leaves only: a cell holding a badge is judged by the badge
        .map((el) => ({ el, box: visibleRect(el) }))
        .filter(({ box }) => inView(box));
    const overlaps = [];
    for (let i = 0; i < items.length && overlaps.length < 6; i++) {
        for (let j = i + 1; j < items.length; j++) {
            const a = items[i], b = items[j];
            if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
            const w = Math.min(a.box.right, b.box.right) - Math.max(a.box.left, b.box.left);
            const h = Math.min(a.box.bottom, b.box.bottom) - Math.max(a.box.top, b.box.top);
            if (w <= 2 || h <= 2) continue;
            const area = (box) => (box.right - box.left) * (box.bottom - box.top);
            if (w * h > 0.3 * Math.min(area(a.box), area(b.box))) {
                overlaps.push(`${label(a.el)} فوق ${label(b.el)}`);
                if (overlaps.length >= 6) break;
            }
        }
    }
    overlaps.forEach((detail) => add("overlap", detail));

    return findings;
}

// Called on a menu button after it was clicked: did a usable menu really open?
export function auditOpenMenu(target) {
    const describe = (target.getAttribute("aria-label") || target.innerText || "⋮").trim().slice(0, 30) || "⋮";
    const id = target.getAttribute("aria-controls");
    const menu = id ? document.getElementById(id) : null;
    if (!menu) return [{ kind: "menu-clipped", detail: `القائمة «${describe}» لم تفتح` }];

    const items = [...menu.querySelectorAll("[role=menuitem]")];
    if (!items.length) return [{ kind: "menu-empty", detail: `القائمة «${describe}» فارغة` }];

    const first = items[0].getBoundingClientRect();
    const hit = document.elementFromPoint(first.left + first.width / 2, first.top + first.height / 2);
    if (first.width < 1 || first.height < 1 || !hit || !items[0].contains(hit)) {
        return [{ kind: "menu-clipped", detail: `القائمة «${describe}» مقصوصة: عناصرها لا تُرى` }];
    }
    return [];
}
