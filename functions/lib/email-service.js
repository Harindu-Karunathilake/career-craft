"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendStatusEmail = void 0;
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});
const sendStatusEmail = async (email, name, status) => {
    const subject = status === 'active'
        ? "Career Craft - Application Approved!"
        : "Career Craft - Application Update";
    const text = status === 'active'
        ? `Hello ${name},\n\nCongratulations! Your application to become a tutor at Career Craft has been approved. You can now log in and start creating courses.\n\nBest regards,\nThe Career Craft Team`
        : `Hello ${name},\n\nThank you for your interest in becoming a tutor at Career Craft. After reviewing your application, we regret to inform you that we cannot move forward at this time.\n\nBest regards,\nThe Career Craft Team`;
    const html = status === 'active'
        ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Congratulations! 🚀</h2>
        <p>Hello ${name},</p>
        <p>Your application to become a tutor at <strong>Career Craft</strong> has been approved.</p>
        <p>You can now log in to your dashboard and start creating courses to share your knowledge.</p>
        <p style="margin-top: 20px;">
          <a href="https://career-craft-ac840.web.app/tutor" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
        </p>
        <p>Best regards,<br>The Career Craft Team</p>
      </div>
    `
        : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Application Update</h2>
        <p>Hello ${name},</p>
        <p>Thank you for your interest in becoming a tutor at <strong>Career Craft</strong>.</p>
        <p>After carefully reviewing your details and CV, we regret to inform you that we are unable to approve your application at this time.</p>
        <p>Best regards,<br>The Career Craft Team</p>
      </div>
    `;
    try {
        await transporter.sendMail({
            from: '"Career Craft" <noreply@careercraft.com>',
            to: email,
            subject,
            text,
            html,
        });
        console.log(`Email sent to ${email} for status ${status}`);
    }
    catch (error) {
        console.error("Error sending email:", error);
        // Silent fail or rethrow depending on requirement. 
        // Since this is triggered by firestore, we don't want to infinite retry if creds are bad.
    }
};
exports.sendStatusEmail = sendStatusEmail;
//# sourceMappingURL=email-service.js.map