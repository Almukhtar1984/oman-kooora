import { ActionIcon, Box, Button, Col, Grid, Group, Image, Text, Stack, TextInput,Alert  } from "@mantine/core";
import {Check, Search, X,InfoCircle} from "tabler-icons-react";
import React, {useEffect, useState} from "react";
import { useForm } from "@mantine/form";
import Modal, { Props as ModalProps } from "./Modal";
import {useGetPerson,useAssociatePlayer} from "../../graphql";
import useStore from "../../store/useStore";
import {Notyf} from "notyf";
import {DeletePersonModal} from "./DeletePersonModal"


type Props = {
    setSelectedData?: (id: string) => void;
    data?: any;
} & ModalProps;

export const SearchPerson = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit, setValues} = useForm({
        initialValues: {cardNumber: ""}
    });
    const [loading, setLoading] = useState(false);
    const [person, setPerson] = useState<any>(null);
    const [getPerson, {data, error}] = useGetPerson();

    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
    const [associatePlayer] = useAssociatePlayer();
    useEffect(() => {
        if (data && "person" in data) {
            setPerson(data.person)
            console.log("data:",data)
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
        props.onClose();
        reset();
    };
    const handleAssociatePlayer = () => {
        const notyf = typeof window !== 'undefined' ? new Notyf({ position: { x: "right", y: "bottom" } }) : null;
        console.log("person",person);
        associatePlayer({
          variables: {
            id_player: person?.player?.id,
            id_team: userData?.person?.member?.team?.id,
          },
          onCompleted: () => {
            notyf?.success("تم ربط اللاعب بنجاح");
            closeModal();
          },
          onError: (err) => {
            console.error(err);
            notyf?.error("فشل ربط اللاعب");
          },
        });
      };

   
    
    return (
        <Modal
            size="lg"
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                     {/* Show alert message only if the person is NOT linked to any team */}
                            {person && !person?.player && !person?.technicalApparatus && !person?.member && (
                                <Alert variant="light" color="yellow" icon={<InfoCircle size={16} />}>
                                    هاذ الشخص لا ينتمي لاي فريق يمكنك مسحه
                                </Alert>
                            )}
                    <Group position={"right"} spacing={"xs"}>

                        
                        {person?.player && !person?.player?.team && (
                                <Button
                                color="blue"
                                onClick={handleAssociatePlayer}
                                >
                                ربط بفريق
                                </Button>
                            )}
                        {person && !person?.player && !person?.technicalApparatus && !person?.technicalApparatus && !person?.member  && ( 
                                <Button 
                                    rightIcon={<Check size={15} />} 
                                    bg="red" 
                                    onClick={() => setOpenDeleteModal(true)}
                                >
                                    حذف الشخص
                                </Button>
                            )}
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
                                                ? <Image src={`${process.env.NEXT_PUBLIC_API_URL}/images/${person?.personal_picture}`} alt="" />
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

                                        {person?.player && <Col span={6} >
                                            <Group w={"100%"} noWrap={true}>
                                                <Text color="gray.7" fw={"bold"} size={"sm"}>نوع اللاعب :</Text>
                                                <Text color="gray.7" size={"sm"}>{
                                                        person?.player?.type=== "external"?"محترف":"داخلي"

                                                }</Text>
                                            </Group>
                                        </Col>}
                                        
                                    
                                    </Grid>
                                </Box>
                            </Col>
                            : null
                        }
                        
                    </Grid>
                </form>
                <DeletePersonModal title="حذف المعلومات" opened={openDeleteModal} id={data?.person?.id} onClose={() => setOpenDeleteModal(false)} closeModalParent={closeModal}/>
            </Box>
        </Modal>
    );
};