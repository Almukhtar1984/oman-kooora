import { Col, Grid } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { Calendar } from "tabler-icons-react";
import dayjs from "dayjs";
import React from "react";
import { omanToday } from "../../lib/helpers/teamRegistration";

type Props = {
    start: Date | null;
    end: Date | null;
    onStartChange: (value: Date | null) => void;
    onEndChange: (value: Date | null) => void;
    endError?: React.ReactNode;
    /** Show the start field too (adding and editing); renewing asks only the end. */
    withStart?: boolean;
    endLabel?: string;
    /** A team added before periods existed may be left without one. */
    endRequired?: boolean;
};

// مدة تسجيل الفريق: بعد آخر يوم يتوقف حسابه حتى يجدّده النادي.
export const RegistrationPeriodInputs = ({
    start, end, onStartChange, onEndChange, endError, withStart = true, endLabel = "نهاية التسجيل", endRequired = true,
}: Props) => {
    const today = dayjs(omanToday()).toDate();
    const earliestEnd = start && dayjs(start).isAfter(today) ? start : today;

    return (
        <Grid gutter={20}>
            {withStart ? (
                <Col span={12} sm={6}>
                    <DateInput
                        label="بداية التسجيل"
                        placeholder="بداية التسجيل"
                        valueFormat="YYYY-MM-DD"
                        icon={<Calendar size={16} />}
                        value={start}
                        onChange={onStartChange}
                        clearable
                        popoverProps={{ withinPortal: true }}
                    />
                </Col>
            ) : null}
            <Col span={12} sm={withStart ? 6 : 12}>
                <DateInput
                    label={endLabel}
                    placeholder={endLabel}
                    description="بعد هذا اليوم يتوقف حساب الفريق حتى يُجدَّد التسجيل"
                    inputWrapperOrder={["label", "input", "description", "error"]}
                    withAsterisk={endRequired}
                    clearable={!endRequired}
                    valueFormat="YYYY-MM-DD"
                    icon={<Calendar size={16} />}
                    value={end}
                    onChange={onEndChange}
                    minDate={earliestEnd}
                    error={endError}
                    popoverProps={{ withinPortal: true }}
                />
            </Col>
        </Grid>
    );
};

export default RegistrationPeriodInputs;
