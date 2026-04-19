import React, { useEffect, useState } from "react";
import Head from 'next/head'
import {Grid, createStyles, Text, Stack, PasswordInput, Button} from '@mantine/core';
import {Lock} from "tabler-icons-react";

import useStore from "../../../store/useStore";

import Link from "next/link";
import {useRouter} from "next/router";
import {useChangePassword} from "../../../graphql";
import {useForm} from "react-hook-form";
// import {Notyf} from "notyf";

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

export default function ChangePassword() {
    const { classes, cx, theme } = useStyles();
    const route = useRouter()
    const [changePassword] = useChangePassword();
    const {register, handleSubmit, control, watch, reset, formState: { errors }} = useForm();

    const [alert, setAlert] = useState<{ status?: string; msg?: string; length?: number; code?: string; }>({});

    useEffect(() => {
        useStore.setState({ isLayoutDisabled: true });
    }, []);

    let onFormSubmit = ({password, confirmPassword}: any) => {
        // const notyf = new Notyf({position: {x: "left", y: "bottom"}});

        if (password === confirmPassword) {
            changePassword({
                variables: {
                    content: {
                        token: route.query.token as string || "",
                        password,
                        confirmPassword
                    }
                }
            })
                .then(({ data: { forgetPassword } }) => {
                    // notyf.open({message: langSite.toasts.updateSuccess, type:"success"});
                    route.push("/login")
                }).catch((err) => {
                // notyf.open({message: langSite.toasts.updateError, type:"error"});
            });
        }
    };

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
                                    <Text className={classes.title} >تغيير كلمة المرور</Text>
                                    <PasswordInput
                                        icon={<Lock color={theme.colors.orange[4]} />}
                                        variant="default"
                                        placeholder={"كلمة المرور"}
                                        sx={{width: "100%"}}
                                        {...register("password", { required: true })}
                                    />
                                    <PasswordInput
                                        icon={<Lock color={theme.colors.orange[4]} />}
                                        variant="default"
                                        placeholder={"كلمة المرور الجديد"}
                                        sx={{width: "100%"}}
                                        {...register("confirmPassword", { required: true })}
                                    />
                                    <Button type={"submit"} fullWidth color="dorrah" loading={false} loaderPosition="center">تغيير</Button>
                                    <Link href={"/login"} className={classes.link} >تسجيل الدخول</Link>
                                </Stack>
                            </form>
                        </Grid.Col>
                    </Grid>
                </Grid.Col>
            </Grid>
        </>
    )
}
