import nodemailer from 'nodemailer'
import SibApiV3Sdk from 'sib-api-v3-sdk';


const maileVerificationMail = (token, role) => {
    const url = role === "admin"
        ? `http://localhost:3000/login/verification/${token}`
        : role === "employee"
            ? `http://localhost:3000/login/verification/${token}`
            : role === "supervisor"
                ? `http://localhost:3000/login/verification/${token}`
                : `http://localhost:3000/login/verification/${token}`

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
    const url = role === "admin"
        ? `http://localhost:3000/login/verification/${token}`
        : role === "employee"
            ? `http://localhost:3000/login/verification/${token}`
            : role === "supervisor"
                ? `http://localhost:3000/login/verification/${token}`
                : `http://localhost:3000/login/verification/${token}`

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

/*
export const createMail = async (mail) => {
    try {
        let infoMail = {
            from: '"Qafilaty" <qafilaty@gmail.com>',
            to: mail.to,
            subject: mail.subject,
            //text: mail.text,
            html: mail.type === "Verification" ? maileVerificationMail(mail.token) : maileForgetPassword(mail.token)
        }

        const transporterConfig = {
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        }

        let transporter = nodemailer.createTransport(transporterConfig)

        await transporter.sendMail(infoMail, (err, info) => {
            if(err) {
                console.error(err);
                return err
            }
            return info
        })
    } catch (error) {
        console.error(error)
    }
};
*/

export const createMail = async (mail) => {
    let defaultClient = SibApiV3Sdk.ApiClient.instance;

    // Instantiate the client\
    let apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY || '';

    new SibApiV3Sdk.TransactionalEmailsApi().sendTransacEmail({
        sender: {
            name: "Dorrah",
            email: "hicham5lehouedj@gmail.com"
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
                        "email": "hicham55lehouedj@gmail.com",
                        "name": "Hicham"
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

    }).then(function(data) {
        console.log(data);
    }, function(error) {
        console.error(error);
    });
};
