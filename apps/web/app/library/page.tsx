"use client"

import Link from "next/link"
import { ArrowSquareOut, BookOpen, Warning } from "@phosphor-icons/react"

import { useTutoringStore } from "@/lib/store"
import { subjects } from "@/lib/tutoring-data"
import { usePdfAvailability } from "@/hooks/use-pdf-availability"
import {
  Panel,
  Pill,
  SectionHeader,
  SubjectMark,
} from "@/components/ui-bits"
import { Button } from "@workspace/ui/components/button"

export default function LibraryPage() {
  const students = useTutoringStore((s) => s.students)
  const availability = usePdfAvailability()

  return (
    <div className="grid gap-4">
      <SectionHeader
        title="Library"
        description="Class 9 NCTB books used in your tutoring."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {subjects.map((subject) => {
          const present = availability[subject.id]
          const assigned = students.filter((student) =>
            student.assignedSubjectIds.includes(subject.id)
          )

          return (
            <Panel key={subject.id} className="p-4">
              <header className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <SubjectMark subject={subject} size="lg" />
                  <div>
                    <h3 className="font-heading text-base font-semibold">
                      {subject.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {subject.chapters.length} chapters
                    </p>
                  </div>
                </div>
                <Pill
                  tone={
                    present === true
                      ? "success"
                      : present === false
                        ? "danger"
                        : "muted"
                  }
                >
                  {present === true
                    ? "Ready"
                    : present === false
                      ? "Missing"
                      : "Checking"}
                </Pill>
              </header>

              <div className="mt-3 grid gap-1.5">
                {subject.chapters.slice(0, 6).map((chapter, idx) => (
                  <p
                    key={chapter}
                    className="truncate text-xs text-muted-foreground"
                  >
                    <span className="mr-2 inline-flex size-5 items-center justify-center rounded bg-muted text-[10px] font-semibold text-foreground/80">
                      {idx + 1}
                    </span>
                    {chapter}
                  </p>
                ))}
                {subject.chapters.length > 6 ? (
                  <p className="text-xs text-muted-foreground">
                    +{subject.chapters.length - 6} more
                  </p>
                ) : null}
              </div>

              {assigned.length > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Used by
                  </span>
                  {assigned.map((student) => (
                    <Link
                      key={student.id}
                      href={`/student?id=${student.id}`}
                      className="rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-semibold hover:bg-muted"
                    >
                      {student.name}
                    </Link>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex gap-2">
                {present === false ? (
                  <Button variant="outline" size="sm" disabled>
                    <Warning data-icon="inline-start" />
                    PDF missing
                  </Button>
                ) : (
                  <Button asChild size="sm" disabled={present === "checking"}>
                    <a
                      href={subject.bookFile}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ArrowSquareOut data-icon="inline-start" />
                      Open PDF
                    </a>
                  </Button>
                )}
              </div>
            </Panel>
          )
        })}
      </div>

      {subjects.length === 0 ? (
        <Panel className="p-6 text-center text-sm text-muted-foreground">
          <BookOpen className="mx-auto mb-2 size-6" />
          No subjects configured.
        </Panel>
      ) : null}
    </div>
  )
}
