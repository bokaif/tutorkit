"use client"

import { useState } from "react"

import { useTutoringStore } from "@/lib/store"
import { getChapters, getSubject, subjectProgress } from "@/lib/derive"
import type { ProgressStatus, Student, Subject } from "@/lib/tutoring-data"
import { Panel, Pill, SubjectMark } from "@/components/ui-bits"
import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

const STATUS_ORDER: ProgressStatus[] = [
  "not-started",
  "in-progress",
  "completed",
  "needs-revision",
]

const STATUS_LABEL: Record<ProgressStatus, string> = {
  "not-started": "Queued",
  "in-progress": "Teaching",
  completed: "Done",
  "needs-revision": "Revise",
}

const STATUS_TONE: Record<ProgressStatus, string> = {
  "not-started": "bg-muted text-muted-foreground border-transparent",
  "in-progress": "bg-primary/12 text-primary border-primary/25",
  completed:
    "bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/30",
  "needs-revision":
    "bg-[color:var(--warning)]/15 text-[color:var(--warning)] border-[color:var(--warning)]/30",
}

export function ChapterLadder({ student }: { student: Student }) {
  const setChapterStatus = useTutoringStore((s) => s.setChapterStatus)
  const [activeSubjectId, setActiveSubjectId] = useState(
    student.assignedSubjectIds[0] ?? ""
  )

  const subject = getSubject(activeSubjectId)
  if (!subject) {
    return null
  }

  const chapters = getChapters(student, subject.id)
  const progress = subjectProgress(student, subject.id)

  return (
    <Panel className="p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {student.assignedSubjectIds.map((id) => {
            const s = getSubject(id)
            if (!s) return null
            const isActive = activeSubjectId === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSubjectId(id)}
                className={cn(
                  "tactile flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-muted/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <SubjectMark subject={s} size="sm" />
                {s.name}
              </button>
            )
          })}
        </div>
        <div className="min-w-[140px] text-right">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Subject progress
          </p>
          <p className="font-heading text-xl font-semibold leading-none">
            {progress}%
          </p>
        </div>
      </header>

      <Progress value={progress} className="mt-3 h-1.5" />

      <div className="mt-4 grid gap-1">
        {chapters.map((chapter) => (
          <ChapterRow
            key={`${subject.id}-${chapter.chapterIndex}`}
            subject={subject}
            chapter={chapter.chapter}
            index={chapter.chapterIndex}
            status={chapter.status}
            onStatus={(status) =>
              setChapterStatus(
                student.id,
                subject.id,
                chapter.chapterIndex,
                status
              )
            }
          />
        ))}
      </div>
    </Panel>
  )
}

function ChapterRow({
  subject,
  chapter,
  index,
  status,
  onStatus,
}: {
  subject: Subject
  chapter: string
  index: number
  status: ProgressStatus
  onStatus: (status: ProgressStatus) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-transparent px-2 py-2 hover:bg-muted/50">
      <span className="grid size-7 place-items-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {chapter}
      </span>
      <Pill tone="muted" className="md:hidden">
        {STATUS_LABEL[status]}
      </Pill>
      <div className="hidden flex-wrap gap-1 md:flex">
        {STATUS_ORDER.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onStatus(option)}
            className={cn(
              "tactile h-7 rounded-md border px-2 text-[11px] font-semibold uppercase tracking-wider transition-colors",
              status === option
                ? STATUS_TONE[option]
                : "border-transparent text-muted-foreground hover:bg-muted"
            )}
            aria-label={`Set ${subject.name} ch ${index + 1} ${STATUS_LABEL[option]}`}
          >
            {STATUS_LABEL[option]}
          </button>
        ))}
      </div>
    </div>
  )
}
