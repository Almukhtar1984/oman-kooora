import {Box, Button, Col, Grid, Group, Select, Text, TextInput, useMantineTheme} from "@mantine/core";
import { Check, X } from "tabler-icons-react";
import React, { useEffect, useState } from "react";
import Modal, { Props as ModalProps } from "./Modal";
import {AllBlog, useAllTeams, useDeleteBlog} from "../../graphql";
import { useForm } from "@mantine/form";
import useStore from "../../store/useStore";
import { useRouter } from "next/router";

type Props = {
    data?: any;
} & ModalProps;

export const PrintModal = ({ data, ...props }: Props) => {
    const userData = useStore((state: any) => state.userData);
    const router = useRouter()
    const {getInputProps, reset, values} = useForm({
        initialValues: {team: "", class_name: ""}
    });
    const [allTeams, setAllTeams] = useState<{value: string, label: string}[]>([]);
    const [url, setUrl] = useState<string>("");
    const [getAllTeam, { data: dataAllTeams }] = useAllTeams();
    const [ageCheck, setAgeCheck] = useState<string>("");
    const [age2Check, setAge2Check] = useState<string | null>("<");

    useEffect(() => {
        if (userData?.person?.clubManagement?.club?.id) {
            const idClub = userData?.person?.clubManagement?.club?.id;
            getAllTeam({variables: {idClub}})
        }
    }, [userData])

    useEffect(() => {
        if (dataAllTeams && "allTeam" in dataAllTeams) {
            let newAllTeams: {value: string, label: string}[] = []
            for (let index = 0; index < dataAllTeams.allTeam.length; index++) {
                const element = dataAllTeams.allTeam[index];
                newAllTeams.push({value: element?.id, label: element?.name})
            }
            setAllTeams([...newAllTeams])
        }
    }, [dataAllTeams])

    const closeModal = () => {
       
        setTimeout(() => {
            props.onClose();
            reset();
        }, 2000);
    };

    return (
        <Modal
            {...props}
            onClose={closeModal}
            footer={
                <Box py={16} px={20} bg="slate.0">
                    <Group position={"right"} spacing={"xs"}>
                        <Button variant="outline" rightIcon={<X size={15} />} bg="white" onClick={closeModal}>إلغاء</Button>
                        <Button 
                            rightIcon={<Check size={15} />}
                            bg={"primary"}
                            component={"a"}
                            href={`https://print.omkooora.com/#/players/${values.team}/team/${values.class_name}/${age2Check}/${ageCheck === "" ? "0" : ageCheck}`}
                            target={"_blank"}
                            onClick={closeModal}
                        >طباعة</Button>
                    </Group>
                </Box>
            }
            size="md"
        >
            <Box sx={({ colors }) => ({padding: "20px 20px 100px"})}>
                <Grid gutter={20}>
                    <Col span={6} >
                        <Select
                            placeholder="الفريق"
                            label="الفريق"
                            data={allTeams}
                            withAsterisk
                            {...getInputProps("team")}
                        />
                    </Col>
                    <Col span={6} >
                        <Select
                            label="الفئة العمرية"
                            placeholder="الفئة العمرية"
                            data={[
                                {label: "الكل", value: "all"},
                                {label: "الفريق الاول", value: "firstDegree"},
                                {label: "تحت 23 سنة", value: "secondDegree"},
                                {label: "تحت 18 سنة", value: "young"},
                                {label: "تحت 16 سنة", value: "rookies"},
                                {label: "فئة خاصة", value: "custom"}
                            ]}
                            withAsterisk
                            {...getInputProps("class_name")}
                        />
                    </Col>

                    {values.class_name === "custom"
                        ? <>
                            <Col span={6} >
                                <Select
                                    value={age2Check}
                                    onChange={setAge2Check}
                                    data={[
                                        {label: "اقل من", value: "<"},
                                        {label: "اكبر من", value: ">"}
                                    ]}
                                    withAsterisk
                                />
                            </Col>
                            <Col span={6} >
                                <TextInput
                                    placeholder="العمر"
                                    value={ageCheck}
                                    onChange={(event) => setAgeCheck(event.currentTarget.value)}
                                    withAsterisk
                                />
                            </Col>
                        </>
                        : null
                    }
                </Grid>
            </Box>
        </Modal>
    );
};