import "server-only"
import { adminDb, adminStorage } from "@/lib/firebase-admin"
import { decryptBuffer } from "@/lib/encryption-server"
import { extractTextFromBuffer } from "@/lib/pdf2text-server"

const RECS_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// ─── Resume Text Cache ────────────────────────────────────────────────────────

/**
 * Returns the plain-text content of a resume.
 *
 * First call:  downloads the encrypted PDF from Storage, decrypts and parses it,
 *              then saves `extractedText` back onto the Firestore resume document.
 * Later calls: reads the stored string directly — no download, no decrypt, no parse.
 *
 * Saving ~3–8 s per request on every recommendation call after the first.
 */
export async function getResumeText(
  userId: string,
  resumeId: string,
  storagePath: string
): Promise<string> {
  const resumeRef = adminDb()
    .collection("users")
    .doc(userId)
    .collection("resumes")
    .doc(resumeId)

  // 1. Cache hit — return stored text immediately
  const snap = await resumeRef.get()
  const cached = snap.data()?.extractedText as string | undefined
  if (cached && cached.length > 50) {
    console.log("[resume-cache] HIT — skipping PDF download/decrypt/parse")
    return cached
  }

  // 2. Cache miss — download, decrypt, extract
  console.log("[resume-cache] MISS — downloading and parsing PDF")
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET || "career-craft-ac840.firebasestorage.app"
  const file = adminStorage().bucket(bucketName).file(storagePath)

  const [exists] = await file.exists()
  if (!exists) throw new Error("Resume file not found in storage")

  const [fileBuffer] = await file.download()
  const decrypted = await decryptBuffer(fileBuffer)
  const text = await extractTextFromBuffer(decrypted)

  // 3. Persist asynchronously — don't block the response
  resumeRef.update({ extractedText: text }).catch((err) =>
    console.warn("[resume-cache] Failed to persist extractedText:", err)
  )

  return text
}

// ─── Recommendation Results Cache ─────────────────────────────────────────────

/**
 * Reads a cached AI recommendation result from Firestore.
 * Returns null if the entry is missing, older than 24 h, or based on a
 * different resume than the currently active one.
 */
export async function readRecsCache(
  userId: string,
  cacheKey: "jobs" | "courses",
  currentResumeId: string
): Promise<unknown | null> {
  try {
    const snap = await adminDb()
      .collection("users")
      .doc(userId)
      .collection("recommendationsCache")
      .doc(cacheKey)
      .get()

    if (!snap.exists) return null

    const entry = snap.data() as {
      data: unknown
      cachedAt: FirebaseFirestore.Timestamp
      resumeId: string
    }

    // Invalidate if the resume has changed
    if (entry.resumeId !== currentResumeId) {
      console.log(`[recs-cache] STALE for ${cacheKey} — resume changed`)
      return null
    }

    // Invalidate if older than TTL
    const ageMs = Date.now() - entry.cachedAt.toMillis()
    if (ageMs > RECS_TTL_MS) {
      console.log(`[recs-cache] EXPIRED for ${cacheKey} (age ${Math.round(ageMs / 60000)}m)`)
      return null
    }

    console.log(`[recs-cache] HIT for ${cacheKey} (age ${Math.round(ageMs / 60000)}m)`)
    return entry.data
  } catch (err) {
    console.warn("[recs-cache] readRecsCache error:", err)
    return null
  }
}

/**
 * Writes an AI recommendation result to the Firestore cache.
 * Fire-and-forget safe (errors are swallowed).
 */
export async function writeRecsCache(
  userId: string,
  cacheKey: "jobs" | "courses",
  resumeId: string,
  data: unknown
): Promise<void> {
  try {
    const { FieldValue } = await import("firebase-admin/firestore")
    await adminDb()
      .collection("users")
      .doc(userId)
      .collection("recommendationsCache")
      .doc(cacheKey)
      .set({ data, cachedAt: FieldValue.serverTimestamp(), resumeId })
  } catch (err) {
    console.warn("[recs-cache] writeRecsCache error:", err)
  }
}
