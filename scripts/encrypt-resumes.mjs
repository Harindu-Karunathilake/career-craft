
import admin from 'firebase-admin';
import crypto from 'crypto';
import { getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// CONFIGURATION
const SERVICE_ACCOUNT = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
// OR user might need to point to a file. 
// For this script, let's assume environment variables are set or we use applicationDefault() if running locally with Google Cloud SDK.
// But usually users have a service-account.json.

// Let's rely on standard env vars if possible, similar to lib/firebase-admin.ts
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const ENCRYPTION_KEY_HEX = process.env.RESUME_ENCRYPTION_KEY;

if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY || !ENCRYPTION_KEY_HEX) {
    console.error("Missing Environment Variables. key items: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, RESUME_ENCRYPTION_KEY");
    process.exit(1);
}

const ALGORITHM = 'aes-256-gcm';

// Setup Firebase
if (!getApps().length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: PROJECT_ID,
            clientEmail: CLIENT_EMAIL,
            privateKey: PRIVATE_KEY,
        }),
        storageBucket: `${PROJECT_ID}.appspot.com` // Assumption or env?
        // Note: storageBucket is usually projectId.appspot.com or firebasestorage.app
        // better to check .env or lib/firebase.ts
        // In lib/firebase.ts it was "career-craft-ac840.firebasestorage.app"
    });
}

const db = getFirestore();
const storage = getStorage();
// HARDCODED BUCKET FROM LIB/FIREBASE.TS if not standard
const bucket = storage.bucket("career-craft-ac840.firebasestorage.app");

async function encryptBuffer(buffer) {
    const key = Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]);
}

async function migrate() {
    console.log("Starting Migration...");

    // Query all users
    const usersSnap = await db.collection('users').get();
    let totalProcessed = 0;
    let totalErrors = 0;

    for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        console.log(`Processing user: ${userId}`);

        const resumesSnap = await db.collection('users').doc(userId).collection('resumes').get();

        for (const resumeDoc of resumesSnap.docs) {
            const data = resumeDoc.data();

            if (data.isEncrypted) {
                console.log(`  - Resume ${resumeDoc.id} already encrypted. Skipping.`);
                continue;
            }

            console.log(`  - Migrating Resume ${resumeDoc.id}...`);
            try {
                const updates = { isEncrypted: true };

                // 1. Encrypt Resume PDF
                if (data.resumeUrl && data.resumeUrl.startsWith('http')) {
                    const newPath = await processFile(data.resumeUrl, userId, 'resume.pdf');
                    updates.resumeUrl = newPath;
                    console.log(`    > Encrypted PDF -> ${newPath}`);
                }

                // 2. Encrypt Preview Image
                if (data.imageUrl && data.imageUrl.startsWith('http')) {
                    const newPath = await processFile(data.imageUrl, userId, 'preview.png');
                    updates.imageUrl = newPath;
                    console.log(`    > Encrypted Image -> ${newPath}`);
                }

                // Update Firestore
                await resumeDoc.ref.update(updates);
                totalProcessed++;

            } catch (err) {
                console.error(`    ! ERROR processing ${resumeDoc.id}:`, err.message);
                totalErrors++;
            }
        }
    }

    console.log("------------------------------------------------");
    console.log(`Migration Complete.`);
    console.log(`Processed: ${totalProcessed}`);
    console.log(`Errors: ${totalErrors}`);
}

async function processFile(publicUrl, userId, originalName) {
    // Fetch
    const res = await fetch(publicUrl);
    if (!res.ok) throw new Error(`Failed to fetch ${publicUrl}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Encrypt
    const encrypted = await encryptBuffer(buffer);

    // Upload
    const timestamp = Date.now();
    const storagePath = `resumes/${userId}/migrated_${timestamp}_${originalName}.enc`;
    const fileRef = bucket.file(storagePath);

    await fileRef.save(encrypted, {
        metadata: {
            contentType: 'application/octet-stream',
            metadata: {
                originalName: originalName,
                isEncrypted: 'true'
            }
        }
    });

    return storagePath;
}

migrate().catch(console.error);
