import { Box,Center,Grid,Group,Image,Skeleton,Stack,Text,useMantineTheme } from "@mantine/core";
import { IconUserOff } from "@tabler/icons-react";
import { useEffect,useState } from "react";
import { useAllParticipatingTechnicalStaff } from "../../graphql";
import { apiBaseUrl } from "../../lib/config";
import Modal,{ Props as ModalProps } from "./Modal";

const {Col} = Grid

type Props = {
    data?: any;
    setSelectedData: (id: any) => void;
} & ModalProps;

export const ShowParticipatingTechnicalStaff = ({data, setSelectedData, ...props}: Props) => {
    const theme = useMantineTheme();
    const [getAllParticipatingTechnicalStaff, { loading }] = useAllParticipatingTechnicalStaff()

    const [allParticipatingTechnicalStaff, setAllParticipatingTechnicalStaff] = useState<object[]>([]);
    const [hasFetched, setHasFetched] = useState<boolean>(false);

    useEffect(() => {
        if (data && props.opened) {
            setHasFetched(false);
            getAllParticipatingTechnicalStaff({
                variables: {
                    idParticipatingTeams: data
                },
                fetchPolicy: "network-only",
                onCompleted: ({allParticipatingTechnicalStaff}) => {
                    setAllParticipatingTechnicalStaff([...(allParticipatingTechnicalStaff || [])])
                    setHasFetched(true)
                },
                onError: () => setHasFetched(true)
            })
        }
    }, [data, getAllParticipatingTechnicalStaff, props.opened]);

    const closeModal = () => {
        props.onClose();
        setAllParticipatingTechnicalStaff([])
        setHasFetched(false)
    };

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={<></>}

            styles={{
                body: {
                    backgroundColor: theme.colors.gray[1]
                }
            }}
        >
            <Box style={({ colors }) => ({padding: 20})}>
                {loading && (
                    <Grid gutter={20}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Col key={i} span={6}>
                                <Box bg={theme.white} style={{ padding: 10 }}>
                                    <Group wrap={"nowrap"} align="center">
                                        <Skeleton height={50} width={50} circle />
                                        <Stack gap={6} style={{ flex: 1 }}>
                                            <Skeleton height={12} width="80%" />
                                            <Skeleton height={10} width="50%" />
                                        </Stack>
                                    </Group>
                                </Box>
                            </Col>
                        ))}
                    </Grid>
                )}
                {!loading && hasFetched && allParticipatingTechnicalStaff.length === 0 && (
                    <Center py={40}>
                        <Stack align="center" gap={6}>
                            <IconUserOff size={40} color={theme.colors.gray[4]} />
                            <Text fw={600} c="gray.6">لا يوجد جهاز فني مسجل لهذا الفريق</Text>
                            <Text size="sm" c="gray.5">قم بإضافة الجهاز الفني من قائمة الدورة.</Text>
                        </Stack>
                    </Center>
                )}
                {!loading && allParticipatingTechnicalStaff.length > 0 && (
                    <Grid gutter={20}>
                        {allParticipatingTechnicalStaff?.map((item: any, index: number) => (
                            <Col key={index} span={6} >
                                <Box bg={theme.white} style={({ colors }) => ({padding: 10})}>
                                    <Group wrap={"nowrap"} justify={"space-between"} align="flex-start">
                                        <Group wrap={"nowrap"} justify={"flex-start"} align={"center"}>
                                            <Stack justify={"center"} h={"100%"}>
                                                <Image src={`${apiBaseUrl}/images/${item?.technicalApparatus?.person?.personal_picture}`} w={50} h={50} />
                                            </Stack>

                                            <Stack gap={5} justify={"center"} align="flex-start">
                                                <Text size={"14px"} c={theme.colors.gray[6]}>
                                                    {`${item?.technicalApparatus?.person?.first_name} ${item?.technicalApparatus?.person?.second_name} ${item?.technicalApparatus?.person?.third_name} ${item?.technicalApparatus?.person?.tribe} (${item?.technicalApparatus?.person?.card_number})`}
                                                </Text>
                                                <Text size={"14px"} c={theme.colors.gray[6]}>
                                                    {`${item?.technicalApparatus?.person?.date_birth}`}
                                                </Text>
                                            </Stack>
                                        </Group>
                                    </Group>
                                </Box>
                            </Col>
                        ))}
                    </Grid>
                )}
            </Box>
        </Modal>
    );
};
