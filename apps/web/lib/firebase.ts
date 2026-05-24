"use client"

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type Auth,
  type User,
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

  // Persistent IndexedDB cache so the app works offline as a PWA.
  // `ignoreUndefinedProperties` silently drops `undefined` fields on write
  // (e.g. `Student.guardianPhone` when blank) instead of throwing.
  _db = initializeFirestore(_app, {
    ignoreUndefinedProperties: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  })

  _auth = getAuth(_app)

  return { app: _app, auth: _auth, db: _db }
}

export function ensureSignedIn(): Promise<User> {
  const fb = getFirebase()
  if (!fb) {
    return Promise.reject(
      new Error("Firebase not configured or running on the server")
    )
  }

  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      fb.auth,
      (user) => {
        if (user) {
          unsub()
          resolve(user)
          return
        }
        signInAnonymously(fb.auth).catch((err) => {
          unsub()
          reject(err)
        })
      },
      (err) => {
        unsub()
        reject(err)
      }
    )
  })
}
