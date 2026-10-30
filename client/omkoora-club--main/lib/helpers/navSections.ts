// أقسام الشريط — صفحاتٌ تتجاور تحت اسم واحد.
//
// شريط النادي بلغ عشرين صفحة، ستٌّ منها عن الطلب نفسه: الطلبات، مسار الطلبات،
// الانتقالات، الإعارات، إخلاء الطرف، المدفوعات. والعميل: «ما تحسب شعب كثيرة؟
// … كيف نضبطها بطريقة تكون سهلة ونقلّل كل هذه الصفحات». فصار للطلب بندٌ واحد في
// الشريط، وصفحاته صفٌّ ثانٍ تحته يظهر حين يُفتح القسم — والصفحات نفسها لم تتغيّر.
//
// قرارات محضة: لا واجهة.

import type { ReactNode } from "react";

export type NavChild = {
    path: string;
    label: string;
    show?: boolean;
    badge?: number;
};

export type NavItem = {
    path: string;
    label: string;
    icon?: ReactNode;
    show?: boolean;
    badge?: number;
    external?: boolean;
    // صفحاتٌ تُحسب من البند دون أن تظهر في صفّه الثاني (صفحات فرعية قديمة).
    also?: string[];
    children?: NavChild[];
};

/**
 * الشريط كما يُعرض: يُحذف ما لا يُسمح به، ويبقى من القسم أبناؤه المسموحون، ويفتح
 * القسم على أوّلهم — وقسمٌ لم يبقَ له ابنٌ لا يظهر أصلاً.
 */
export const resolveNav = (items: NavItem[]): NavItem[] => items
    .map((item) => (item.children
        ? { ...item, children: item.children.filter((child) => child.show !== false) }
        : item))
    .filter((item) => item.show !== false && (!item.children || item.children.length > 0))
    .map((item) => (item.children ? { ...item, path: item.children[0].path } : item));

/** هل الصفحة المفتوحة من هذا البند؟ */
export const isItemActive = (item: NavItem, pathname: string): boolean =>
    pathname === item.path
    || (item.also || []).includes(pathname)
    || (item.children || []).some((child) => child.path === pathname);

/**
 * القسم المفتوح الذي يُرسم له الصفّ الثاني — وقسمٌ بابنٍ واحد لا صفّ له، إذ لا
 * شيء يُختار بينه.
 */
export const activeSection = (items: NavItem[], pathname: string): NavItem | null =>
    items.find((item) => (item.children?.length || 0) > 1 && isItemActive(item, pathname)) || null;
