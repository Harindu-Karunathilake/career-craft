"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

function calculateTier(xp: number) {
    if (xp >= 1000) return "Master";
    if (xp >= 500) return "Scholar";
    if (xp >= 100) return "Explorer";
    return "Novice";
}

export async function markLessonComplete(
    enrollmentId: string, 
    lessonId: string, 
    userId: string, 
    courseId: string, 
    totalCourseLessons: number
) {
    try {
        const db = adminDb();
        const enrollmentRef = db.collection("enrollments").doc(enrollmentId);
        const userRef = db.collection("users").doc(userId);
        const badgeRef = db.collection(`users/${userId}/badges`).doc(courseId);
        const courseRef = db.collection("courses").doc(courseId);

        let earnedXp = 0;
        let isCourseCompleted = false;
        let badgeEarned = false;

        await db.runTransaction(async (transaction) => {
            const enrollDoc = await transaction.get(enrollmentRef);
            if (!enrollDoc.exists) throw new Error("Enrollment not found");
            
            const data = enrollDoc.data()!;
            const completedLessons: string[] = data.completedLessons || [];
            
            if (completedLessons.includes(lessonId)) {
                return; // Already completed, do not grant XP again
            }
            
            // Mark as completed
            completedLessons.push(lessonId);
            earnedXp = 10;
            
            isCourseCompleted = completedLessons.length >= totalCourseLessons;
            
            const updates: any = {
                completedLessons: FieldValue.arrayUnion(lessonId)
            };
            if (isCourseCompleted) {
                updates.status = "completed";
                updates.completedAt = new Date().toISOString();
            }
            
            transaction.update(enrollmentRef, updates);
            
            // Grant XP and Tier Updates
            const userDoc = await transaction.get(userRef);
            const currentXp = userDoc.exists ? (userDoc.data()?.careerXp || 0) : 0;
            const newXp = currentXp + earnedXp;
            const newTier = calculateTier(newXp);
            
            transaction.set(userRef, {
                careerXp: newXp,
                tier: newTier
            }, { merge: true });
            
            // Grant Badge if course completed
            if (isCourseCompleted) {
                const badgeDoc = await transaction.get(badgeRef);
                if (!badgeDoc.exists) {
                    badgeEarned = true;
                    const courseDoc = await transaction.get(courseRef);
                    const courseTitle = courseDoc.data()?.title || "Unknown Course";
                    
                    transaction.set(badgeRef, {
                        id: courseId,     // The document ID is the courseID
                        courseId,
                        courseTitle,
                        earnedAt: new Date().toISOString()
                    });
                }
            }
        });
        
        return { 
            success: true, 
            xpEarned: earnedXp,
            isCourseCompleted,
            badgeEarned
        };
        
    } catch (error: any) {
        console.error("Error marking lesson complete:", error);
        return { success: false, error: error.message };
    }
}
