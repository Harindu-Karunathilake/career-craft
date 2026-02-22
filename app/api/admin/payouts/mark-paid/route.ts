import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

/**
 * POST /api/admin/payouts/mark-paid
 * Body: { tutorId, payoutIds: string[], note?: string }
 * 
 * Marks a batch of enrollment docs as "disbursed" and records a payout entry
 * under payouts/{tutorId}/transactions/{id}.
 */
export async function POST(req: NextRequest) {
    try {
        // ── Verify admin ────────────────────────────────────────────────────
        const token = req.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const decoded = await adminAuth().verifyIdToken(token);
        const adminSnap = await adminDb().collection("users").doc(decoded.uid).get();
        if (adminSnap.data()?.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { tutorId, payoutIds, note, requestId } = await req.json();
        if (!tutorId || !payoutIds?.length) {
            return NextResponse.json({ error: "Missing tutorId or payoutIds" }, { status: 400 });
        }

        const db = adminDb();

        // ── Fetch the enrollment docs to sum tutorShare ──────────────────────
        const enrollRefs = payoutIds.map((id: string) =>
            db.collection("enrollments").doc(id)
        );
        const enrollSnaps = await Promise.all(enrollRefs.map((r: any) => r.get()));
        const totalPayout = enrollSnaps.reduce(
            (sum: number, snap: any) => sum + (snap.data()?.tutorShare ?? 0),
            0
        );

        // ── Batch update enrollments + write payout record ───────────────────
        const batch = db.batch();

        for (const snap of enrollSnaps) {
            if (snap.exists) {
                batch.update(snap.ref, { disbursed: true, disbursedAt: new Date().toISOString() });
            }
        }

        const payoutRef = db.collection("payouts").doc();
        batch.set(payoutRef, {
            id: payoutRef.id,
            tutorId,
            enrollmentIds: payoutIds,
            totalAmount: +totalPayout.toFixed(2),
            note: note ?? "",
            processedBy: decoded.uid,
            processedAt: new Date().toISOString(),
            status: "paid",
        });

        // If this payout was triggered by a tutor request, mark the request as paid
        if (requestId) {
            const reqRef = db.collection("payoutRequests").doc(requestId);
            batch.update(reqRef, {
                status: "paid",
                processedAt: new Date().toISOString(),
                processedBy: decoded.uid,
            });
        }

        await batch.commit();

        return NextResponse.json({ ok: true, totalPayout: +totalPayout.toFixed(2), payoutId: payoutRef.id });
    } catch (error: any) {
        console.error("[Mark as Paid error]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
