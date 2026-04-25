import { Alert,Button,Grid,Input,PasswordInput,Stack,Text,useMantineTheme } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconLock,IconMail } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticateClient,useGetCurrentUser } from '../graphql';
import useStore from '../store/useStore';

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

const Login = () => {
    const theme = useMantineTheme();
    const {getInputProps, onSubmit} = useForm({
        initialValues: {email: "", password: ""},
        validateInputOnBlur: true,
        validate: {
            email: (value) => {
                const email = value.trim();
                if (!email) return "البريد الإلكتروني مطلوب.";
                if (!EMAIL_PATTERN.test(email)) return "صيغة البريد الإلكتروني غير صحيحة.";
                return null;
            },
            password: (value) => {
                if (!value) return "كلمة المرور مطلوبة.";
                if (value.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل.";
                return null;
            }
        }
    });

    const [authenticateClientMutation, { loading: authLoading }] = useAuthenticateClient();
    const [getCurrentUserLazy] = useGetCurrentUser();

    const navigate = useNavigate();

    const [alert, setAlert] = useState<{ status?: string; msg?: string; code?: string; }>({});

    let onFormSubmit = ({email, password}: any) => {
        const normalizedEmail = email.trim().toLowerCase();
        setAlert({});
        authenticateClientMutation({
            variables: {
                content: {
                    email: normalizedEmail,
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
                const code = graphQLErrors?.[0]?.extensions?.code as string | undefined;
                setAlert({
                    status: "red",
                    msg: getLoginErrorMessage(code),
                    code: code === "EMAIL_NOT_VERIFY" ? "EMAIL_NOT_VERIFY" : ""
                });
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

                                <Button type={"submit"} fullWidth loading={authLoading} >تسجيل الدخول</Button>
                            </Stack>
                        </form>
                    </Grid.Col>
                </Grid>
            </Grid.Col>
        </Grid>
    )
}

export default Login
