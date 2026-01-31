import nodemailer from "nodemailer"

const smtpConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
}

export const transporter = nodemailer.createTransport(smtpConfig)

export interface EmailOptions {
    to: string
    subject: string
    html: string
    text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
    try {
        const info = await transporter.sendMail({
            from: `"Career Craft" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text: text || html.replace(/<[^>]*>?/gm, ""), // Fallback text generation
            html,
        })
        console.log("Message sent: %s", info.messageId)
        return { success: true, messageId: info.messageId }
    } catch (error) {
        console.error("Error sending email:", error)
        return { success: false, error }
    }
}
