"use client"

import { useMemo } from "react"

import { formatDate } from "@/lib/derive"
import type { SessionNote, Student } from "@/lib/tutoring-data"
import { Panel, EmptyState } from "@/components/ui-bits"
import { Pill } from "@/components/ui-bits"
import { SessionRow } from "@/components/sessions/session-row"
import { ClipboardText } from "@phosphor-icons/react"

export function SessionFeed({
  notes,
  students,
  emptyTitle = "No classes logged",
  emptyDescription = "Hit N or the + button to log a class.",
}: {
  notes: SessionNote[]
  students: Student[]
  emptyTitle?: string
  emptyDescription?: string
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, SessionNote[]>()
    const sorted = [...notes].sort((a, b) => (a.date > b.date ? -1 : 1))
    for (const note of sorted) {
      const bucket = map.get(note.date)
      if (bucket) bucket.push(note)
      else map.set(note.date, [note])
    }
    return Array.from(map.entries())
  }, [notes])

  const studentById = useMemo(
    () => new Map(students.map((s) => [s.id, s] as const)),
    [students]
  )

  if (grouped.length === 0) {
    return (
      <Panel className="p-5">
        <EmptyState
          icon={<ClipboardText weight="duotone" className="size-6" />}
          title={emptyTitle}
          description={emptyDescription}
        />
      </Panel>
    )
  }

  return (
    <div className="grid gap-4">
      {grouped.map(([date, dayNotes]) => (
        <Panel key={date} className="p-4">
          <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
            <h3 className="font-heading text-sm font-semibold tracking-tight">
              {formatDate(date)}
            </h3>
            <Pill tone="muted">
              {dayNotes.length} {dayNotes.length === 1 ? "class" : "classes"}
            </Pill>
          </header>
          <div className="mt-3 grid gap-2">
            {dayNotes.map((note) => (
              <SessionRow
                key={note.id}
                note={note}
                student={studentById.get(note.studentId)}
              />
            ))}
          </div>
        </Panel>
      ))}
    </div>
  )
}
