"use client"

import Link from "next/link"
import { Clock, Trash } from "@phosphor-icons/react"

import { useTutoringStore } from "@/lib/store"
import { getSubject } from "@/lib/derive"
import type { SessionNote, Student } from "@/lib/tutoring-data"
import { Pill, StudentAvatar, SubjectMark } from "@/components/ui-bits"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"

export function SessionRow({
  note,
  student,
}: {
  note: SessionNote
  student?: Student
}) {
  const subject = getSubject(note.subjectId)
  const deleteSession = useTutoringStore((s) => s.deleteSession)

  return (
    <div className="group flex items-start gap-3 rounded-lg border border-transparent bg-card p-3 transition-colors hover:border-border">
      {subject ? (
        <SubjectMark subject={subject} size="md" className="mt-0.5" />
      ) : (
        <span className="mt-0.5 grid size-8 place-items-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
          ?
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {student ? (
            <Link
              href={`/students/${student.id}`}
              className="flex items-center gap-1.5 text-sm font-semibold hover:underline"
            >
              <StudentAvatar student={student} size="sm" />
              {student.name}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">
              Unknown
            </span>
          )}
          <span className="text-xs text-muted-foreground">.</span>
          <span className="text-xs font-medium text-muted-foreground">
            {subject?.name ?? "Subject"} . Ch {note.chapterIndex + 1}
          </span>
          {note.durationMin ? (
            <Pill tone="muted" className="gap-1">
              <Clock className="size-3" />
              {note.durationMin}m
            </Pill>
          ) : null}
        </div>
        {note.note ? (
          <p className="mt-1.5 text-sm text-foreground/85">{note.note}</p>
        ) : null}
        {note.tags && note.tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {note.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                #{tag}
              </Badge>
            ))}
          </div>
        ) : null}
        {note.homework ? (
          <p className="mt-1.5 text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">Homework</span>
            <span className="mx-1.5">.</span>
            {note.homework}
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        onClick={() => deleteSession(note.id)}
        aria-label="Delete session"
      >
        <Trash />
      </Button>
    </div>
  )
}
