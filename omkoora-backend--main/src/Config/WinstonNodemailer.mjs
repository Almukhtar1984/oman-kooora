import Transport  from 'winston-transport'
import nodemailer from 'nodemailer'

export default class WinstonNodemailer extends Transport {

    constructor(props){
        super(props)
        this.name = 'WinstonNodemailer'
        this.level = 'error'
    }


    log(info, next){
        setImmediate(() => this.sendMail(info));
    }

    sendMail(msg) {
        const { message, level, service, timestamp } = msg

        try {
            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: {user: process.env.SMTP_USER, pass: process.env.SMTP_PASS}
            })

            let infoMail = {
                from: '"IT-HASH" <support@qafilaty.com>',
                to: 'hicham5lehouedj@gmail.com',
                subject: 'Error notice in api Qafilaty',
                html: `
                    <table style="width: 100%;">
                        <thead>
                            <th style="background: #c62828; padding: 10px; color: #fff; font-size: 18px;">${level.toUpperCase()}</th>
                        </thead>
                        <tbody>
                            <td style="background: #eee; padding: 20px 10px;">
                                <p style="background: #eee; color: #333; font-size: 16px; margin-bottom: 10px;"><b>file : </b>${message.file}</p><br/>
                                <p style="background: #eee; color: #333; font-size: 16px; margin-bottom: 10px;"><b>function : </b>${message.function}</p><br/>
                                <p style="background: #eee; color: #333; font-size: 16px; margin-bottom: 10px;"><b>error : </b>${message.error}</p><br/>
                                <p style="background: #eee; color: #333; font-size: 16px; margin-bottom: 10px;"><b>User : </b>${message.user || ""}</p><br/>
                                <p style="background: #eee; color: #333; font-size: 16px; margin-bottom: 10px;"><b>lines : </b>${message.lines}</p><br/>
                            </td>
                        </tbody>
                        <tfoot>
                            <td style="background: #c4c4c4; padding: 5px 10px; color: #333; font-size: 14px; text-align: center;">[ ${timestamp} ]</td>
                        </tfoot>
                    </table>
                `
            }

            transporter.sendMail(infoMail, (err, info) => {
                if (err) this.emit('error', err)
                this.emit('logged')
                next(null, true)
            })
        } catch(err) {
            this.emit('error', err)
        }
    }
}