"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { useAuth } from "@/lib/auth"
import { tourSteps } from "@/components/tour/tour-steps"

const STORAGE_KEY = "tutorkit:tour-completed-v1"

type TourContextValue = {
  active: boolean
  step: number
  totalSteps: number
  start: () => void
  next: () => void
  prev: () => void
  finish: () => void
  goTo: (index: number) => void
}

const TourContext = createContext<TourContextValue | null>(null)
const TOTAL_STEPS = tourSteps.length

export function TourProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (status !== "signed-in" && status !== "unconfigured") return
    if (typeof window === "undefined") return
    const done = window.localStorage.getItem(STORAGE_KEY) === "1"
    if (done) return

    // Wait a tick so AppShell content has mounted and target selectors resolve.
    const timer = window.setTimeout(() => {
      setStep(0)
      setActive(true)
    }, 700)
    return () => window.clearTimeout(timer)
  }, [status])

  const start = useCallback(() => {
    setStep(0)
    setActive(true)
  }, [])

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= TOTAL_STEPS) return
    setStep(index)
  }, [])

  const next = useCallback(() => {
    setStep((current) => Math.min(current + 1, TOTAL_STEPS - 1))
  }, [])

  const prev = useCallback(() => {
    setStep((current) => Math.max(current - 1, 0))
  }, [])

  const finish = useCallback(() => {
    setActive(false)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1")
    }
  }, [])

  const value = useMemo<TourContextValue>(
    () => ({
      active,
      step,
      totalSteps: TOTAL_STEPS,
      start,
      next,
      prev,
      finish,
      goTo,
    }),
    [active, step, start, next, prev, finish, goTo]
  )

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour() {
  const value = useContext(TourContext)
  if (!value) {
    throw new Error("useTour must be used inside <TourProvider>")
  }
  return value
}
