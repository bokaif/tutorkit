"use client"

import { useEffect, useRef, useState } from "react"
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentReference,
  type Unsubscribe,
} from "firebase/firestore"

import { useAuth } from "@/lib/auth"
import { getFirebase, isFirebaseConfigured } from "@/lib/firebase"
import { useTutoringStore } from "@/lib/store"
import type {
  Payment,
  SessionNote,
  Student,
} from "@/lib/tutoring-data"

export type SyncStatus =
  | "disabled"
  | "connecting"
  | "online"
  | "saving"
  | "offline"
  | "error"

type RemoteDoc = {
  students?: Student[]
  notes?: SessionNote[]
  payments?: Payment[]
  updatedAt?: { toMillis?: () => number } | null
  schemaVersion?: number
}

const SCHEMA_VERSION = 2

function shallowEqualArray<T>(a: T[], b: T[]): boolean {
  if (a === b) return true
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

/**
 * Bidirectional sync between the Zustand tutoring store and the signed-in
 * user's `users/{uid}` Firestore document. The Firestore SDK's IndexedDB
 * persistence keeps everything working offline (PWA-friendly).
 *
 * Requires the user to be signed in via `AuthProvider`. While `loading`,
 * `unconfigured`, or `signed-out`, the hook returns a non-active status and
 * does not touch Firestore.
 */
export function useFirestoreSync(enabled: boolean): SyncStatus {
  const { user, status: authStatus } = useAuth()
  const uid = user?.uid ?? null

  const students = useTutoringStore((s) => s.students)
  const notes = useTutoringStore((s) => s.notes)
  const payments = useTutoringStore((s) => s.payments)
  const replaceAll = useTutoringStore((s) => s.replaceAll)
  const hydrated = useTutoringStore((s) => s.hydrated)

  const [status, setStatus] = useState<SyncStatus>(
    isFirebaseConfigured() ? "connecting" : "disabled"
  )

  const docRef = useRef<DocumentReference | null>(null)
  const unsubRef = useRef<Unsubscribe | null>(null)
  const applyingRemote = useRef(false)
  const lastRemoteMs = useRef(0)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastSnapshot = useRef<{
    students: Student[]
    notes: SessionNote[]
    payments: Payment[]
  } | null>(null)

  useEffect(() => {
    if (!enabled || !hydrated) return
    if (!isFirebaseConfigured()) {
      setStatus("disabled")
      return
    }
    if (authStatus === "loading") {
      setStatus("connecting")
      return
    }
    if (!uid) {
      setStatus("disabled")
      return
    }

    const fb = getFirebase()
    if (!fb) {
      setStatus("disabled")
      return
    }

    setStatus("connecting")
    lastRemoteMs.current = 0
    lastSnapshot.current = null
    docRef.current = doc(fb.db, "users", uid)

    setStatus("online")

    unsubRef.current = onSnapshot(
      docRef.current,
      (snap) => {
        if (!snap.exists()) {
          applyingRemote.current = false
          schedulePush()
          return
        }
        const remote = snap.data() as RemoteDoc
        const remoteMs = remote.updatedAt?.toMillis?.() ?? 0

        if (remoteMs <= lastRemoteMs.current) return
        lastRemoteMs.current = remoteMs

        applyingRemote.current = true
        replaceAll({
          students: remote.students ?? [],
          notes: remote.notes ?? [],
          payments: remote.payments ?? [],
        })
        lastSnapshot.current = {
          students: remote.students ?? [],
          notes: remote.notes ?? [],
          payments: remote.payments ?? [],
        }
        queueMicrotask(() => {
          applyingRemote.current = false
        })
      },
      (err) => {
        console.error("[tutorkit] Firestore sync error", err)
        setStatus("error")
      }
    )

    function schedulePush() {
      if (!docRef.current) return
      if (pushTimer.current) clearTimeout(pushTimer.current)
      pushTimer.current = setTimeout(() => {
        const ref = docRef.current
        if (!ref) return
        setStatus("saving")
        const payload = {
          students: useTutoringStore.getState().students,
          notes: useTutoringStore.getState().notes,
          payments: useTutoringStore.getState().payments,
          updatedAt: serverTimestamp(),
          schemaVersion: SCHEMA_VERSION,
        }
        setDoc(ref, payload)
          .then(() => setStatus("online"))
          .catch((err) => {
            console.error("[tutorkit] Firestore push failed", err)
            setStatus("offline")
          })
      }, 800)
    }

    pushTrigger.current = schedulePush

    return () => {
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }
      if (pushTimer.current) {
        clearTimeout(pushTimer.current)
        pushTimer.current = null
      }
      docRef.current = null
      pushTrigger.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, hydrated, authStatus, uid])

  const pushTrigger = useRef<(() => void) | null>(null)
  useEffect(() => {
    if (!enabled) return
    if (applyingRemote.current) return
    if (!docRef.current) return
    if (!pushTrigger.current) return

    const prev = lastSnapshot.current
    if (
      prev &&
      shallowEqualArray(prev.students, students) &&
      shallowEqualArray(prev.notes, notes) &&
      shallowEqualArray(prev.payments, payments)
    ) {
      return
    }

    lastSnapshot.current = { students, notes, payments }
    pushTrigger.current()
  }, [enabled, students, notes, payments])

  return status
}
