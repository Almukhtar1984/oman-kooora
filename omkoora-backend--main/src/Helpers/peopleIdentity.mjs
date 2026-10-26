// عدّ الأشخاص مرة واحدة.
//
// A club's people are written in five registers — players, team board members,
// technical staff, the assembly register and the club's own management — and
// the same human is often in two of them at once: a player who is also an
// assembly member, a coach who sits on the board. Adding the five row counts
// therefore counts people twice, which is how a club was shown "إجمالي
// الأشخاص في النادي: 19,520" while its real membership was 10,117. A number
// like that is worse than no number: the club reads it as its own size.
//
// The civil number is the identity here — it is what the clubs themselves use,
// and the assembly register carries it even though it has no link to a person
// row. Rows without one fall back to their own id, so they are still counted,
// just never merged with anyone.

const clean = (value) => String(value ?? "").trim();

/**
 * The key two rows must share to be one person.
 *
 * @param {{card_number?: string, id?: string}} row
 * @param {string} prefix  distinguishes id-fallbacks of different registers
 */
export const identityKey = (row, prefix = "row") => {
    const card = clean(row?.card_number);
    if (card) return `c:${card}`;
    const id = clean(row?.id);
    return id ? `${prefix}:${id}` : `${prefix}:unknown:${Math.random()}`;
};

/** How many distinct people the keys describe. */
export const countDistinct = (keys = []) => new Set(keys.filter(Boolean)).size;

/**
 * Collects keys per bucket (a club, usually) and counts each bucket's distinct
 * people — without holding every row in memory twice.
 */
export const createDistinctCounter = () => {
    const buckets = new Map();

    return {
        add(bucket, key) {
            if (!bucket || !key) return;
            if (!buckets.has(bucket)) buckets.set(bucket, new Set());
            buckets.get(bucket).add(key);
        },
        count(bucket) {
            return buckets.get(bucket)?.size || 0;
        },
    };
};
