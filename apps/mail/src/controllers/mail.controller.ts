import { success, ResultSuccess } from "app";
import nodemailer from "nodemailer";
import { configs } from "../configs";
import { google } from "googleapis";
import SMTPTransport from "nodemailer/lib/smtp-transport";

async function transport(): Promise<
    nodemailer.Transporter<SMTPTransport.SentMessageInfo>
> {
    const oAuth2Client = new google.auth.OAuth2(
        configs.mail.client_id,
        configs.mail.client_secret,
        configs.mail.redirect_uri
    );

    oAuth2Client.setCredentials({ refresh_token: configs.mail.refresh_token });

    const accessToken = await oAuth2Client.getAccessToken();
    const transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            type: "OAuth2",
            user: "trongquangvu80@gmail.com",
            clientId: configs.mail.client_id,
            clientSecret: configs.mail.client_secret,
            refreshToken: configs.mail.refresh_token,
            accessToken: accessToken,
        },
    } as SMTPTransport.Options);

    return transport;
}

export async function sendMailGoogleForgotPassword(params: {
    password: string;
    username: string;
    email: string;
}): Promise<ResultSuccess> {
    await (
        await transport()
    ).sendMail({
        from: `ToolsDeploy`,
        to: `${params.email}`,
        subject: `[ToolsDeploy] Đặt lại mật khẩu cho tài khoản của bạn`,
        html: `
        <div>Chào ${params.username}[${params.email}],</div>
        <br/>
        <div>
            <span>Gần đây bạn có yêu cầu tạo lại mật khẩu tài khoản của bạn trên hệ thống ToolsDeploy, hệ thống đã tạo lại mật khẩu mới cho bạn như sau: </span>
            <div>${params.password}</div>
        </div>
        <br/>
        <div>Trân trọng,</div>
        <div>IT ToolsDeploy Team.</div>`,
    });
    return success.ok({ message: "successful" });
}

export async function sendMailGoogleNewAccount(params: {
    password: string;
    username: string;
    email: string;
}): Promise<ResultSuccess> {
    await (
        await transport()
    ).sendMail({
        from: `ToolsDeploy`,
        to: `${params.email}`,
        subject: `[ToolsDeploy] Đăng kí tài khoản với Github`,
        html: `
        <div>Chào ${params.username}[${params.email}],</div>
        <br/>
        <div>
            <span>Gần đây bạn có yêu cầu tạo tài khoản với Github của bạn trên hệ thống ToolsDeploy, thông tin đăng nhập hệ thống cho bạn như sau: </span>
            <div>email: ${params.email}</div>
            <div>password: <span class="gD">${params.password}</span></div>
        </div>
        <br/>
        <div>Trân trọng,</div>
        <div>IT ToolsDeploy Team.</div>`,
    });
    return success.ok({ message: "successful" });
}
