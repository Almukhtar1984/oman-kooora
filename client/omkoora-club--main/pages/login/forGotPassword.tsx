import Head from 'next/head'
import {Alert, Button, createStyles, Grid, Input, Stack, Text} from "@mantine/core";
import {Mail} from "tabler-icons-react";
import React, {useEffect, useState} from "react";

import useStore from "../../store/useStore";
import {useForgetPassword} from "../../graphql";
import {useForm} from "react-hook-form";

const useStyles = createStyles((theme) => ({
    link: {
        textDecoration: "underline",
        color: theme.colors.gray[6],
        alignSelf: "flex-end",
        "&:hover": {
            color: theme.colors.orange[4]
        }
    },
    title: {
        color: theme.colors.gray[6],
        fontSize: theme.fontSizes.lg,
        fontWeight: 600
    },
    loginText: {
        fontSize: theme.fontSizes.xl
    }
}));

export default function ForGotPassword() {
    const { classes, cx, theme } = useStyles();
    const [forgetPassword] = useForgetPassword();
    const {register, handleSubmit, control, watch, reset, formState: { errors }} = useForm();

    const [alert, setAlert] = useState<{ status?: string; msg?: string; length?: number; code?: string; }>({});

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: true });
    }, []);

    let onFormSubmit = ({ email }: any) => {
        forgetPassword({
            variables: {
                email: email || ""
            }
        }).then(({ data: { forgetPassword } }) => {
            setAlert({status: "primary", msg: `تم ارسال رسالة التحقق الى ${email} تاكد من صندوق الرسائل لديك`});
        }).catch((err) => {
            if (err?.graphQLErrors[0]?.extensions?.code == "USER_NOT_EXIST") {
                setAlert({status: "red", msg: "لا يوجد مستخدم مرتبط بهذا البريد الالكتروني",});
            }
        });
    }

    return (
        <>
            <Head>
                <title>طموح</title>
            </Head>

            <Grid justify="center" align="center" m={0} sx={{height: "100vh"}}>
                <Grid.Col xs={11} sm={10} md={8} lg={6} p={0}>
                    <Grid justify="center" align="center" p={"md"} sx={{width: "100%"}} >
                        <Grid.Col xs={11} sm={10} md={8} lg={6} xl={4} >
                            <form onSubmit={handleSubmit(onFormSubmit, () => console.log("error: ", errors))} id="submit_form">
                                <Stack justify="center" align="center" >
                                    <Text className={classes.title} >نسية كلمة المرور</Text>

                                    {alert.status && (
                                        <Alert variant="filled" color={alert.status as string} sx={{ padding: "4px 16px" }} onClose={() => setAlert({})}>
                                            {alert.msg}
                                        </Alert>
                                    )}

                                    <Input
                                        icon={<Mail color={theme.colors.orange[4]} />}
                                        variant="default"
                                        placeholder={"البريد الالكتروني"}
                                        sx={{width: "100%"}}
                                        {...register("email", { required: true })}
                                    />
                                    <Button type={"submit"} fullWidth color="primary" loading={false} loaderPosition="center">إرسال</Button>
                                    <Text size={"xs"}>سيتم إرسال رابط استعادة كلمة المرور الى بريدك الإلكتروني المسجل لدينا</Text>
                                </Stack>
                            </form>
                        </Grid.Col>
                    </Grid>
                </Grid.Col>
            </Grid>
        </>
    )
}
