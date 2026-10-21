import React, { useEffect, useState } from "react";
import Head from 'next/head'
import {Grid, createStyles, Text, Alert, Input , Stack, PasswordInput, Button} from '@mantine/core';
import {Phone, Lock, Mail} from "tabler-icons-react";
import {useAuthenticateClient, useGetCurrentUser, useResendEmailVerification} from "../../graphql";

import useStore from "../../store/useStore";
import { applyNewToken } from "../../lib/helpers/authToken";

import Link from "next/link";
import {useRouter} from "next/router";
import {useForm} from "react-hook-form";

const useStyles = createStyles((theme) => ({
    link: {
        textDecoration: "underline",
        color: "#0f766e",
        alignSelf: "flex-end",
        "&:hover": {
            color: theme.colors.orange[4]
        }
    },
    newAccount: {
        marginTop: theme.spacing.md
    },
    title: {
        color: "#0f766e",
        fontSize: "26px",
        fontWeight: 800
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

                if (authenticateUser?.token) {
                    applyNewToken(authenticateUser.token);
                }
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

                if (err?.graphQLErrors[0]?.extensions?.code == "CLUB_NOT_ACTIVE") {
                    setAlert({
                        status: "red",
                        msg: "تم حظر حساب النادي",
                        code: ""
                    });
                }

                if (err?.graphQLErrors[0]?.extensions?.code == "MEMBERSHIP_DATE_END") {
                    setAlert({
                        status: "red",
                        msg: "تم حظر حساب النادي. بسبب نهاية الاشتراك.",
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

            <div className="auth">
                <aside className="auth-brand">
                    <span className="net" /><span className="ring a" /><span className="ring b" /><span className="pitch" />
                    <div className="mark"><span className="mk">⚽</span> طموح</div>
                    <div className="hero">
                        <span className="eyebrow">منصّة طموح الرياضية</span>
                        <h2>نادي طموح</h2>
                        <p>أدِر ناديك وفِرقه ولاعبيه واعتماداته من مكان واحد.</p>
                    </div>
                    <div className="foot"><span>© طموح</span><span>omkooora.com</span></div>
                </aside>
                <div className="auth-form">
                    <div className="auth-card-m">
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
                    </div>
                </div>
                <style dangerouslySetInnerHTML={{ __html: `
.auth{min-height:100vh;display:grid;grid-template-columns:1fr 1fr;direction:rtl;background:#fff}
.auth *{box-sizing:border-box}
.auth-brand{position:relative;overflow:hidden;color:#eafaf4;padding:46px 50px;display:flex;flex-direction:column;justify-content:space-between;background:radial-gradient(720px 340px at 85% -15%, rgba(134,239,172,.20), transparent 62%),linear-gradient(155deg,#0d6a62 0%,#0f766e 46%,#0a3f3a 100%)}
.auth-brand .net{position:absolute;inset:0;pointer-events:none;opacity:.5;background-image:linear-gradient(rgba(255,255,255,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.07) 1px,transparent 1px);background-size:40px 40px;-webkit-mask-image:radial-gradient(circle at 74% 30%, #000 8%, transparent 72%);mask-image:radial-gradient(circle at 74% 30%, #000 8%, transparent 72%)}
.auth-brand .ring{position:absolute;border:2px solid rgba(255,255,255,.13);border-radius:50%;pointer-events:none}
.auth-brand .ring.a{width:330px;height:330px;top:-120px;left:-108px}
.auth-brand .ring.b{width:140px;height:140px;top:-30px;left:10px;border-color:rgba(255,255,255,.08)}
.auth-brand .pitch{position:absolute;bottom:-1px;right:0;left:0;height:118px;pointer-events:none;opacity:.55;background:linear-gradient(90deg,transparent calc(50% - 1px),rgba(255,255,255,.2) 50%,transparent calc(50% + 1px)),radial-gradient(130px 130px at 50% 100%, transparent 60px, rgba(255,255,255,.2) 61px, rgba(255,255,255,.2) 63px, transparent 64px)}
.auth-brand .mark{position:relative;display:flex;align-items:center;gap:13px;font-weight:800;font-size:23px;letter-spacing:.3px}
.auth-brand .mark .mk{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;font-size:24px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3)}
.auth-brand .hero{position:relative;max-width:32ch}
.auth-brand .hero .eyebrow{display:inline-block;font-size:12px;font-weight:700;letter-spacing:1.4px;color:rgba(234,250,244,.74);background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.17);padding:5px 13px;border-radius:999px;margin-bottom:18px}
.auth-brand .hero h2{font-size:clamp(27px,3.2vw,38px);font-weight:800;line-height:1.24;margin:0 0 14px;color:#fff}
.auth-brand .hero p{font-size:15.5px;line-height:1.8;color:rgba(234,250,244,.82);margin:0}
.auth-brand .foot{position:relative;font-size:12.5px;color:rgba(234,250,244,.58);display:flex;gap:18px}
.auth-form{display:flex;align-items:center;justify-content:center;padding:40px 30px;background:#f3f7f8}
.auth-card-m{width:100%;max-width:400px}
.auth-card-m form{width:100%}
.auth-card-m button[type="submit"]{background:linear-gradient(135deg,#0f766e,#115e59)!important;border:none!important;height:46px;font-weight:800;font-size:16px;box-shadow:0 12px 26px rgba(15,118,110,.3)}
@media(max-width:880px){.auth{grid-template-columns:1fr}.auth-brand{min-height:200px;padding:28px 26px}.auth-brand .hero{display:none}.auth-brand .foot{display:none}.auth-brand .ring.a{width:210px;height:210px;top:-86px;left:-78px}.auth-brand .pitch{height:76px}.auth-form{padding:34px 22px}}
` }} />
            </div>
        </>
    )
}
