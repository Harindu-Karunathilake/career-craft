import { Router } from "express";
import * as admin from "firebase-admin";
import * as multer from "multer";
import { encryptBuffer, decryptBuffer } from "../lib/encryption";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Firestore & Storage
const db = admin.firestore();
const storage = admin.storage();

// Middleware to verify Firebase Auth Token
const verifyAuth = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    const token = authHeader.split("Bearer ")[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid Token" });
    }
};

router.post("/upload", verifyAuth, upload.single("file"), async (req: any, res) => {
    try {
        const userId = req.user.uid;
        const file = req.file;

        if (!file) {
            res.status(400).json({ error: "No file provided" });
            return;
        }

        // Encrypt
        const encryptedBuffer = await encryptBuffer(file.buffer);

        // Upload
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "career-craft-ac840.firebasestorage.app";
        const bucket = storage.bucket(bucketName);
        const timestamp = Date.now();
        const storagePath = `resumes/${userId}/${timestamp}_${file.originalname}.enc`;
        const fileRef = bucket.file(storagePath);

        await fileRef.save(encryptedBuffer, {
            metadata: {
                contentType: "application/octet-stream",
                metadata: {
                    originalName: file.originalname,
                    originalContentType: file.mimetype,
                    isEncrypted: "true",
                },
            },
        });

        res.json({
            success: true,
            storagePath: storagePath,
            name: file.originalname,
            type: file.mimetype
        });

    } catch (error: any) {
        console.error("Upload Route Error:", error);
        res.status(500).json({ error: error.message || "Upload failed" });
    }
});

router.get("/:id/download", verifyAuth, async (req: any, res) => {
    try {
        const requesterId = req.user.uid;
        const resumeId = req.params.id;
        const target = req.query.target; // 'resume' or 'preview'

        // Fetch Resume Metadata
        const resumeDoc = await db.collection("users").doc(requesterId).collection("resumes").doc(resumeId).get();

        if (!resumeDoc.exists) {
            res.status(404).json({ error: "Resume not found" });
            return;
        }

        const resumeData = resumeDoc.data();
        let storageUrlOrPath = resumeData?.resumeUrl;

        let contentType = "application/pdf";
        let originalName = "resume.pdf";

        if (target === "preview") {
            storageUrlOrPath = resumeData?.imageUrl;
            contentType = "image/png";
            originalName = "preview.png";
        }

        if (!storageUrlOrPath) {
            res.status(404).json({ error: "File path missing" });
            return;
        }

        const isEncrypted = resumeData?.isEncrypted === true;
        let downloadBuffer: Buffer;

        if (isEncrypted) {
            const bucketName = process.env.FIREBASE_STORAGE_BUCKET || "career-craft-ac840.firebasestorage.app";
            const bucket = storage.bucket(bucketName);
            const fileRef = bucket.file(storageUrlOrPath);
            const [fileBuffer] = await fileRef.download();
            const [metadata] = await fileRef.getMetadata();

            downloadBuffer = await decryptBuffer(fileBuffer);
            contentType = (metadata.metadata?.originalContentType as string) || "application/pdf";
            originalName = (metadata.metadata?.originalName as string) || "resume.pdf";
        } else {
            // Legacy URL handling
            if (storageUrlOrPath.startsWith("http")) {
                const response = await fetch(storageUrlOrPath);
                if (!response.ok) throw new Error("Failed to fetch legacy file");
                const arrayBuffer = await response.arrayBuffer();
                downloadBuffer = Buffer.from(arrayBuffer);
                if (target === "preview") contentType = "image/png";
            } else {
                res.status(500).json({ error: "Unknown file format" });
                return;
            }
        }

        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `inline; filename="${originalName}"`);
        res.send(downloadBuffer);

    } catch (error: any) {
        console.error("Download error:", error);
        res.status(500).json({ error: error.message || "Download failed" });
    }
});

export default router;
