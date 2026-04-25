import { Box,Grid,Group,Image,Stack,Text,useMantineTheme } from "@mantine/core";
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
    const [getAllParticipatingTechnicalStaff] = useAllParticipatingTechnicalStaff()

    const [allParticipatingTechnicalStaff, setAllParticipatingTechnicalStaff] = useState<object[]>([]);

    useEffect(() => {
        if (data && props.opened) {
            getAllParticipatingTechnicalStaff({
                variables: {
                    idParticipatingTeams: data
                },
                fetchPolicy: "network-only",
                onCompleted: ({allParticipatingTechnicalStaff}) => {
                    setAllParticipatingTechnicalStaff([...allParticipatingTechnicalStaff])
                }
            })
        }
    }, [data, getAllParticipatingTechnicalStaff, props.opened]);

    const closeModal = () => {
        props.onClose();
        setAllParticipatingTechnicalStaff([])
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
                {allParticipatingTechnicalStaff?.length >= 0
                    ? <Grid gutter={20}>
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
                    : null
                }
            </Box>
        </Modal>
    );
};
