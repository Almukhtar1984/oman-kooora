import React, { useEffect, useState } from "react";
import Head from 'next/head'
import {Grid, createStyles, Text, Alert, Input , Stack, PasswordInput, Button} from '@mantine/core';
import {Phone, Lock, Mail} from "tabler-icons-react";
import {useAuthenticateClient, useGetCurrentUser, useResendEmailVerification} from "../../graphql";

import useStore from "../../store/useStore";

import Link from "next/link";
import {useRouter} from "next/router";
import {useForm} from "react-hook-form";

const useStyles = createStyles((theme) => ({
    link: {
        textDecoration: "underline",
        color: theme.colors.cyan[6],
        alignSelf: "flex-end",
        "&:hover": {
            color: theme.colors.orange[4]
        }
    },
    newAccount: {
        marginTop: theme.spacing.md
    },
    title: {
        color: theme.colors.cyan[6],
        fontSize: theme.fontSizes.lg,
        fontWeight: 600
    },
    loginText: {
        fontSize: theme.fontSizes.xl
    }
}));

const initialValues = {
    email: '',
    password: ''
}

export default function Login() {
    const [authenticateClientMutation, { data }] = useAuthenticateClient();
    const [resendEmailVerficationMutation] = useResendEmailVerification();
    const {register, handleSubmit, control, watch, reset, formState: { errors },} = useForm();

    const [getCurrentUserLazy] = useGetCurrentUser();
    const { classes, cx, theme } = useStyles();
    const router = useRouter()

    const [email, setEmail] = useState("");

    const [alert, setAlert] = useState<{ status?: string; msg?: string; code?: string; }>({});


    useEffect(() => {
        useStore.setState({ isLayoutDisabled: true });
    }, []);

    let onFormSubmit = ({email, password}: any) => {
        setEmail(email)
        authenticateClientMutation({
            variables: {
                content: {
                    email: email,
                    password: password
                }
            }
        }).then(({ data: { authenticateUser } }) => {
                console.log({ authenticateUser })

                useStore.setState({ token: authenticateUser?.token });
                useStore.setState({ isAuth: true });
                getCurrentUserLazy({
                    fetchPolicy: "network-only"
                })
                .then(({ data }) => {
                    useStore.setState({ userData: data?.currentUser });
                    router.push("/");
                });
            },
            (err) => {
                if (err?.graphQLErrors[0]?.extensions?.code == "USER_NOT_EXIST") {
                    setAlert({
                        status: "red",
                        msg: "لا يوجد مستخدم بهاذا الإيميل",
                        code: ""
                    });
                }

                if (err?.graphQLErrors[0]?.extensions?.code == "EMAIL_NOT_VERIFY") {
                    setAlert({
                        status: "red",
                        msg: "هذا الحساب غير مفعل، قم بالتحقق من صندوق البريد لتفعيله.",
                        code: "EMAIL_NOT_VERIFY"
                    });
                }

                if (err?.graphQLErrors[0]?.extensions?.code == "PASSWORD_INCORRECT") {
                    setAlert({
                        status: "red",
                        msg: " كلمة المرور غير صحيحة، يرجى إعادة المحاولة.",
                        code: ""
                    });
                }

                if (err?.graphQLErrors[0]?.extensions?.code == "ACCOUNT_NOT_ACTIVE") {
                    setAlert({
                        status: "red",
                        msg: "تم حظر حسابك من قبل المسؤول",
                        code: ""
                    });
                }
            }
        ).catch((err) => {
            if (err?.graphQLErrors[0]?.extensions?.code == "USER_NOT_EXIST") {
                setAlert({
                    status: "red",
                    msg: "لا يوجد مستخدم بهاذا الإيميل",
                    code: ""
                });
            }

            if (err?.graphQLErrors[0]?.extensions?.code == "EMAIL_NOT_VERIFY") {
                setAlert({
                    status: "red",
                    msg: "هذا الحساب غير مفعل، قم بالتحقق من صندوق البريد لتفعيله.",
                    code: "EMAIL_NOT_VERIFY"
                });
            }

            if (err?.graphQLErrors[0]?.extensions?.code == "PASSWORD_INCORRECT") {
                setAlert({
                    status: "red",
                    msg: " كلمة المرور غير صحيحة، يرجى إعادة المحاولة.",
                    code: ""
                });
            }

            if (err?.graphQLErrors[0]?.extensions?.code == "ACCOUNT_NOT_ACTIVE") {
                setAlert({
                    status: "red",
                    msg: "تم حظر حسابك من قبل المسؤول",
                    code: ""
                });
            }
        })
    };

    const onResendEmailVerfication = () => {
        resendEmailVerficationMutation({
            variables: {
                email: email,
            },
        });
    }

    return (
        <>
            <Head>
                <title>طموح</title>
            </Head>

            <Grid justify="center" align="center" m={0} sx={{height: "100vh"}}>

                <Grid.Col xs={11} sm={10} md={8} lg={6} p={0}>
                    <Grid justify="center" align="center" p={"md"} sx={{width: "100%"}}>
                        <Grid.Col xs={11} sm={10} md={8} lg={6} xl={4} >
                            <form onSubmit={handleSubmit(onFormSubmit, () => console.log("error: ", errors))} id="submit_form">
                                <Stack justify="center" align="center" >
                                    <Text className={classes.title} >تسجيل الدخول</Text>

                                    {alert.status && (
                                        <Alert variant="filled" color={alert.status as string} sx={{ padding: "4px 16px" }} onClose={() => setAlert({})}>
                                            {alert.msg}
                                            {alert.code == "EMAIL_NOT_VERIFY" && (
                                                <Button variant={"subtle"} color="info" onClick={onResendEmailVerfication}>
                                                    إعادة ارسال
                                                </Button>
                                            )}
                                        </Alert>
                                    )}

                                    <Input
                                        icon={<Mail color={theme.colors.gray[4]} />}
                                        variant="default"
                                        type={"email"}
                                        placeholder={"البريد الالكتروني"}
                                        sx={{width: "100%"}}
                                        {...register("email", { required: true })}
                                    />
                                    <PasswordInput
                                        icon={<Lock color={theme.colors.gray[4]} />}
                                        variant="default"
                                        placeholder={"كلمة المرور"}
                                        sx={{width: "100%"}}
                                        {...register("password", { required: true })}
                                    />

                                    <Button type={"submit"} fullWidth color="primary" loading={false} loaderPosition="center">تسجيل الدخول</Button>
                                    <Link href={"/login/forGotPassword"} className={classes.link} >نسيت كلمة المرور؟</Link>
                                </Stack>
                            </form>
                        </Grid.Col>
                    </Grid>
                </Grid.Col>
            </Grid>
        </>
    )
}
