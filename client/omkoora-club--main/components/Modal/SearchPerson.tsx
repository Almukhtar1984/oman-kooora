import { ActionIcon, Alert, Box, Button, Col, Divider, Grid, Group, Image, Select, Text, Stack, TextInput } from "@mantine/core";
import {Check, InfoCircle, Search, X} from "tabler-icons-react";
import React, {useEffect, useMemo, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {useAllTeams, useAssociatePlayer, useGetPerson} from "../../graphql";
import useStore from "../../store/useStore";
import {Notyf} from "notyf";


type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const SearchPerson = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit, setValues} = useForm({
        initialValues: {cardNumber: "123654"}
    });
    const [loading, setLoading] = useState(false);
    const [person, setPerson] = useState<any>(null);
    const [getPerson, {data, error}] = useGetPerson();

    // A person the club finds by civil number is often already in the system but
    // attached to nothing — "مسجّل سابقاً" with no way forward. The club can now
    // pick one of its own teams and put them on it.
    const idClub = userData?.person?.clubManagement?.club?.id;
    const [getAllTeam, {data: dataAllTeams}] = useAllTeams();
    const [associatePlayer] = useAssociatePlayer();
    const [teamId, setTeamId] = useState<string | null>(null);
    const [attaching, setAttaching] = useState(false);

    useEffect(() => {
        if (idClub) getAllTeam({variables: {idClub}});
    }, [idClub]);

    const clubTeams = useMemo(
        () => (dataAllTeams?.allTeam || []).map((t: any) => ({label: t.name, value: t.id})),
        [dataAllTeams]
    );

    // Only a player record that hangs on no team can be attached from here.
    const attachable = Boolean(person?.player?.id && !person?.player?.team);

    const handleAttach = () => {
        const notyf = new Notyf({ position: { x: "right", y: "bottom" } });
        if (!teamId) { notyf.error("اختر الفريق أولاً"); return; }
        setAttaching(true);
        associatePlayer({
            variables: {id_player: person?.player?.id, id_team: teamId},
            onCompleted: () => {
                setAttaching(false);
                notyf.success("تم ضمّ اللاعب إلى الفريق");
                closeModal();
            },
            onError: () => {
                setAttaching(false);
                notyf.error("تعذّر ضمّ اللاعب");
            },
        });
    };

    useEffect(() => {
        if (data && "person" in data) {
            setPerson(data.person)
        }
    }, [data])

    const onFormSubmit = ({cardNumber}: any) => {
        setLoading(true)
        getPerson({
            variables: {cardNumber },
            fetchPolicy: "network-only",
            onCompleted: () => {
                setLoading(false)
            },
            onError: ({graphQLErrors}) => {
                setLoading(false)
                setLoading(false)
            }
        })
    };

    const closeModal = () => {
        setLoading(false)
        setTeamId(null)
        setPerson(null)
        props.onClose();
        reset();
    };

    
    return (
        <Modal
            size="lg"
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12} >
                            <Group w={"100%"} noWrap={true} align="flex-end">
                                <TextInput
                                    placeholder="الرقم المدني"
                                    withAsterisk
                                    w={"100%"}
                                    {...getInputProps("cardNumber")}
                                />
                                <ActionIcon variant="light" color="cyan" size={36} type="submit" loading={loading}>
                                    <Search size={20} />
                                </ActionIcon>
                            </Group>
                        </Col>
                        {person
                            ? <Col span={12} >
                                <Box>
                                    <Grid gutter={20}>
                                        <Col span={3} >
                                            {person?.personal_picture
                                                ? <Image src={`${process.env.NEXT_PUBLIC_UPLOAD_URL}/images/${person?.personal_picture}`} alt="" />
                                                : <Image src={"/profile-blank.jpg"} alt="" />
                                            }
                                        </Col>
                                        <Col span={8} >
                                            <Stack spacing={8}>
                                                <Group w={"100%"} noWrap={true}>
                                                    <Text color="gray.7" fw={"bold"} size={"sm"}>الاسم الكامل :</Text>
                                                    <Text color="gray.7" size={"sm"}>{`${person?.first_name} ${person?.second_name} ${person?.third_name} ${person?.tribe}`}</Text>
                                                </Group>
                                                <Group w={"100%"} noWrap={true}>
                                                    <Text color="gray.7" fw={"bold"} size={"sm"}>رقم الهاتف :</Text>
                                                    <Text color="gray.7" size={"sm"}>{person?.phone}</Text>
                                                </Group>
                                                <Group w={"100%"} noWrap={true}>
                                                    <Text color="gray.7" fw={"bold"} size={"sm"}>الرقم المدني :</Text>
                                                    <Text color="gray.7" size={"sm"}>{person?.card_number}</Text>
                                                </Group>
                                                <Group w={"100%"} noWrap={true}>
                                                    <Text color="gray.7" fw={"bold"} size={"sm"}>تاريخ الميلاد :</Text>
                                                    <Text color="gray.7" size={"sm"}>{person?.date_birth}</Text>
                                                </Group>
                                                <Group w={"100%"} noWrap={true}>
                                                <Text color="gray.7" fw={"bold"} size={"sm"}>نوع الشخص :</Text>
                                                <Text color="gray.7" size={"sm"}>{
                                                    person?.member ? "عضو مجلس ادارة"
                                                        : person?.player ? "لاعب"
                                                            : person?.technicalApparatus ? "تقني فني"
                                                            : ""
                                                }</Text>
                                            </Group>
                                            </Stack>
                                        </Col>

                                        <Col span={6} >
                                            <Group w={"100%"} noWrap={true}>
                                                <Text color="gray.7" fw={"bold"} size={"sm"}>النادي :</Text>
                                                <Text color="gray.7" size={"sm"}>{
                                                    person?.member
                                                        ? person?.member?.team?.club?.name
                                                        : person?.player
                                                            ? person?.player?.team?.club?.name
                                                            : person?.technicalApparatus
                                                            ? person?.technicalApparatus?.team?.club?.name
                                                            : ""
                                                }</Text>
                                            </Group>
                                        </Col>
                                        <Col span={6} >
                                            <Group w={"100%"} noWrap={true}>
                                                <Text color="gray.7" fw={"bold"} size={"sm"}>الفريق :</Text>
                                                <Text color="gray.7" size={"sm"}>{
                                                    person?.member
                                                        ? person?.member?.team?.name
                                                        : person?.player
                                                            ? person?.player?.team?.name
                                                            : person?.technicalApparatus
                                                            ? person?.technicalApparatus?.team?.name
                                                            : ""
                                                }</Text>
                                            </Group>
                                        </Col>
                                    </Grid>

                                    {attachable ? (
                                        <Box mt={16}>
                                            <Divider mb={12} />
                                            <Alert variant="light" color="yellow" icon={<InfoCircle size={16} />} mb={12}>
                                                هذا اللاعب مسجّل في المنصّة لكنه غير منضم لأي فريق — اختر الفريق لضمّه إليه.
                                            </Alert>
                                            <Group align="flex-end" noWrap>
                                                <Select
                                                    w="100%"
                                                    withinPortal
                                                    searchable
                                                    label="الفريق"
                                                    placeholder="اختر الفريق"
                                                    data={clubTeams}
                                                    value={teamId}
                                                    onChange={setTeamId}
                                                    nothingFound="لا توجد فرق لهذا النادي"
                                                />
                                                <Button
                                                    color="blue"
                                                    leftIcon={<Check size={16} />}
                                                    loading={attaching}
                                                    disabled={!teamId}
                                                    onClick={handleAttach}
                                                >
                                                    ضمّ اللاعب
                                                </Button>
                                            </Group>
                                        </Box>
                                    ) : person?.player?.team ? (
                                        <Alert variant="light" color="blue" icon={<InfoCircle size={16} />} mt={16}>
                                            هذا اللاعب منضم بالفعل إلى فريق — النقل يتم من صفحة انتقالات اللاعبين.
                                        </Alert>
                                    ) : null}
                                </Box>
                            </Col>
                            : null
                        }
                        
                    </Grid>
                </form>
            </Box>
        </Modal>
    );
};