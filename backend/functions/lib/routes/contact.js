"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin = require("firebase-admin");
const mail_1 = require("../lib/mail");
const router = (0, express_1.Router)();
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
router.post("/", async (req, res) => {
    try {
        const { name, email, topic, message } = req.body;
        if (!name || !email || !topic || !message) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }
        // 1. Save to Firestore
        const docRef = await db.collection("contact_messages").add({
            name,
            email,
            topic,
            message,
            createdAt: new Date(),
            status: "unread",
        });
        // 2. Send Email Notification
        const supportEmail = process.env.SMTP_USER;
        if (supportEmail) {
            await (0, mail_1.sendEmail)({
                to: supportEmail,
                subject: `New Contact Form Submission: ${topic}`,
                html: `
                    <h2>New Message from Career Craft</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Topic:</strong> ${topic}</p>
                    <br/>
                    <p><strong>Message:</strong></p>
                    <p style="white-space: pre-wrap;">${message}</p>
                    <br/>
                    <p><small>Message ID: ${docRef.id}</small></p>
                `,
            });
        }
        res.json({ success: true, id: docRef.id });
    }
    catch (error) {
        console.error("Error processing contact form:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.default = router;
//# sourceMappingURL=contact.js.map