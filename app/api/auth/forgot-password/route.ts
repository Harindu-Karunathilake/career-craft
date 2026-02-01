import { NextResponse } from "next/server"
import { adminAuth } from "@/lib/firebase-admin"
import { sendEmail } from "@/lib/mail"
import { z } from "zod"

const forgotPasswordSchema = z.object({
    email: z.string().email(),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email } = forgotPasswordSchema.parse(body)

        const link = await adminAuth.generatePasswordResetLink(email)

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
        })

        if (!result.success) {
            console.error("Failed to send email:", result.error)
            return NextResponse.json(
                { error: "Failed to send reset email. Please try again later." },
                { status: 500 }
            )
        }

        return NextResponse.json({ message: "Password reset email sent" })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
        }

        // Check for Firebase specific errors (e.g., user not found)
        const err = error as any
        if (err.code === "auth/user-not-found") {
            // Ideally, don't reveal if user exists, but for now returned generic message
            return NextResponse.json({ message: "If an account exists, a reset email has been sent." })
        }

        console.error("Forgot password error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
