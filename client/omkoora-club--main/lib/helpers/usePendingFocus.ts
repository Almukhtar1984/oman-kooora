import { useRouter } from "next/router";
import { useMemo } from "react";

import { useClubPendingIds } from "../../graphql";

/**
 * هل جاء النادي إلى هذه الصفحة من «الطلبات»؟ المفتاح يخصّ مجموعة بعينها، لأن صفحة
 * الأعضاء تضمّ اللاعبين والجهاز الفني ومجلس الإدارة في تبويبات: فتح تبويب آخر من
 * هناك لا يُفلتر قائمته.
 */
export const usePendingFocus = (key: string) => {
    const router = useRouter();
    const active = router.query.pending === key;
    const { data, loading } = useClubPendingIds(key, !active);

    const list = data?.clubPendingIds;
    const ids = useMemo(() => (active ? new Set<string>(list || []) : null), [active, list]);

    const clear = () => {
        const { pending, ...query } = router.query;
        router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
    };

    return { active, ids, loading: active && loading && !list, clear };
};
