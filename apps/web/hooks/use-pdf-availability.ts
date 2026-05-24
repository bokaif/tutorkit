"use client"

import { useEffect, useState } from "react"

import { subjects } from "@/lib/tutoring-data"

export type PdfAvailability = Record<string, boolean | "checking">

export function usePdfAvailability(): PdfAvailability {
  const [availability, setAvailability] = useState<PdfAvailability>(() =>
    subjects.reduce<PdfAvailability>((acc, subject) => {
      acc[subject.id] = "checking"
      return acc
    }, {})
  )

  useEffect(() => {
    let cancelled = false

    async function check() {
      const entries = await Promise.all(
        subjects.map(async (subject) => {
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
  }, [])

  return availability
}
