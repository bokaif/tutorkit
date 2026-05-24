"use client"

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
  type User,
  type Unsubscribe,
} from "firebase/auth"
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore"

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export function isFirebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId)
}

let _app: FirebaseApp | null = null
let _auth: Auth | null = null
let _db: Firestore | null = null
let _persistencePromise: Promise<void> | null = null

export function getFirebase(): {
  app: FirebaseApp
  auth: Auth
  db: Firestore
} | null {
  if (typeof window === "undefined") return null
  if (!isFirebaseConfigured()) return null

  if (_app && _auth && _db) {
    return { app: _app, auth: _auth, db: _db }
  }

  _app = getApps()[0] ?? initializeApp(config)

  _db = initializeFirestore(_app, {
    ignoreUndefinedProperties: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  })

  _auth = getAuth(_app)
  // Keep the user signed in across reloads (PWA-friendly).
  if (!_persistencePromise) {
    _persistencePromise = setPersistence(_auth, browserLocalPersistence).catch(
      (err) => {
        console.error("[tutorkit] auth persistence failed", err)
      }
    )
  }

  return { app: _app, auth: _auth, db: _db }
}

/**
 * Subscribe to auth state. The callback fires once on first hydration and then
 * on every sign-in / sign-out. Returns an unsubscribe handle.
 */
export function onAuthChange(
  callback: (user: User | null) => void
): Unsubscribe {
  const fb = getFirebase()
  if (!fb) {
    queueMicrotask(() => callback(null))
    return () => {}
  }
  return onAuthStateChanged(fb.auth, callback)
}

/**
 * Open a Google sign-in popup and resolve with the signed-in user.
 *
 * Throws if the provider is not enabled in the Firebase console
 * (`auth/operation-not-allowed`) or the user closes the popup
 * (`auth/popup-closed-by-user`).
 */
export async function signInWithGoogle(): Promise<User> {
  const fb = getFirebase()
  if (!fb) {
    throw new Error("Firebase is not configured")
  }

  await _persistencePromise

  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: "select_account" })

  const result = await signInWithPopup(fb.auth, provider)
  return result.user
}

export async function signOut(): Promise<void> {
  const fb = getFirebase()
  if (!fb) return
  await firebaseSignOut(fb.auth)
}
