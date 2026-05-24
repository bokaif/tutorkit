"use client"

import { useEffect, useState } from "react"

import type { Subject } from "@/lib/tutoring-data"

export type PdfAvailability = Record<string, boolean | "checking">

/**
 * Probe each subject's `bookFile` with a HEAD request. External URLs (https://)
 * are assumed reachable since CORS / cross-origin probes are unreliable.
 */
export function usePdfAvailability(subjects: Subject[]): PdfAvailability {
  const ids = subjects.map((s) => s.id).join("|")
  const [availability, setAvailability] = useState<PdfAvailability>(() =>
    Object.fromEntries(subjects.map((s) => [s.id, "checking"]))
  )

  useEffect(() => {
    let cancelled = false

    async function check() {
      const entries = await Promise.all(
        subjects.map(async (subject) => {
          if (!subject.bookFile) {
            return [subject.id, false] as const
          }
          if (/^https?:\/\//i.test(subject.bookFile)) {
            return [subject.id, true] as const
          }
          try {
            const response = await fetch(subject.bookFile, { method: "HEAD" })
            return [subject.id, response.ok] as const
          } catch {
            return [subject.id, false] as const
          }
        })
      )

      if (!cancelled) {
        setAvailability(Object.fromEntries(entries))
      }
    }

    check()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids])

  return availability
}
