import "server-only"

import * as admin from "firebase-admin"

function getFirebaseAdmin() {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
        })
    }
    return admin
}

export const adminAuth = () => getFirebaseAdmin().auth()
export const adminDb = () => getFirebaseAdmin().firestore()
