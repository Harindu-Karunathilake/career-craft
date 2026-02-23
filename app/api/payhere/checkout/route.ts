import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const maxDuration = 30;

const PLATFORM_FEE_PCT = 0.05; // 5%

function generatePayHereHash(
    merchantId: string,
    orderId: string,
    amount: string,
    currency: string,
    merchantSecret: string
): string {
    const secretHash = createHash("md5")
        .update(merchantSecret)
        .digest("hex")
        .toUpperCase();

    return createHash("md5")
        .update(`${merchantId}${orderId}${amount}${currency}${secretHash}`)
        .digest("hex")
        .toUpperCase();
}

export async function POST(req: NextRequest) {
    try {
        // ── Auth ────────────────────────────────────────────────────────────
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const auth = adminAuth();
        const db = adminDb();
        const decoded = await auth.verifyIdToken(token);
        const userId = decoded.uid;

        // ── Read course ──────────────────────────────────────────────────────
        const { courseId } = await req.json();
        if (!courseId) return NextResponse.json({ error: "Missing courseId" }, { status: 400 });

        const courseSnap = await db.collection("courses").doc(courseId).get();
        if (!courseSnap.exists) return NextResponse.json({ error: "Course not found" }, { status: 404 });

        const course = courseSnap.data()!;

        if (!course.published) {
            return NextResponse.json({ error: "Course is not published" }, { status: 400 });
        }

        // ── Check already enrolled ───────────────────────────────────────────
        const existingEnrollment = await db
            .collection("enrollments")
            .where("userId", "==", userId)
            .where("courseId", "==", courseId)
            .where("status", "==", "paid")
            .limit(1)
            .get();

        if (!existingEnrollment.empty) {
            return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
        }

        // ── Free course: enroll immediately ──────────────────────────────────
        if (!course.price || course.price === 0) {
            const enrollRef = db.collection("enrollments").doc();
            await enrollRef.set({
                id: enrollRef.id,
                userId,
                courseId,
                tutorId: course.tutorId,
                amount: 0,
                platformFee: 0,
                tutorShare: 0,
                status: "free",
                createdAt: new Date().toISOString(),
            });
            // Increment enrollments counter
            await db.collection("courses").doc(courseId).update({
                enrollments: (course.enrollments ?? 0) + 1,
            });
            return NextResponse.json({ enrolled: true, free: true });
        }

        // ── Paid course: build PayHere params ────────────────────────────────
        const merchantId = process.env.PAYHERE_MERCHANT_ID;
        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

        if (!merchantId || !merchantSecret) {
            return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
        }

        const orderId = `${courseId}_${userId}_${Date.now()}`;
        const amount = course.price.toFixed(2);
        const currency = "LKR";

        // Calculate split (stored for tracking only)
        const platformFee = +(course.price * PLATFORM_FEE_PCT).toFixed(2);
        const tutorShare = +(course.price - platformFee).toFixed(2);

        // Pre-create a pending enrollment so we can track on notify
        const pendingRef = db.collection("enrollments").doc(orderId);
        await pendingRef.set({
            id: orderId,
            userId,
            courseId,
            tutorId: course.tutorId,
            amount: course.price,
            platformFee,
            tutorShare,
            status: "pending",
            createdAt: new Date().toISOString(),
        });

        const hash = generatePayHereHash(merchantId, orderId, amount, currency, merchantSecret);

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.headers.get("origin") ?? "";

        // Fetch buyer's Firebase user record for PayHere fields
        const userRecord = await adminAuth().getUser(userId);
        const [firstName, ...rest] = (userRecord.displayName ?? "Student").split(" ");

        return NextResponse.json({
            merchant_id: merchantId,
            return_url: `${baseUrl}/courses/${courseId}?status=success`,
            cancel_url: `${baseUrl}/courses/${courseId}?status=cancelled`,
            notify_url: `${baseUrl}/api/payhere/notify`,
            order_id: orderId,
            items: course.title,
            currency,
            amount,
            hash,
            first_name: firstName,
            last_name: rest.join(" ") || "User",
            email: userRecord.email ?? "",
            phone: "0771234567",
            address: "No 1, Galle Road",
            city: "Colombo",
            country: "Sri Lanka",
            // Split info (for UI display only — not sent to PayHere)
            platformFee,
            tutorShare,
            sandbox: process.env.NEXT_PUBLIC_PAYHERE_SANDBOX === "true",
        });
    } catch (error: any) {
        console.error("[PayHere checkout error]", error);
        return NextResponse.json({ error: error.message ?? "Internal error" }, { status: 500 });
    }
}
