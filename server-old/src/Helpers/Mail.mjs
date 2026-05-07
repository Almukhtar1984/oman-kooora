import SibApiV3Sdk from 'sib-api-v3-sdk';

import logger from "../Config/logger.mjs";

const getDashboardUrl = (role) => {
    const dashboardUrls = {
        admin: process.env.ADMIN_URL,
        employee: process.env.EMPLOYEE_URL,
        supervisor: process.env.SUPERVISOR_URL,
        customer: process.env.CUSTOMER_URL
    };
    const baseUrl = dashboardUrls[role] || process.env.ADMIN_URL || "http://localhost:3000";
    return baseUrl.replace(/\/$/, "");
};

const buildAuthUrl = (role, path, token) => {
    return `${getDashboardUrl(role)}/login/${path}/${encodeURIComponent(token)}`;
};

const maileVerificationMail = (token, role) => {
    const url = buildAuthUrl(role, "verification", token);

    return `
        <body style="width: 90%;  text-align: center; background: #eee; padding: 80px 20px; font-family: 'Changa', sans-serif;">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Changa:wght@300&display=swap" rel="stylesheet">
            <h1 style="text-align: center;  margin: 50px auto 30px;" >التحقق من البريد الالكتروني</h1>
            <h5 style="font-size: 18px; margin-bottom: 50px;" >اضغط على زر تحقق للتحقق من انك انت صاحب الحساب</h5>
            <a href="${url}" style="background-color: #217670; color: #fff; padding: 10px 45px; font-size: 20px; text-decoration: none;" class="btn">تحقق</a>
        </body>
    `
}

const maileForgetPassword = (token, role) => {
    const url = buildAuthUrl(role, "changePassword", token);

    return `
        <body style="width: 90%;  text-align: center; background: #eee; padding: 80px 20px; font-family: 'Changa', sans-serif;">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Changa:wght@300&display=swap" rel="stylesheet">
            <h1 style="text-align: center;  margin: 50px auto 30px;" >تغيير كلمة المرور</h1>
            <h5 style="font-size: 18px; margin-bottom: 50px;" >اضغط على زر تغيير كلمة المرور لتتمكن من إنشاء كلمة مرور جديدة</h5>
            <a href="${url}" style="background-color: #217670; color: #fff; padding: 10px 45px; font-size: 20px; text-decoration: none;" class="btn">تغيير كلمة المرور</a>
        </body>
    `
}

export const createMail = async (mail) => {
    let defaultClient = SibApiV3Sdk.ApiClient.instance;

    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY || '';

    const senderName = process.env.MAIL_FROM_NAME || "Dorrah";
    const senderEmail = process.env.MAIL_FROM_EMAIL || "";
    const recipientEmail = mail.to || process.env.MAIL_DEFAULT_TO_EMAIL || "";
    const recipientName = mail.name || process.env.MAIL_DEFAULT_TO_NAME || "Recipient";

    if (!apiKey.apiKey || !senderEmail || !recipientEmail) {
        logger.warn("Mail transport is not configured");
        return;
    }

    new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail({
        sender: {
            name: senderName,
            email: senderEmail
        },
        subject: "This is my default subject line",
        htmlContent: mail.type === "Verification" ? maileVerificationMail(mail.token, mail.role) : maileForgetPassword(mail.token, mail.role),
        params:{
            greeting: "This is the default greeting",
            headline: "This is the default headline"
        },
        messageVersions:[
            {
                "to":[
                    {
                        "email": recipientEmail,
                        "name": recipientName
                    }
                ],
                "htmlContent": mail.type === "Verification" ? maileVerificationMail(mail.token) : maileForgetPassword(mail.token),
                "subject":"We are happy to be working with you"
            },

            // Definition for Message Version 2
            /*{
                "to":[
                    {
                        "email":"jim@example.com",
                        "name":"Jim Stevens"
                    },
                    {
                        "email":"mark@example.com",
                        "name":"Mark Payton"
                    },
                    {
                        "email":"andrea@example.com",
                        "name":"Andrea Wallace"
                    }
                ]
            }*/
        ]

    }).then(function() {
        logger.info("Verification email sent");
    }, function() {
        logger.error("Unable to send verification email");
    });
};
