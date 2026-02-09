import { getApps, initializeApp, type FirebaseOptions, getApp } from "firebase/app"
import { getAuth, connectAuthEmulator } from "firebase/auth"
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore"
import { getAnalytics, isSupported } from "firebase/analytics"
import { getStorage } from "firebase/storage"
import { getFunctions, connectFunctionsEmulator } from "firebase/functions"

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyA5dj46p-l1TCthL3JGOpou9QU1FiZc7uM",
  authDomain: "career-craft-ac840.firebaseapp.com",
  projectId: "career-craft-ac840",
  storageBucket: "career-craft-ac840.firebasestorage.app",
  messagingSenderId: "105162114950",
  appId: "1:105162114950:web:6ca077038ba82610440e07",
  measurementId: "G-0R2YQK2P64"
}

function ensureConfigValues(config: FirebaseOptions) {
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length) {
    throw new Error(
      `Missing Firebase configuration values: ${missing.join(", ")}\n` +
      "Ensure these are defined in your .env file."
    )
  }
}

function logServerMessage(message: string, projectId?: string) {
  if (typeof window !== "undefined") {
    return
  }

  const suffix = projectId ? `: ${projectId}` : ""
  console.info(`[Firebase] ${message}${suffix}`)
}

function createFirebaseApp() {
  if (!getApps().length) {
    ensureConfigValues(firebaseConfig)
    const app = initializeApp(firebaseConfig)
    logServerMessage("Connected to project", app.options.projectId)
    return app
  }

  const existingApp = getApp()
  logServerMessage("Reusing existing Firebase connection", existingApp.options.projectId)
  return existingApp
}

export const firebaseApp = createFirebaseApp()
export const firebaseAuth = getAuth(firebaseApp)
export const firebaseDb = getFirestore(firebaseApp)
export const firebaseStorage = getStorage(firebaseApp)
export const firebaseFunctions = getFunctions(firebaseApp)

// FORCE CONNECT EMULATORS
// Wrap in try-catch to handle "already connected" or other init issues safely
// FORCE CONNECT EMULATORS
// Wrap in try-catch to handle "already connected" or other init issues safely
// FORCE CONNECT EMULATORS
// Wrap in try-catch to handle "already connected" or other init issues safely
if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalAny: any = global;

    // Use a global flag to prevent double-connection in HMR (Hot Module Replacement)
    if (!globalAny._firebaseEmulatorsConnected) {
      console.log("🔥 Attempting to connect to Emulators...");
      connectFunctionsEmulator(firebaseFunctions, "127.0.0.1", 5001);
      connectFirestoreEmulator(firebaseDb, "127.0.0.1", 8081);
      connectAuthEmulator(firebaseAuth, "http://127.0.0.1:9099");

      globalAny._firebaseEmulatorsConnected = true;
      console.log("🔥 SUCCESS: Connected to Firebase Emulators (Functions: 5001, Firestore: 8081, Auth: 9099)");
    }
  } catch (e) {
    console.warn("⚠️ Emulator connection warning (likely already connected):", e);
  }
}

let analyticsPromise: ReturnType<typeof getAnalytics> | null = null
if (typeof window !== "undefined") {
  // Analytics is only available in the browser, guard for environments where it isn't supported (e.g., SSR).
  isSupported().then((supported) => {
    if (supported) {
      analyticsPromise = getAnalytics(firebaseApp)
    }
  })
}

export const firebaseAnalytics = analyticsPromise
