import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const token = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = await adminAuth().verifyIdToken(token);
        const tutorId = decoded.uid;

        const db = adminDb();

        // Verify tutor role
        const userSnap = await db.collection("users").doc(tutorId).get();
        if (userSnap.data()?.role !== "tutor") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Check for existing open request
        const existingReqs = await db
            .collection("payoutRequests")
            .where("tutorId", "==", tutorId)
            .where("status", "==", "pending")
            .limit(1)
            .get();

        if (!existingReqs.empty) {
            return NextResponse.json({ error: "You already have a pending payout request." }, { status: 409 });
        }

        // Fetch ALL paid enrollments then filter client-side.
        // Firestore's `!= true` skips docs without the `disbursed` field (legacy enrollments).
        const allEnrollSnap = await db
            .collection("enrollments")
            .where("tutorId", "==", tutorId)
            .where("status", "==", "paid")
            .get();

        const undisbursed = allEnrollSnap.docs.filter((d) => !d.data().disbursed);

        if (undisbursed.length === 0) {
            return NextResponse.json({ error: "No pending earnings to request." }, { status: 400 });
        }

        const enrollmentIds = undisbursed.map((d: any) => d.id);
        const totalAmount = +undisbursed
            .reduce((s: number, d: any) => s + (d.data().tutorShare ?? 0), 0)
            .toFixed(2);

        const bankDetails = userSnap.data()?.bankDetails ?? null;

        // Create payout request
        const reqRef = db.collection("payoutRequests").doc();
        await reqRef.set({
            id: reqRef.id,
            tutorId,
            tutorName: userSnap.data()?.name ?? userSnap.data()?.displayName ?? "Unknown",
            tutorEmail: userSnap.data()?.email ?? "",
            bankDetails,
            enrollmentIds,
            totalAmount,
            status: "pending",
            requestedAt: new Date().toISOString(),
        });

        return NextResponse.json({ ok: true, requestId: reqRef.id, totalAmount });
    } catch (error: any) {
        console.error("[Payout request error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
