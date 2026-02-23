
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminStorage, adminDb } from "@/lib/firebase-admin";
import { decryptBuffer } from "@/lib/encryption-server";
import { cacheGet, cacheSet } from "@/lib/redis";

// Cache decrypted file bytes (as base64) for 1 hour
const CACHE_TTL = 60 * 60;

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

        // 2. Get Resume ID from Params
        const { id: resumeId } = await params;
        const url = new URL(req.url);
        const target = url.searchParams.get("target"); // 'resume' or 'preview'

        // 3. Check Redis cache for the file bytes
        const cacheKey = `resume-download:${requesterId}:${resumeId}:${target ?? "resume"}`;
        const cached = await cacheGet(cacheKey);
        if (cached) {
            console.log("[Cache HIT] resume-download:", cacheKey);
            const parsed = JSON.parse(cached);
            const buffer = Buffer.from(parsed.data, "base64");
            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    "Content-Type": parsed.contentType,
                    "Content-Disposition": `inline; filename="${parsed.originalName}"`,
                    "X-Cache": "HIT",
                },
            });
        }
        console.log("[Cache MISS] resume-download:", cacheKey);

        // 4. Fetch Resume Metadata from Firestore
        const resumeDoc = await adminDb()
            .collection("users")
            .doc(requesterId)
            .collection("resumes")
            .doc(resumeId)
            .get();

        if (!resumeDoc.exists) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }

        const resumeData = resumeDoc.data();

        let downloadBuffer: Buffer;
        let contentType = "application/pdf";
        let originalName = "resume.pdf";

        let storageUrlOrPath = resumeData?.resumeUrl;

        if (target === "preview") {
            storageUrlOrPath = resumeData?.imageUrl;
            contentType = "image/png";
            originalName = "preview.png";
        }

        if (!storageUrlOrPath) {
            return NextResponse.json({ error: "File path missing" }, { status: 404 });
        }

        const isEncrypted = resumeData?.isEncrypted === true;

        if (isEncrypted) {
            const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "career-craft-ac840.firebasestorage.app";
            const bucket = adminStorage().bucket(bucketName);
            const fileRef = bucket.file(storageUrlOrPath);
            const [fileBuffer] = await fileRef.download();
            const [metadata] = await fileRef.getMetadata();

            downloadBuffer = await decryptBuffer(fileBuffer);
            contentType = (metadata.metadata?.originalContentType as string) || "application/pdf";
            originalName = (metadata.metadata?.originalName as string) || "resume.pdf";

        } else {
            if (storageUrlOrPath.startsWith("http")) {
                const response = await fetch(storageUrlOrPath);
                if (!response.ok) throw new Error("Failed to fetch legacy file");
                const arrayBuffer = await response.arrayBuffer();
                downloadBuffer = Buffer.from(arrayBuffer);
                if (target === "preview") contentType = "image/png";
            } else {
                return NextResponse.json({ error: "Unknown file format" }, { status: 500 });
            }
        }

        // 5. Store in cache (base64-encoded so it's a plain string)
        await cacheSet(
            cacheKey,
            JSON.stringify({
                data: downloadBuffer.toString("base64"),
                contentType,
                originalName,
            }),
            CACHE_TTL
        );

        // 6. Return File
        return new NextResponse(new Uint8Array(downloadBuffer), {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `inline; filename="${originalName}"`,
                "X-Cache": "MISS",
            }
        });

    } catch (error: any) {
        console.error("Download error:", error);
        return NextResponse.json({ error: error.message || "Download failed" }, { status: 500 });
    }
}
