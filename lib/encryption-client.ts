import CryptoJS from "crypto-js";

/**
 * Returns the base secret key from environment variables.
 */
function getBaseSecret(): string {
  const secret = process.env.NEXT_PUBLIC_CHAT_SECRET_KEY;
  if (!secret) {
    console.warn("NEXT_PUBLIC_CHAT_SECRET_KEY is not defined in environment variables. Using fallback for development.");
    return "fallback_insecure_dev_key";
  }
  return secret;
}

/**
 * Derives a chat-specific encryption passphrase using the chatId and the base secret.
 */
function derivePassphrase(chatId: string): string {
  const baseSecret = getBaseSecret();
  // Using SHA256 to hash the combination of base secret and chatId to create a consistent 
  // passphrase of appropriate length for AES.
  return CryptoJS.SHA256(`${baseSecret}:${chatId}`).toString(CryptoJS.enc.Hex);
}

/**
 * Encrypts a plaintext message for a specific chat.
 * 
 * @param text The plaintext message
 * @param chatId The deterministic chat ID
 * @returns The base64 encoded ciphertext string
 */
export function encryptMessage(text: string, chatId: string): string {
  if (!text) return text;
  try {
    const passphrase = derivePassphrase(chatId);
    const encrypted = CryptoJS.AES.encrypt(text, passphrase).toString();
    // Prepend a version or marker so we know it's encrypted (helps with backward compatibility)
    return `ENC:v1:${encrypted}`;
  } catch (error) {
    console.error("Failed to encrypt message:", error);
    return text; // Fallback to plaintext if something goes wrong, though ideally we should throw
  }
}

/**
 * Decrypts a ciphertext message for a specific chat.
 * 
 * @param cipherText The encoded ciphertext string (should start with ENC:v1:)
 * @param chatId The deterministic chat ID
 * @returns The plaintext message
 */
export function decryptMessage(cipherText: string, chatId: string): string {
  if (!cipherText || !cipherText.startsWith("ENC:v1:")) {
    // If it doesn't start with our marker, assume it's an old unencrypted message
    return cipherText;
  }

  try {
    const passphrase = derivePassphrase(chatId);
    // Strip the marker
    const actualCipher = cipherText.replace("ENC:v1:", "");
    const decrypted = CryptoJS.AES.decrypt(actualCipher, passphrase);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    
    // If decryption fails (e.g. wrong key), it might return an empty string
    if (!plaintext && actualCipher) {
      return "[Decryption Failed]";
    }
    
    return plaintext;
  } catch (error) {
    console.error("Failed to decrypt message:", error);
    return "[Decryption Failed]";
  }
}
