import React, { useEffect, useState } from "react";
import Head from 'next/head'
import {Grid, createStyles, Text, Alert, Input , Stack, PasswordInput, Button, Tabs} from '@mantine/core';
import {Phone, Lock, Mail, Id} from "tabler-icons-react";
import {useAuthenticateClient, useGetCurrentUser, useResendEmailVerification, useAuthenticatePortalPerson, usePortalMe} from "../../graphql";

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

const getPortalErrorMessage = (code?: string) => {
    switch (code) {
        case "PORTAL_NOT_FOUND":
            return "لا يوجد عضو مسجّل بهذا الهاتف والرقم المدني. تأكد من الرقمين، أو راجع ناديك لتحديث بياناتك.";
        case "PORTAL_NOT_REGISTERED":
            return "بياناتك موجودة لكنك غير مسجّل في أي نادٍ أو فريق حالياً.";
        case "PORTAL_AMBIGUOUS":
            return "هناك أكثر من سجل بنفس الهاتف والرقم المدني. راجع ناديك لتصحيح البيانات.";
        case "PORTAL_TOO_MANY_ATTEMPTS":
            return "محاولات كثيرة. انتظر عشر دقائق ثم حاول مرة أخرى.";
        case "PORTAL_MISSING_FIELDS":
            return "أدخل رقم الهاتف والرقم المدني.";
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

    // Members sign in with the phone number and civil ID their club already
    // holds on file — no email account is created for them.
    const [authenticatePortalPerson, { loading: portalLoading }] = useAuthenticatePortalPerson();
    const [getPortalMe] = usePortalMe();
    const portalForm = useForm({ mode: "onTouched" });

    const [getCurrentUserLazy] = useGetCurrentUser();
    const { classes, cx, theme } = useStyles();
    const router = useRouter()

    const [email, setEmail] = useState("");

    const [alert, setAlert] = useState<{ status?: string; msg?: string; code?: string; }>({});
    const [portalAlert, setPortalAlert] = useState<{ status?: string; msg?: string; }>({});


    useEffect(() => {
        useStore.setState({ isLayoutDisabled: true });
    }, []);

    const onPortalSubmit = ({ phone, card_number }: any) => {
        setPortalAlert({});
        authenticatePortalPerson({
            variables: {
                phone: String(phone ?? "").trim(),
                card_number: String(card_number ?? "").trim(),
            }
        }).then(({ data }: any) => {
            const token = data?.authenticatePortalPerson?.token;
            if (!token) {
                setPortalAlert({ status: "red", msg: getPortalErrorMessage() });
                return;
            }
            applyNewToken(token);
            getPortalMe({ fetchPolicy: "network-only" })
                .then(({ data: meData }: any) => {
                    useStore.setState({ portalData: meData?.portalMe, userData: {} });
                    router.push("/me");
                });
        }).catch((err: any) => {
            const code = err?.graphQLErrors?.[0]?.extensions?.code as string | undefined;
            setPortalAlert({ status: "red", msg: getPortalErrorMessage(code) });
        });
    };

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

            <div className="auth">
                <aside className="auth-brand">
                    <span className="net" /><span className="ring a" /><span className="ring b" /><span className="pitch" />
                    <div className="mark"><span className="mk">⚽</span> طموح</div>
                    <div className="hero">
                        <span className="eyebrow">منصّة طموح الرياضية</span>
                        <h2>لاعبو طموح</h2>
                        <p>تابع ناديك ومبارياتك وبياناتك — سجّل الدخول كعضو نادٍ أو بحساب بريدك.</p>
                    </div>
                    <div className="foot"><span>© طموح</span><span>omkooora.com</span></div>
                </aside>
                <div className="auth-form">
                    <div className="auth-card-m">
                            <Stack justify="center" align="center" spacing="md">
                                <Text className={classes.title} >تسجيل الدخول</Text>

                                <Tabs defaultValue="member" variant="pills" radius="md" sx={{ width: "100%" }}>
                                    <Tabs.List grow mb="md">
                                        <Tabs.Tab value="member">عضو النادي</Tabs.Tab>
                                        <Tabs.Tab value="account">حساب بالبريد</Tabs.Tab>
                                    </Tabs.List>

                                    <Tabs.Panel value="member">
                                        <form onSubmit={portalForm.handleSubmit(onPortalSubmit)} id="portal_form">
                                            <Stack justify="center" align="center">
                                                <Text size="sm" color="dimmed" align="center">
                                                    ادخل برقم هاتفك ورقمك المدني المسجّلين لدى ناديك
                                                </Text>

                                                {portalAlert.status && (
                                                    <Alert variant="filled" color={portalAlert.status as string} sx={{ padding: "4px 16px" }} onClose={() => setPortalAlert({})}>
                                                        {portalAlert.msg}
                                                    </Alert>
                                                )}

                                                <Input
                                                    icon={<Phone color={theme.colors.gray[4]} />}
                                                    variant="default"
                                                    type={"tel"}
                                                    inputMode="numeric"
                                                    placeholder={"رقم الهاتف"}
                                                    sx={{width: "100%"}}
                                                    {...portalForm.register("phone", {
                                                        required: "رقم الهاتف مطلوب.",
                                                        setValueAs: (value) => String(value ?? "").trim(),
                                                    })}
                                                />
                                                {portalForm.formState.errors.phone?.message && (
                                                    <Text color="red" size="xs" sx={{alignSelf: "flex-start"}}>
                                                        {portalForm.formState.errors.phone.message as string}
                                                    </Text>
                                                )}

                                                <Input
                                                    icon={<Id color={theme.colors.gray[4]} />}
                                                    variant="default"
                                                    inputMode="numeric"
                                                    placeholder={"الرقم المدني"}
                                                    sx={{width: "100%"}}
                                                    {...portalForm.register("card_number", {
                                                        required: "الرقم المدني مطلوب.",
                                                        setValueAs: (value) => String(value ?? "").trim(),
                                                    })}
                                                />
                                                {portalForm.formState.errors.card_number?.message && (
                                                    <Text color="red" size="xs" sx={{alignSelf: "flex-start"}}>
                                                        {portalForm.formState.errors.card_number.message as string}
                                                    </Text>
                                                )}

                                                <Button type={"submit"} fullWidth color="primary" loading={portalLoading} loaderPosition="center">
                                                    دخول
                                                </Button>
                                            </Stack>
                                        </form>
                                    </Tabs.Panel>

                                    <Tabs.Panel value="account">
                                        <form onSubmit={handleSubmit(onFormSubmit)} id="submit_form">
                                            <Stack justify="center" align="center" >
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
                                    </Tabs.Panel>
                                </Tabs>
                            </Stack>
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
