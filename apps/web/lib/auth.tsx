"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { User } from "firebase/auth"

import {
  isFirebaseConfigured,
  onAuthChange,
  signInWithGoogle,
  signOut as firebaseSignOut,
} from "@/lib/firebase"
import { useTutoringStore } from "@/lib/store"

export type AuthStatus = "loading" | "signed-in" | "signed-out" | "unconfigured"

type AuthContextValue = {
  user: User | null
  status: AuthStatus
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>(
    isFirebaseConfigured() ? "loading" : "unconfigured"
  )
  const [error, setError] = useState<string | null>(null)
  const previousUidRef = useRef<string | null>(null)
  const signingInRef = useRef(false)

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setStatus("unconfigured")
      return
    }

    const unsub = onAuthChange((next) => {
      const previousUid = previousUidRef.current
      previousUidRef.current = next?.uid ?? null

      setUser(next)
      setStatus(next ? "signed-in" : "signed-out")

      // If we transitioned from one signed-in user to nothing OR to a different
      // user, wipe the local tutoring state so the next user doesn't see the
      // previous one's data while Firestore is still hydrating.
      const droppedSession = previousUid && previousUid !== (next?.uid ?? null)
      if (droppedSession) {
        useTutoringStore.getState().wipe()
      }
    })

    return () => unsub()
  }, [])

  const signIn = useCallback(async () => {
    if (signingInRef.current) return
    if (!isFirebaseConfigured()) {
      setError("Firebase is not configured on this build.")
      return
    }
    signingInRef.current = true
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      const code = (err as { code?: string } | null)?.code ?? ""
      // Popups closed by the user or duplicate popups aren't real errors.
      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/popup-blocked"
      ) {
        // ignore
      } else if (code === "auth/operation-not-allowed") {
        setError(
          "Google sign-in is not enabled for this Firebase project. Enable it in the console and try again."
        )
      } else {
        setError(humanizeAuthError(err))
        console.error("[tutorkit] sign-in failed", err)
      }
    } finally {
      signingInRef.current = false
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      // Drop the local data so a different user on the same browser doesn't
      // flash the previous user's tutoring data before Firestore replies.
      useTutoringStore.getState().wipe()
      await firebaseSignOut()
    } catch (err) {
      console.error("[tutorkit] sign-out failed", err)
    }
  }, [])

  const value: AuthContextValue = {
    user,
    status,
    error,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>")
  }
  return ctx
}

function humanizeAuthError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const message = String((err as { message?: string }).message ?? "")
    return message.replace(/^Firebase:\s*/i, "")
  }
  return "Something went wrong while signing in."
}
