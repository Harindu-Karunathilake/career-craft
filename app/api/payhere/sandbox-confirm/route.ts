import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

/**
 * Sandbox-only: confirms a pending enrollment after the PayHere JS callback fires.
 * The webhook (notify_url) is the production path, but it requires a public URL.
 * This endpoint lets you test the full flow on localhost.
 *
 * Only works when NEXT_PUBLIC_PAYHERE_SANDBOX=true.
 */
export async function POST(req: NextRequest) {
    if (process.env.NEXT_PUBLIC_PAYHERE_SANDBOX !== "true") {
        return NextResponse.json({ error: "Only available in sandbox" }, { status: 403 });
    }

    try {
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await adminAuth().verifyIdToken(token);

        const { orderId } = await req.json();
        if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

        const db = adminDb();
        const enrollRef = db.collection("enrollments").doc(orderId);
        const snap = await enrollRef.get();

        if (!snap.exists) {
            return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
        }

        const enrollment = snap.data()!;
        if (enrollment.status === "paid") {
            return NextResponse.json({ ok: true, alreadyPaid: true });
        }

        // Mark paid + increment course counter atomically
        const batch = db.batch();
        batch.update(enrollRef, {
            status: "paid",
            paymentId: `sandbox_${Date.now()}`,
            paidAt: new Date().toISOString(),
        });
        const courseRef = db.collection("courses").doc(enrollment.courseId);
        const courseSnap = await courseRef.get();
        batch.update(courseRef, {
            enrollments: (courseSnap.data()?.enrollments ?? 0) + 1,
        });
        await batch.commit();

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error("[Sandbox confirm error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
