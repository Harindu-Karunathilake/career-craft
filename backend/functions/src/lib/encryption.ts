import * as crypto from "crypto";
import * as dotenv from "dotenv";

dotenv.config();

const ALGORITHM = "aes-256-gcm";

function getKey() {
    const key = process.env.RESUME_ENCRYPTION_KEY;
    if (!key) {
        throw new Error("RESUME_ENCRYPTION_KEY is not defined in environment variables");
    }
    // Support both hex string (64 chars) and raw bytes (if passed somehow, though env is string)
    // If user provides hex string, convert to buffer.
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== 32) {
        throw new Error(`RESUME_ENCRYPTION_KEY must be 32 bytes (64 hex characters). Current length: ${keyBuffer.length}`);
    }
    return keyBuffer;
}

export async function encryptBuffer(buffer: Buffer): Promise<Buffer> {
    const key = getKey();
    // 12 bytes is recommended for GCM
    const iv12 = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv12);

    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Return: IV (12) + AuthTag (16) + EncryptedData
    return Buffer.concat([iv12, authTag, encrypted]);
}

export async function decryptBuffer(encryptedBuffer: Buffer): Promise<Buffer> {
    const key = getKey();

    // Extract parts
    const iv = encryptedBuffer.subarray(0, 12);
    const authTag = encryptedBuffer.subarray(12, 28);
    const encrypted = encryptedBuffer.subarray(28);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
