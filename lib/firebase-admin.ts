import "server-only"

import * as admin from "firebase-admin"

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

// Force Emulator Config in Dev
// Force Emulator Config in Dev
if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
    console.log("🔧 [FirebaseAdmin] Enforcing Emulator Environment Variables");
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8081";
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199";
}

function getFirebaseAdmin() {
    if (!admin.apps.length) {
        console.log("🔧 [FirebaseAdmin] Initializing new Admin App instance...");
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "career-craft-ac840.firebasestorage.app",
        })
    }
    return admin
}

export const adminAuth = () => getFirebaseAdmin().auth()
export const adminDb = () => getFirebaseAdmin().firestore()
export const adminStorage = () => getFirebaseAdmin().storage()
