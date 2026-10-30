import {
    Box, Button, Grid, Group, Modal, Paper, Select, SimpleGrid, Stack, Text, Textarea, TextInput, UnstyledButton,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { FileText, Printer } from "tabler-icons-react";
import dayjs from "dayjs";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { buildEForm, eFormHtml, EFormType, FORM_TYPES, fullName } from "../../lib/helpers/eForms";
import { getImageUrl } from "../../lib/helpers/image";

// منشئ الاستمارات الإلكترونية: تُختار الاستمارة واللاعب، فتمتلئ وتُطبع.
//
// «يختار الاستمارة، ويختار اللاعب، تنزل بياناته» (العميل). والبحث عن اللاعب
// بالاسم أو بالرقم المدني — «هل ممكن بالرقم المدني… يضرب بياناته؟».
// والمعاينة هي الصفحة نفسها التي تُطبع، فما يُرى هو ما يخرج.

type Props = {
    opened: boolean;
    onClose: () => void;
    players: any[];
    loading?: boolean;
    club?: { name?: string | null; logo?: string | null } | null;
    // فريق المستدعي (لوحة الفريق). في لوحة النادي يُؤخذ فريق اللاعب المختار.
    team?: { name?: string | null; logo?: string | null } | null;
};

const currentSeason = () => {
    const year = dayjs().month() >= 6 ? dayjs().year() : dayjs().year() - 1;
    return `${year}/${year + 1}`;
};

const toDay = (value: Date | null) => (value ? dayjs(value).format("YYYY-MM-DD") : null);

export function EFormBuilder({ opened, onClose, players, loading = false, club, team }: Props) {
    const [type, setType] = useState<EFormType>("transfer");
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [toTeam, setToTeam] = useState("");
    const [toClub, setToClub] = useState("");
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [reason, setReason] = useState("");
    const [guardianName, setGuardianName] = useState("");
    const [guardianRelation, setGuardianRelation] = useState("");
    const [guardianCard, setGuardianCard] = useState("");
    const [guardianPhone, setGuardianPhone] = useState("");
    const [season, setSeason] = useState(currentSeason());
    const frame = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (opened) return;
        setPlayerId(null); setToTeam(""); setToClub(""); setStartDate(null); setEndDate(null);
        setReason(""); setGuardianName(""); setGuardianRelation(""); setGuardianCard(""); setGuardianPhone("");
        setSeason(currentSeason());
    }, [opened]);

    const options = useMemo(() => (players || []).map((player: any) => ({
        value: player.id,
        label: [fullName(player.person) || "لاعب بلا اسم", player.person?.card_number].filter(Boolean).join(" — "),
        card: String(player.person?.card_number || ""),
    })), [players]);

    const player = (players || []).find((item: any) => item.id === playerId) || null;
    const ownTeam = team || player?.team || null;

    const data = {
        player, club, team: ownTeam,
        toTeam, toClub, startDate: toDay(startDate), endDate: toDay(endDate),
        reason, guardianName, guardianRelation, guardianCard, guardianPhone, season,
    };
    const form = buildEForm(type, data);
    const html = eFormHtml(form, data, {
        club: club?.logo ? getImageUrl(club.logo) : null,
        team: ownTeam?.logo ? getImageUrl(ownTeam.logo) : null,
    });

    const print = () => frame.current?.contentWindow?.print();

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size="90rem"
            title={<Group spacing={8}><FileText size={20} /><Text weight={700}>استمارة إلكترونية</Text></Group>}
            styles={{ header: { direction: "rtl" }, body: { direction: "rtl" } }}
        >
            <Grid gutter="lg">
                <Grid.Col md={5}>
                    <Stack spacing="md">
                        <Box>
                            <Text size="sm" weight={600} mb={6}>الاستمارة</Text>
                            <SimpleGrid cols={2} spacing="xs">
                                {FORM_TYPES.map((item) => {
                                    const active = item.type === type;
                                    return (
                                        <UnstyledButton
                                            key={item.type}
                                            onClick={() => setType(item.type)}
                                            aria-pressed={active}
                                            sx={(theme) => ({
                                                padding: "10px 12px",
                                                borderRadius: theme.radius.md,
                                                border: `1px solid ${active ? theme.colors.blue[5] : theme.colors.gray[3]}`,
                                                backgroundColor: active ? theme.colors.blue[0] : theme.white,
                                                textAlign: "right",
                                                "&:focus-visible": { outline: `2px solid ${theme.colors.blue[5]}`, outlineOffset: 2 },
                                            })}
                                        >
                                            <Text size="sm" weight={700} color={active ? "blue.8" : "gray.8"}>{item.label}</Text>
                                            <Text size="xs" color="gray.6">{item.hint}</Text>
                                        </UnstyledButton>
                                    );
                                })}
                            </SimpleGrid>
                        </Box>

                        <Select
                            label="اللاعب"
                            placeholder={loading ? "جارٍ تحميل اللاعبين…" : "ابحث بالاسم أو الرقم المدني"}
                            data={options}
                            value={playerId}
                            onChange={setPlayerId}
                            searchable
                            clearable
                            nothingFound="لا لاعب بهذا الاسم أو الرقم"
                            filter={(value, item: any) => {
                                const query = value.trim();
                                return !query || item.label.includes(query) || item.card.includes(query);
                            }}
                            withAsterisk
                        />

                        {(type === "transfer" || type === "loan") && (
                            <>
                                <Group grow>
                                    <TextInput label={type === "loan" ? "الفريق المستعير" : "إلى فريق"} value={toTeam} onChange={(event) => setToTeam(event.currentTarget.value)} />
                                    <TextInput label={type === "loan" ? "النادي المستعير" : "النادي المستقبِل"} placeholder="إن كان نادياً آخر" value={toClub} onChange={(event) => setToClub(event.currentTarget.value)} />
                                </Group>
                                <Group grow>
                                    <DateInput label={type === "loan" ? "بداية الإعارة" : "تاريخ الانتقال"} value={startDate} onChange={setStartDate} valueFormat="YYYY/MM/DD" clearable />
                                    {type === "loan" && (
                                        <DateInput label="نهاية الإعارة" value={endDate} onChange={setEndDate} valueFormat="YYYY/MM/DD" minDate={startDate || undefined} clearable />
                                    )}
                                </Group>
                            </>
                        )}

                        {type === "resignation" && (
                            <Textarea label="أسباب الاستقالة" autosize minRows={3} value={reason} onChange={(event) => setReason(event.currentTarget.value)} />
                        )}

                        {type === "guardian" && (
                            <>
                                <Group grow>
                                    <TextInput label="اسم ولي الأمر" value={guardianName} onChange={(event) => setGuardianName(event.currentTarget.value)} />
                                    <TextInput label="صلة القرابة" placeholder="الأب، الأم، …" value={guardianRelation} onChange={(event) => setGuardianRelation(event.currentTarget.value)} />
                                </Group>
                                <Group grow>
                                    <TextInput label="الرقم المدني لولي الأمر" value={guardianCard} onChange={(event) => setGuardianCard(event.currentTarget.value)} />
                                    <TextInput label="هاتف ولي الأمر" value={guardianPhone} onChange={(event) => setGuardianPhone(event.currentTarget.value)} />
                                </Group>
                                <TextInput label="الموسم الرياضي" value={season} onChange={(event) => setSeason(event.currentTarget.value)} />
                            </>
                        )}

                        <Text size="xs" color="gray.6">
                            ما يُترك فارغاً يبقى نقاطاً في الاستمارة يُكتب عليها باليد.
                        </Text>

                        <Group spacing="xs">
                            <Button leftIcon={<Printer size={16} />} disabled={!player} onClick={print}>
                                طباعة / حفظ PDF
                            </Button>
                            <Button variant="default" onClick={onClose}>إغلاق</Button>
                        </Group>
                    </Stack>
                </Grid.Col>

                <Grid.Col md={7}>
                    <Paper withBorder radius="md" p={0} sx={{ overflow: "hidden", height: 680, backgroundColor: "#f8fafc" }}>
                        <iframe
                            ref={frame}
                            title="معاينة الاستمارة"
                            srcDoc={html}
                            style={{ width: "100%", height: "100%", border: 0, background: "white" }}
                        />
                    </Paper>
                </Grid.Col>
            </Grid>
        </Modal>
    );
}
