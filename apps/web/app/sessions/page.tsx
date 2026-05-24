"use client"

import { useMemo, useState } from "react"

import { ContributionGraph } from "@/components/graph/contribution-graph"
import { SessionFeed } from "@/components/sessions/session-feed"
import { useTutoringStore } from "@/lib/store"
import { todayIso } from "@/lib/derive"

export default function SessionsPage() {
  const notes = useTutoringStore((s) => s.notes)
  const students = useTutoringStore((s) => s.students)
  const [selectedDate, setSelectedDate] = useState<string>(todayIso())

  const filteredNotes = useMemo(
    () => notes.filter((note) => note.date === selectedDate),
    [notes, selectedDate]
  )

  return (
    <div className="grid gap-4">
      <ContributionGraph
        notes={notes}
        students={students}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />
      <SessionFeed
        notes={filteredNotes.length > 0 ? filteredNotes : notes}
        students={students}
        emptyTitle="Nothing logged yet"
        emptyDescription="Press N or use the orange + button to log your first class."
      />
    </div>
  )
}
