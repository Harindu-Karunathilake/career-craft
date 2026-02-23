import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { cacheGet, cacheSet } from "@/lib/redis";

// Cache resume metadata list for 5 minutes per user
const CACHE_TTL = 60 * 5;

export async function GET(req: NextRequest) {
    try {
        // 1. Verify Authentication
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth().verifyIdToken(token);
        const userId = decodedToken.uid;

        // 2. Check cache
        const cacheKey = `resume-list:${userId}`;
        const cached = await cacheGet(cacheKey);
        if (cached) {
            console.log("[Cache HIT] resume-list:", userId);
            return NextResponse.json(JSON.parse(cached), {
                headers: { "X-Cache": "HIT" },
            });
        }
        console.log("[Cache MISS] resume-list:", userId);

        // 3. Fetch from Firestore
        const snapshot = await adminDb()
            .collection("users")
            .doc(userId)
            .collection("resumes")
            .orderBy("createdAt", "desc")
            .get();

        const resumes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // 4. Cache and return
        await cacheSet(cacheKey, JSON.stringify(resumes), CACHE_TTL);

        return NextResponse.json(resumes, {
            headers: { "X-Cache": "MISS" },
        });
    } catch (error: any) {
        console.error("Resume list error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch resumes" }, { status: 500 });
    }
}
