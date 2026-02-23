import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { adminDb } from "@/lib/firebase-admin";

/**
 * PayHere server-to-server payment notification.
 * PayHere POSTs here after a successful payment.
 * This endpoint MUST be publicly accessible (not localhost).
 *
 * Verify the notification hash, then mark the enrollment as paid.
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const get = (key: string) => formData.get(key) as string ?? "";

        const merchantId = get("merchant_id");
        const orderId = get("order_id");
        const paymentId = get("payment_id");
        const payHereAmount = get("payhere_amount");
        const currency = get("payhere_currency");
        const statusCode = get("status_code");
        const md5sig = get("md5sig");

        // ── Verify signature ─────────────────────────────────────────────────
        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET ?? "";
        const secretHash = createHash("md5")
            .update(merchantSecret)
            .digest("hex")
            .toUpperCase();

        const localHash = createHash("md5")
            .update(`${merchantId}${orderId}${payHereAmount}${currency}${statusCode}${secretHash}`)
            .digest("hex")
            .toUpperCase();

        if (localHash !== md5sig) {
            console.error("[PayHere notify] Hash mismatch — possible fraud attempt");
            return new NextResponse("Hash mismatch", { status: 400 });
        }

        // status_code 2 = success, 0 = pending, -1 = cancelled, -2 = failed, -3 = chargedback
        if (statusCode !== "2") {
            console.log(`[PayHere notify] Non-success status ${statusCode} for order ${orderId}`);
            return new NextResponse("OK", { status: 200 }); // ACK but don't grant access
        }

        // ── Mark enrollment paid ─────────────────────────────────────────────
        const db = adminDb();
        const enrollRef = db.collection("enrollments").doc(orderId);
        const enrollSnap = await enrollRef.get();

        if (!enrollSnap.exists) {
            console.error("[PayHere notify] Enrollment not found for order:", orderId);
            return new NextResponse("Not found", { status: 404 });
        }

        const enrollment = enrollSnap.data()!;

        // Idempotency: already processed
        if (enrollment.status === "paid") {
            return new NextResponse("OK", { status: 200 });
        }

        // Atomically update enrollment and increment course counter
        const batch = db.batch();

        batch.update(enrollRef, {
            status: "paid",
            paymentId,
            paidAt: new Date().toISOString(),
        });

        const courseRef = db.collection("courses").doc(enrollment.courseId);
        const courseSnap = await courseRef.get();
        const currentEnrollments = courseSnap.data()?.enrollments ?? 0;
        batch.update(courseRef, { enrollments: currentEnrollments + 1 });

        await batch.commit();

        console.log(
            `[PayHere notify] ✅ Order ${orderId} paid. Tutor share: ${enrollment.tutorShare} LKR | Platform fee: ${enrollment.platformFee} LKR`
        );

        return new NextResponse("OK", { status: 200 });
    } catch (error: any) {
        console.error("[PayHere notify error]", error);
        return new NextResponse("Error", { status: 500 });
    }
}
