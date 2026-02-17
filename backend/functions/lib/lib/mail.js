"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.transporter = void 0;
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();
const smtpConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
};
exports.transporter = nodemailer.createTransport(smtpConfig);
async function sendEmail({ to, subject, html, text }) {
    try {
        const info = await exports.transporter.sendMail({
            from: `"Career Craft" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text: text || html.replace(/<[^>]*>?/gm, ""),
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    }
    catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
}
exports.sendEmail = sendEmail;
//# sourceMappingURL=mail.js.map