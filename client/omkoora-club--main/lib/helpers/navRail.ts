// شريط صفحات اللوحة: هل بقي خارج النظر شيء؟
//
// The dashboard's top bar carries twenty pages and the window shows a dozen.
// The rest are one sideways scroll away — and that is the gesture nobody
// finds: a trackpad wants two fingers held just so, a plain wheel does
// nothing at all, and the strip hides its scrollbar. So people reported
// pages as missing — «الصلاحيات ما موجودة» — while the page sat two tabs
// out of view.
//
// Two arrows answer that, but an arrow that leads nowhere is worse than no
// arrow: it has to go dim exactly when the strip has nothing more on that
// side. Which means the bar must first be able to say what is hidden, and
// that is this file — arithmetic over the three numbers any scrolling box
// reports about itself, so it can be tested without a browser.

export type Rail = {
    scrollLeft: number;
    scrollWidth: number;
    clientWidth: number;
};

// بضعة بكسلات تفرّق بين «وصلنا الطرف» وكسرٍ عشري من تكبير الشاشة.
const SLACK = 4;

/** كل المسافة القابلة للتمرير — صفرٌ إذا كان الشريط يتّسع لصفحاته. */
export const railSpan = (rail?: Rail | null): number =>
    rail ? Math.max(0, Math.round(rail.scrollWidth - rail.clientWidth)) : 0;

/**
 * بُعد الشريط عن أوّله.
 *
 * Browsers disagree about the sign of `scrollLeft` in a right-to-left strip:
 * today's engines report 0 at the start and count down into negatives, older
 * ones counted up from zero at the far end. The distance is all we need, so
 * take it and leave the sign alone.
 */
export const railOffset = (rail?: Rail | null): number =>
    rail ? Math.min(Math.abs(Math.round(rail.scrollLeft)), railSpan(rail)) : 0;

/** هل الشريط أوسع من حاويته أصلاً — أي: هل للسهمين معنى؟ */
export const railOverflows = (rail?: Rail | null): boolean => railSpan(rail) > SLACK;

/** صفحاتٌ قبل أوّل ما يُرى. */
export const hasRailBefore = (rail?: Rail | null): boolean => railOffset(rail) > SLACK;

/** وصفحاتٌ بعد آخر ما يُرى. */
export const hasRailAfter = (rail?: Rail | null): boolean =>
    railSpan(rail) - railOffset(rail) > SLACK;

/**
 * خطوة النقرة: عرض الشريط ناقصاً خُمسه.
 *
 * A full-width jump leaves nothing familiar on screen and the eye loses its
 * place; the overlap is what tells the reader the strip moved rather than
 * changed.
 */
export const railStep = (rail?: Rail | null): number =>
    Math.max(160, Math.round((rail?.clientWidth || 0) * 0.8));

/**
 * الخطوة بإشارتها.
 *
 * In a right-to-left strip the list advances as `scrollLeft` falls, so a step
 * toward the end of the list is negative there and positive in a left-to-right
 * one. `scrollBy` takes it as a physical delta either way.
 */
export const railDelta = (
    rail: Rail | null | undefined,
    toward: "before" | "after",
    rtl = true
): number => {
    const step = railStep(rail);
    const forward = toward === "after" ? step : -step;
    return rtl ? -forward : forward;
};
