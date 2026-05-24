"use client"

import { useMemo, useState } from "react"

import { ContributionGraph } from "@/components/graph/contribution-graph"
import { SessionFeed } from "@/components/sessions/session-feed"
import { Pill } from "@/components/ui-bits"
import { Button } from "@workspace/ui/components/button"
import { useTutoringStore } from "@/lib/store"
import { formatDate } from "@/lib/derive"

export default function SessionsPage() {
  const notes = useTutoringStore((s) => s.notes)
  const students = useTutoringStore((s) => s.students)
  const [filterDate, setFilterDate] = useState<string | null>(null)

  const filteredNotes = useMemo(
    () =>
      filterDate ? notes.filter((note) => note.date === filterDate) : notes,
    [notes, filterDate]
  )

  return (
    <div className="grid min-w-0 max-w-full gap-4">
      <ContributionGraph
        notes={notes}
        students={students}
        selectedDate={filterDate ?? undefined}
        onSelectDate={setFilterDate}
        className="min-w-0"
      />
      <div className="min-w-0 space-y-3">
        {filterDate ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary/55 px-3 py-2 ring-1 ring-border">
            <Pill tone="primary">{formatDate(filterDate)}</Pill>
            <span className="text-xs text-muted-foreground">
              {filteredNotes.length}{" "}
              {filteredNotes.length === 1 ? "class" : "classes"}
            </span>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => setFilterDate(null)}
            >
              Show all
            </Button>
          </div>
        ) : null}
        <SessionFeed
          notes={filteredNotes}
          students={students}
          emptyTitle={
            filterDate && notes.length > 0
              ? `No classes on ${formatDate(filterDate)}`
              : "Nothing logged yet"
          }
          emptyDescription={
            filterDate && notes.length > 0
              ? "Pick another square on the graph, or log a class for this day."
              : "Press N or the + button to log your first class."
          }
        />
      </div>
    </div>
  )
}
