import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase-admin";
import { cacheDel, cacheDelPattern } from "@/lib/redis";

export async function DELETE(
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
        const decodedToken = await adminAuth().verifyIdToken(token);
        const userId = decodedToken.uid;

        const { id: resumeId } = await params;

        // 2. Fetch resume metadata (to get the storage path for cleanup)
        const resumeRef = adminDb()
            .collection("users")
            .doc(userId)
            .collection("resumes")
            .doc(resumeId);

        const resumeDoc = await resumeRef.get();
        if (!resumeDoc.exists) {
            return NextResponse.json({ error: "Resume not found" }, { status: 404 });
        }

        const resumeData = resumeDoc.data();

        // 3. Delete the Firestore document
        await resumeRef.delete();

        // 4. Optionally clean up Firebase Storage files
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "career-craft-ac840.firebasestorage.app";
        const storagePaths = [resumeData?.resumeUrl, resumeData?.imageUrl].filter(
            (p) => p && !p.startsWith("http")
        );
        if (storagePaths.length > 0) {
            const bucket = adminStorage().bucket(bucketName);
            await Promise.allSettled(storagePaths.map((p) => bucket.file(p).delete()));
        }

        // 5. Invalidate Redis cache
        await Promise.all([
            // Remove cached download buffers for this resume
            cacheDel(
                `resume-download:${userId}:${resumeId}:resume`,
                `resume-download:${userId}:${resumeId}:preview`
            ),
            // Invalidate the list cache so the next page load fetches fresh data
            cacheDel(`resume-list:${userId}`),
        ]);

        console.log("[Cache INVALIDATED] resume delete:", resumeId, "user:", userId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Resume delete error:", error);
        return NextResponse.json({ error: error.message || "Delete failed" }, { status: 500 });
    }
}
