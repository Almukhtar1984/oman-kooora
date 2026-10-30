import { MultiSelect } from "@mantine/core";
import { ChevronDown } from "tabler-icons-react";

import { ACTIVITIES, joinActivities, splitActivities } from "../../lib/helpers/activities";

type Props = {
    /** القيمة كما تُخزَّن: «كرة القدم، كرة السلة». */
    value?: string | null;
    onChange: (value: string) => void;
    error?: React.ReactNode;
    label?: string;
};

// نشاط الفريق: اختيار من قائمة، ويجوز أكثر من نشاط — «ممكن يختار الفريق أكثر من
// نشاط، مثل كرة القدم وكرة السلة». بقائمةٍ لا يُكتب «كره القدم» فيظهر في
// الإحصاء نشاطاً ثانياً.
const ActivitiesSelect = ({ value, onChange, error, label = "النشاط" }: Props) => {
    const selected = splitActivities(value);
    // قيمة قديمة لا تعرفها القائمة تبقى ظاهرة ليُزيلها صاحبها، لا تُمحى بصمت.
    const data = Array.from(new Set([...ACTIVITIES, ...selected]));

    return (
        <MultiSelect
            label={label}
            placeholder={selected.length ? undefined : "اختر النشاط"}
            withAsterisk
            data={data}
            value={selected}
            onChange={(list) => onChange(joinActivities(list))}
            error={error}
            rightSection={<ChevronDown size={14} />}
            nothingFound="لا يوجد"
            clearable
        />
    );
};

export default ActivitiesSelect;
