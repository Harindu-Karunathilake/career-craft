import { getApps, initializeApp, type FirebaseOptions, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getAnalytics, isSupported } from "firebase/analytics"
import { getStorage } from "firebase/storage"

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
