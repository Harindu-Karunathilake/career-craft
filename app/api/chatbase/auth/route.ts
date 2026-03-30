import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Authentication
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];

        // Verify the Firebase ID token
        const decodedToken = await adminAuth().verifyIdToken(token);
        const { uid, email } = decodedToken;

        // 2. Generate Chatbase JWT
        const secret = process.env.CHATBOT_IDENTITY_SECRET;

        if (!secret) {
            console.error("CHATBOT_IDENTITY_SECRET is not set");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const chatbaseToken = jwt.sign(
            {
                user_id: uid,
                email: email,
                // Add any other necessary claims here
            },
            secret,
            { expiresIn: '1h' }
        );

        return NextResponse.json({ token: chatbaseToken });

    } catch (error: any) {
        console.error("Chatbase Auth Error:", error);
        return NextResponse.json({
            error: "Authentication failed",
            details: error.message
        }, { status: 500 });
    }
}
