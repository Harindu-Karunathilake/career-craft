import { Router } from "express";
import * as admin from "firebase-admin";
import { z } from "zod";
import { sendEmail } from "../lib/mail";

const router = Router();

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);

        const link = await admin.auth().generatePasswordResetLink(email);

        const result = await sendEmail({
            to: email,
            subject: "Reset your Career Craft password",
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Password Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset the password for your Career Craft account.</p>
          <p>Click the link below to verify your email and set a new password:</p>
          <p>
            <a href="${link}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </p>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">
            If you didn't ask to reset your password, you can safely ignore this email.
          </p>
        </div>
      `,
        });

        if (!result.success) {
            console.error("Failed to send email:", result.error);
            res.status(500).json({ error: "Failed to send reset email. Please try again later." });
            return;
        }

        res.json({ message: "Password reset email sent" });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: "Invalid email address" });
            return;
        }

        // Check for Firebase specific errors (e.g., user not found)
        const err = error as any;
        if (err.code === "auth/user-not-found") {
            // Ideally, don't reveal if user exists, but for now returned generic message
            res.json({ message: "If an account exists, a reset email has been sent." });
            return
        }

        console.error("Forgot password error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
