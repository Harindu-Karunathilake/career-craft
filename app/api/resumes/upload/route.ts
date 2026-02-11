
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminStorage } from "@/lib/firebase-admin";
import { encryptBuffer } from "@/lib/encryption-server";

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Authentication
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth().verifyIdToken(token);
        const userId = decodedToken.uid;

        // 2. Parse Form Data
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // 3. Encrypt File
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const encryptedBuffer = await encryptBuffer(buffer);

        // 4. Upload to Firebase Storage
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "career-craft-ac840.firebasestorage.app";
        const bucket = adminStorage().bucket(bucketName);
        const timestamp = Date.now();
        // Using a different extension or path to denote encrypted? No need, but good to know.
        // Preserving original name but avoiding collisions
        const storagePath = `resumes/${userId}/${timestamp}_${file.name}.enc`;
        const fileRef = bucket.file(storagePath);

        await fileRef.save(encryptedBuffer, {
            metadata: {
                contentType: "application/octet-stream", // Encrypted data is binary
                metadata: {
                    originalName: file.name,
                    originalContentType: file.type,
                    isEncrypted: "true",
                },
            },
        });

        // 5. Return success with storage path (NOT public URL)
        return NextResponse.json({
            success: true,
            storagePath: storagePath,
            name: file.name,
            type: file.type
        });

    } catch (error: any) {
        console.error("Upload Route Error:", error);
        return NextResponse.json({
            error: error.message || "Upload failed",
            details: error.stack
        }, { status: 500 });
    }
}
