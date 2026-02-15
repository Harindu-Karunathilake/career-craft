
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminStorage, adminDb } from "@/lib/firebase-admin";
import { decryptBuffer } from "@/lib/encryption-server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Verify Authentication
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        const decodedAuth = await adminAuth().verifyIdToken(token);
        const requesterId = decodedAuth.uid;

        // 2. Get Resume ID from Params (wait for promise)
        const { id: resumeId } = await params;
        const url = new URL(req.url);
        const target = url.searchParams.get("target"); // 'resume' or 'preview'

        // 3. Fetch Resume Metadata from Firestore to verify ownership and get storage path
        // We need to look up the resume. Since the route is generic /resumes/[id], 
        // strict ownership check means we need to find WHICH user owns this resume 
        // OR we just assume the path structure knows it.
        // Better to check Firestore "users/{userId}/resumes/{resumeId}"
        // But we don't know the owner's ID just from resumeId... 
        // WAIT. The Firestore structure is `users/{userId}/resumes/{resumeId}`.
        // If we don't know the userId, we can't find the doc easily unless we do a collection group query or the frontend passes the owner ID.
        // BUT, usually a user only accesses their own resumes.
        // So we can assume `users/{requesterId}/resumes/{resumeId}`.
        // If an admin is accessing, that's different.
        // Let's assume User-Access-Own-Resume scenario for now.

        const resumeDoc = await adminDb()
            .collection("users")
            .doc(requesterId)
            .collection("resumes")
            .doc(resumeId)
            .get();

        if (!resumeDoc.exists) {
            // Fallback: Check if Admin? Or maybe the resume belongs to someone else?
            // For now: 404
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }

        const resumeData = resumeDoc.data();
        // 'resumeUrl' field might hold the Storage Path for NEW resumes, 
        // but 'https://...' for OLD resumes. we need to handle both.

        let downloadBuffer: Buffer;
        let contentType = "application/pdf"; // Default
        let originalName = "resume.pdf";

        // 4. Determine if Encrypted
        // We can add a flag `isEncrypted` to the firestore doc for new ones.
        // If `resumeUrl` looks like a path (not http), it's likely our new format.
        // Or we check the metadata on the file itself?
        // Optimization: Check Firestore data first.

        // 4. Determine File Source
        let storageUrlOrPath = resumeData?.resumeUrl;

        if (target === "preview") {
            storageUrlOrPath = resumeData?.imageUrl;
            contentType = "image/png";
            originalName = "preview.png";
        }

        if (!storageUrlOrPath) {
            return NextResponse.json({ error: "File path missing" }, { status: 404 });
        }

        const isEncrypted = resumeData?.isEncrypted === true; // explicitly set in new flow

        if (isEncrypted) {
            // It's a storage path, e.g., "resumes/uid/timestamp_name.enc"
            const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "career-craft-ac840.firebasestorage.app";
            const bucket = adminStorage().bucket(bucketName);
            const fileRef = bucket.file(storageUrlOrPath);
            const [fileBuffer] = await fileRef.download();
            const [metadata] = await fileRef.getMetadata();

            // Decrypt
            downloadBuffer = await decryptBuffer(fileBuffer);
            contentType = (metadata.metadata?.originalContentType as string) || "application/pdf";
            originalName = (metadata.metadata?.originalName as string) || "resume.pdf";

        } else {
            // Legacy: It's a public Download URL.
            // We can just redirect the user to it? 
            // Or strictly proxy it?
            // If the goal is "encrypt all", we assume migration will happen.
            // But if we haven't migrated yet, we should probably just return it or fetch it.
            // Fetching it proxied is safer for consistency.

            if (storageUrlOrPath.startsWith("http")) {
                const response = await fetch(storageUrlOrPath);
                if (!response.ok) throw new Error("Failed to fetch legacy file");
                const arrayBuffer = await response.arrayBuffer();
                downloadBuffer = Buffer.from(arrayBuffer);
                if (target === "preview") contentType = "image/png"; // Guess
            } else {
                // Maybe it's a path but not encrypted?
                return NextResponse.json({ error: "Unknown file format" }, { status: 500 });
            }
        }

        // 5. Return File
        return new NextResponse(new Uint8Array(downloadBuffer), {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `inline; filename="${originalName}"`,
            }
        });

    } catch (error: any) {
        console.error("Download error:", error);
        return NextResponse.json({ error: error.message || "Download failed" }, { status: 500 });
    }
}
