import {Box, Button, Col, Grid, Group, Select, Stack, Text} from "@mantine/core";
import {Check, ChevronDown, X} from "tabler-icons-react";
import React, {useRef, useState} from "react";
import { useForm } from "@mantine/form";
import TextInput from "../Input/TextInput";
import Modal, { Props as ModalProps } from "./Modal";
import {AllAssembly, useAddAssembly, useGetPerson} from "../../graphql";
import useStore from "../../store/useStore";
import {Notyf} from "notyf";

type Props = {
    setSelectedData?: (id: string) => void;
    setOpenAddModal?: (open: boolean) => void;
} & ModalProps;

export const SearchAssemblyModal = (props: Props) => {
    const userData = useStore((state: any) => state.userData);
    const {getInputProps, reset, onSubmit} = useForm();
    const [getPerson, {data, loading, error}] = useGetPerson();

    const onFormSubmit = ({card_number, type}: any) => {
        if (card_number && card_number !== "") {
            getPerson({
                variables: {
                    cardNumber: card_number
                },
                onCompleted: ({person}) => {
                    console.log(person)
                    //closeModal();
                },
                onError: ({graphQLErrors}) => {
                    console.log(graphQLErrors)
                }
            })
        }
    };

    const closeModal = () => {
        props.onClose();
        reset();
    };

    const openAdd = () => {
        typeof props.setSelectedData === "function" && props.setSelectedData(data)
        closeModal()
        typeof props.setOpenAddModal === "function" && props.setOpenAddModal(true)
    }

    return (
        <Modal
            {...props} onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button rightIcon={<Check size={15} />} type="submit" form="submit_form">بحث</Button>
                        <Button
                            disabled={!(data?.person?.member || data?.person?.player || data?.person?.technicalApparatus)}
                            rightIcon={<Check size={15} />}
                            onClick={openAdd}
                        >التالي</Button>
                    </Group>
                </Box>
            }
        >
            <Box sx={({ colors }) => ({padding: 20})} mb={50}>
                <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                    <Grid gutter={20}>
                        <Col span={12}>
                            <TextInput
                                label="رقم بطاقه الهوية"
                                placeholder="رقم بطاقه الهوية"
                                withAsterisk
                                {...getInputProps("card_number")}
                            />
                        </Col>
                    </Grid>
                </form>

                {data?.person ?
                    <Stack mt={20}>
                        <Text fw={600}>
                            الاسم الكامل:
                            <Text ml={5} fw={500} span={true}>
                                {`${data?.person?.first_name} ${data?.person?.second_name} ${data?.person?.third_name} ${data?.person?.tribe}`}
                            </Text>
                        </Text>
                        <Text fw={600}>
                            نوع العضوية:
                            <Text ml={5} fw={500} span={true}>
                                {data?.person?.member ? 'عضو فريق' : data?.person?.player ? 'لاعب' : data?.person?.technicalApparatus ? 'عضو جهاز فني' : null}
                            </Text>
                        </Text>
                    </Stack>
                    : null
                }
            </Box>
        </Modal>
    );
};