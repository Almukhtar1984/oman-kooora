import { NumberInput, Text } from "@mantine/core";
import React, { useEffect } from "react";

import { useClubFees } from "../../graphql";

// رسوم النادي المُرسِل على انتقالٍ أو إعارةٍ إلى نادٍ آخر — «في بعض الأحيان
// بدون رسوم» (العميل)، فهي اختيارية. تُقترح من قائمة أسعار النادي حين يظهر
// الحقل، ويسدّدها فريقه المُرسِل قبل أن يُعتمد الطلب نهائياً.

interface Props {
    feeType: "loan" | "transfer";
    // الحقل ظاهرٌ الآن: يُجلب السعر ويُقترح.
    active: boolean;
    value: number | "";
    onChange: (value: number | "") => void;
    mb?: number | string;
}

export function SendingFeeInput({ feeType, active, value, onChange, mb }: Props) {
    const [getFees, { data }] = useClubFees();

    useEffect(() => {
        if (active) getFees({ fetchPolicy: "cache-first" });
    }, [active, getFees]);

    useEffect(() => {
        if (!active) return;
        const price = (data?.clubFees || []).find((fee: any) => fee.fee_type === feeType && fee.active);
        onChange(Number(price?.amount) || 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, data, feeType]);

    return (
        <NumberInput
            label="رسوم ناديك على هذا الطلب"
            description="يسدّدها فريقك المُرسِل، ولا يُعتمد الطلب نهائياً قبل أن تعتمد إيصالها — اتركها صفراً إن كانت بلا رسوم"
            min={0}
            precision={2}
            mb={mb}
            rightSection={<Text size="xs" color="gray.6" pr={8}>ر.ع</Text>}
            rightSectionWidth={40}
            value={value}
            onChange={(next) => onChange(next === undefined ? "" : next)}
        />
    );
}
