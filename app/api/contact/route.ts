import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { sendEmail } from "@/lib/mail"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, email, topic, message } = body

        if (!name || !email || !topic || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // 1. Save to Firestore
        const docRef = await adminDb().collection("contact_messages").add({
            name,
            email,
            topic,
            message,
            createdAt: new Date(),
            status: "unread",
        })

        // 2. Send Email Notification
        const supportEmail = process.env.SMTP_USER
        if (supportEmail) {
            await sendEmail({
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
            })
        }

        return NextResponse.json({ success: true, id: docRef.id })
    } catch (error) {
        console.error("Error processing contact form:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
