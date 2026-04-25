import Head from 'next/head'
import {Alert, Button, createStyles, Grid, Input, Stack, Text} from "@mantine/core";
import {Checks, X} from "tabler-icons-react";
import React, {useEffect, useState} from "react";

import useStore from "../../../store/useStore";

import {useEmailVerification, useResendEmailVerification} from "../../../graphql";
import Route, { useRouter } from "next/router";
import decode from "jwt-decode";
import {Notyf} from "notyf";

const useStyles = createStyles((theme) => ({
    link: {
        textDecoration: "underline",
        color: theme.colors.cyan[6],
        alignSelf: "flex-end",
        "&:hover": {
            color: theme.colors.orange[4]
        }
    },
    title: {
        color: theme.colors.cyan[6],
        fontSize: theme.fontSizes.lg,
        fontWeight: 600
    },
    loginText: {
        fontSize: theme.fontSizes.md,
        textAlign: "center",
        fontWeight: 600
    }
}));

export default function Verification() {
    const { classes, cx, theme } = useStyles();
    const [emailVerification] = useEmailVerification();
    const [resendEmailVerification] = useResendEmailVerification();

    let route = useRouter();
    const token = route.query.token as string || "";
    const [verification, setVerification] = React.useState<any>(null);

    useEffect(() => {
        emailVerification({
            variables: {
                token
            }
        }).then(({ data: { forgetPassword } }) => {
            setVerification(true)
        }).catch((err) => {
            setVerification(false)
        });
    }, [emailVerification, token]);

    const resendVerificationEmail = () => {
        const notyf = new Notyf({ position: { x: "left", y: "bottom" } });
        const decodedJWT: any = route?.query?.token && decode(route?.query?.token as string || "")

        resendEmailVerification({
            variables: {
                email: decodedJWT?.email
            }
        }).then(({ data: { forgetPassword } }) => {
            notyf.open({message: "تم اعادة ارسال رسالة التحقق تاكد من صندوق الوارد في بريدك الالكتروني", type:"success"});
        }).catch((err) => {
            notyf.open({message: "فشل اعادة ارسال رسالة التحقق", type:"error"});
        });
    }

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: true });
    }, []);

    return (
        <>
            <Head>
                <title>طموح</title>
            </Head>

            <Grid justify="center" align="center" m={0}>

                <Grid.Col span={6} p={0}>
                    <Grid mt={100} justify="center" align="center" p={"md"} sx={{width: "100%"}} >
                        <Grid.Col xs={11} sm={10} md={8} lg={6} xl={4} >
                            {verification ?
                                <Stack justify="center" align="center" >
                                    <Checks size={80} color={"#217670"} />

                                    <Text className={classes.loginText} >
                                        تم التحقق من حسابك يمكنك تسجيل الدخول عبر الضغط على الزر
                                    </Text>

                                    <Button onClick={() => route.push("/login")} variant={"outline"} color="dorrah" loading={false} loaderPosition="center">
                                        تسجيل الدخول
                                    </Button>
                                </Stack>
                                : <Stack justify="center" align="center" >
                                    <X size={80} color={"red"} />

                                    <Text className={classes.loginText} >
                                        فشل التحقق من حسابك
                                    </Text>

                                    <Button onClick={resendVerificationEmail} variant={"outline"} color="red" loading={false} loaderPosition="center">
                                        اعادة ارسال رسالة التحقق
                                    </Button>
                                </Stack>
                            }
                        </Grid.Col>
                    </Grid>
                </Grid.Col>
            </Grid>
        </>
    )
}
