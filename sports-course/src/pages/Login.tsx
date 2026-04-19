import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { Button, Grid, Input, PasswordInput, useMantineTheme, Stack, Alert, Text } from '@mantine/core';
import { IconLock, IconMail } from '@tabler/icons-react';
import { useAuthenticateClient, useGetCurrentUser } from '../graphql';
import { useForm } from '@mantine/form';
import useStore from '../store/useStore';

const Login = () => {
    const theme = useMantineTheme();
    const {getInputProps, onSubmit} = useForm({
        initialValues: {email: "", password: ""}
    });

    const [authenticateClientMutation] = useAuthenticateClient();
    const [getCurrentUserLazy] = useGetCurrentUser();

    const navigate = useNavigate();

    const [alert, setAlert] = useState<{ status?: string; msg?: string; code?: string; }>({});

    let onFormSubmit = ({email, password}: any) => {
        authenticateClientMutation({
            variables: {
                content: {
                    email: email,
                    password: password
                }
            },
            onCompleted: ({ authenticateUser }) => {
                useStore.setState({ token: authenticateUser?.token });
                useStore.setState({ isAuth: true });
                getCurrentUserLazy({
                    fetchPolicy: "network-only",
                    onCompleted: ({currentUser}) => {
                        useStore.setState({ userData: currentUser });
                        setAlert({ status: "green", msg: "تم تسجيل الدخول انتظر ثواني", code: "" });
                        navigate("/dashboard");
                    }
                })
            },
            onError: ({graphQLErrors}) => {
                if (graphQLErrors[0]?.extensions?.code === "USER_NOT_EXIST") {
                    setAlert({ status: "red", msg: "لا يوجد مستخدم بهاذا الإيميل", code: "" });
                }

                if (graphQLErrors[0]?.extensions?.code === "EMAIL_NOT_VERIFY") {
                    setAlert({ status: "red", msg: "هذا الحساب غير مفعل، قم بالتحقق من صندوق البريد لتفعيله.", code: "EMAIL_NOT_VERIFY" });
                }

                if (graphQLErrors[0]?.extensions?.code === "PASSWORD_INCORRECT") {
                    setAlert({ status: "red", msg: " كلمة المرور غير صحيحة، يرجى إعادة المحاولة.", code: "" });
                }

                if (graphQLErrors[0]?.extensions?.code === "ACCOUNT_NOT_ACTIVE") {
                    setAlert({ status: "red", msg: "تم حظر حسابك من قبل المسؤول", code: "" });
                }
            }
        })
    };

    return (
        <Grid justify="center" align="center" m={0} style={{height: "100vh", display: "flex"}}>
            <Grid.Col span={{ base: 11, md: 8, lg: 6, xl: 6 }} p={0}>
                <Grid justify="center" align="center" p={"md"} style={{width: "100%"}}>
                    <Grid.Col span={{ base: 11, sm: 10, md: 8, lg: 6, xl: 4 }} >
                        <form onSubmit={onSubmit(onFormSubmit)} id="submit_form">
                            <Stack justify="center" align="center" >
                                <Text style={{color: theme.colors.cyan[6], fontSize: theme.fontSizes.lg, fontWeight: 600 }} >تسجيل الدخول</Text>

                                {alert.status && (
                                    <Alert variant="filled" color={alert.status as string} style={{ padding: "4px 16px" }} onClose={() => setAlert({})}>
                                        {alert.msg}
                                    </Alert>
                                )}

                                <Input
                                    leftSection={<IconMail color={theme.colors.gray[4]} />}
                                    variant="default"
                                    type={"email"}
                                    placeholder={"البريد الالكتروني"}
                                    style={{width: "100%"}}
                                    {...getInputProps("email")}
                                />
                                <PasswordInput
                                    leftSection={<IconLock color={theme.colors.gray[4]} />}
                                    variant="default"
                                    placeholder={"كلمة المرور"}
                                    style={{width: "100%"}}
                                    {...getInputProps("password")}
                                />

                                <Button type={"submit"} fullWidth loading={false} >تسجيل الدخول</Button>
                            </Stack>
                        </form>
                    </Grid.Col>
                </Grid>
            </Grid.Col>
        </Grid>
    )
}

export default Login