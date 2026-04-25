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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getLoginErrorMessage = (code?: string) => {
    switch (code) {
        case "AUTHENTICATION_FAILED":
            return "بيانات الدخول غير صحيحة أو الحساب غير متاح.";
        case "ACCOUNT_LOCKED":
            return "تم قفل الحساب مؤقتا بسبب محاولات دخول كثيرة. حاول لاحقا.";
        case "USER_NOT_EXIST":
            return "لا يوجد مستخدم بهذا الإيميل.";
        case "EMAIL_NOT_VERIFY":
            return "هذا الحساب غير مفعل، قم بالتحقق من صندوق البريد لتفعيله.";
        case "PASSWORD_INCORRECT":
            return "كلمة المرور غير صحيحة، يرجى إعادة المحاولة.";
        case "ACCOUNT_NOT_ACTIVE":
            return "تم حظر حسابك من قبل المسؤول.";
        default:
            return "تعذر تسجيل الدخول حالياً. تأكد من البيانات وحاول مرة أخرى.";
    }
}

export default function Login() {
    const [authenticateClientMutation, { loading: authLoading }] = useAuthenticateClient();
    const [resendEmailVerficationMutation] = useResendEmailVerification();
    const {register, handleSubmit, formState: {errors}} = useForm({
        mode: "onTouched"
    });

    const [getCurrentUserLazy] = useGetCurrentUser();
    const { classes, cx, theme } = useStyles();
    const router = useRouter()

    const [email, setEmail] = useState("");

    const [alert, setAlert] = useState<{ status?: string; msg?: string; code?: string; }>({});


    useEffect(() => {
        useStore.setState({ isLayoutDisabled: true });
    }, []);

    let onFormSubmit = ({email, password}: any) => {
        const normalizedEmail = email.trim().toLowerCase();
        setAlert({});
        setEmail(normalizedEmail)
        authenticateClientMutation({
            variables: {
                content: {
                    email: normalizedEmail,
                    password: password
                }
            }
        }).then(({ data: { authenticateUser } }) => {
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
                const code = err?.graphQLErrors?.[0]?.extensions?.code as string | undefined;
                setAlert({
                    status: "red",
                    msg: getLoginErrorMessage(code),
                    code: code === "EMAIL_NOT_VERIFY" ? "EMAIL_NOT_VERIFY" : ""
                });
            }
        ).catch((err) => {
            const code = err?.graphQLErrors?.[0]?.extensions?.code as string | undefined;
            setAlert({
                status: "red",
                msg: getLoginErrorMessage(code),
                code: code === "EMAIL_NOT_VERIFY" ? "EMAIL_NOT_VERIFY" : ""
            });
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
                            <form onSubmit={handleSubmit(onFormSubmit)} id="submit_form">
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
                                        {...register("email", {
                                            required: "البريد الإلكتروني مطلوب.",
                                            setValueAs: (value) => value?.trim(),
                                            pattern: {
                                                value: EMAIL_PATTERN,
                                                message: "صيغة البريد الإلكتروني غير صحيحة."
                                            }
                                        })}
                                    />
                                    {errors.email?.message && (
                                        <Text color="red" size="xs" sx={{alignSelf: "flex-start"}}>{errors.email.message as string}</Text>
                                    )}
                                    <PasswordInput
                                        icon={<Lock color={theme.colors.gray[4]} />}
                                        variant="default"
                                        placeholder={"كلمة المرور"}
                                        sx={{width: "100%"}}
                                        {...register("password", {
                                            required: "كلمة المرور مطلوبة.",
                                            minLength: {
                                                value: 8,
                                                message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل."
                                            }
                                        })}
                                    />
                                    {errors.password?.message && (
                                        <Text color="red" size="xs" sx={{alignSelf: "flex-start"}}>{errors.password.message as string}</Text>
                                    )}

                                    <Button type={"submit"} fullWidth color="primary" loading={authLoading} loaderPosition="center">تسجيل الدخول</Button>
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
