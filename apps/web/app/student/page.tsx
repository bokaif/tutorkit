"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  ArrowSquareOut,
  CalendarBlank,
  Phone,
  PencilSimple,
  Trash,
  Wallet,
} from "@phosphor-icons/react"

import { useTutoringStore } from "@/lib/store"
import {
  formatDate,
  getClassPaymentState,
  getSubject,
  studentProgress,
} from "@/lib/derive"
import { resolveSafeHref } from "@/lib/safe-url"
import { ChapterLadder } from "@/components/students/chapter-ladder"
import { StudentDialog } from "@/components/students/student-dialog"
import { SessionFeed } from "@/components/sessions/session-feed"
import {
  EmptyState,
  InfoLine,
  KPI,
  Panel,
  Pill,
  StudentAvatar,
} from "@/components/ui-bits"
import { Button } from "@workspace/ui/components/button"

function StudentDetail() {
  const searchParams = useSearchParams()
  const id = searchParams?.get("id") ?? ""

  const students = useTutoringStore((s) => s.students)
  const allNotes = useTutoringStore((s) => s.notes)
  const deleteStudent = useTutoringStore((s) => s.deleteStudent)
  const markPaid = useTutoringStore((s) => s.markPaidThroughNow)

  const student = useMemo(
    () => students.find((entry) => entry.id === id),
    [students, id]
  )
  const notes = useMemo(
    () => allNotes.filter((entry) => entry.studentId === id),
    [allNotes, id]
  )

  const [editing, setEditing] = useState(false)

  const payment = useMemo(
    () => (student ? getClassPaymentState(student, notes) : null),
    [student, notes]
  )

  if (!student) {
    return (
      <EmptyState
        title="Student not found"
        description="They may have been deleted or moved."
        action={
          <Button asChild>
            <Link href="/students">
              <ArrowLeft data-icon="inline-start" />
              Back to students
            </Link>
          </Button>
        }
      />
    )
  }

  const progress = studentProgress(student)
  const studentRef = student

  function handleDelete() {
    if (
      typeof window === "undefined" ||
      window.confirm(`Delete ${studentRef.name}? All their sessions go too.`)
    ) {
      deleteStudent(studentRef.id)
    }
  }

  return (
    <div className="grid gap-4">
      <Panel className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <StudentAvatar student={student} size="lg" />
            <div>
              <Pill tone="primary">{student.classLevel}</Pill>
              <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
                {student.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {student.guardianPhone ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    {student.guardianPhone}
                  </span>
                ) : null}
                {student.schedule ? (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarBlank className="size-3.5" />
                    {student.schedule}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <PencilSimple data-icon="inline-start" />
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash data-icon="inline-start" />
              Delete
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <KPI label="Progress" value={`${progress}%`} />
          <KPI
            label="Classes"
            value={payment?.totalClasses ?? 0}
            hint={`${notes.length} logged`}
          />
          <KPI
            label="Cycle"
            value={
              payment && payment.target > 0
                ? `${payment.sincePaid}/${payment.target}`
                : "Set target"
            }
            accent={payment?.due ? "danger" : "default"}
            hint={
              payment && payment.target > 0
                ? payment.due
                  ? "Ready to bill"
                  : `${payment.remaining} left`
                : undefined
            }
          />
          <KPI
            label="Fee"
            value={student.monthlyFee ? `Tk ${student.monthlyFee}` : "-"}
            accent="info"
            hint={payment?.due ? "Due now" : undefined}
          />
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ChapterLadder student={student} />
        <div className="grid gap-4">
          <Panel className="p-4">
            <h3 className="font-heading text-base font-semibold">Books</h3>
            <div className="mt-3 grid gap-2">
              {student.assignedSubjectIds.map((sid) => {
                const subject = getSubject(sid)
                if (!subject) return null
                return (
                  <div
                    key={sid}
                    className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2"
                  >
                    <span className="text-sm font-semibold">
                      {subject.name}
                    </span>
                    {resolveSafeHref(subject.bookFile) ? (
                      <Button asChild size="xs" variant="outline">
                        <a
                          href={resolveSafeHref(subject.bookFile)!}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ArrowSquareOut data-icon="inline-start" />
                          Open
                        </a>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        size="xs"
                        variant="ghost"
                        className="text-muted-foreground"
                      >
                        <Link href="/library">Add</Link>
                      </Button>
                    )}
                  </div>
                )
              })}
              {student.assignedSubjectIds.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No subjects assigned. Edit student to attach subjects.
                </p>
              ) : null}
            </div>
          </Panel>

          <Panel className="p-4">
            <h3 className="font-heading text-base font-semibold">Payment</h3>
            <div className="mt-3 grid gap-2">
              <InfoLine
                label="Schedule"
                value={student.schedule || "Not set"}
              />
              <InfoLine
                label="Fee"
                value={
                  student.monthlyFee ? `Tk ${student.monthlyFee}` : "Not set"
                }
              />
              <InfoLine
                label="Classes / cycle"
                value={
                  payment && payment.target > 0
                    ? `${payment.sincePaid} of ${payment.target}`
                    : "Set target in Edit"
                }
              />
              <Button
                type="button"
                onClick={() => markPaid(student.id)}
                disabled={!payment?.due}
                className="mt-1"
              >
                <Wallet data-icon="inline-start" />
                {payment?.due ? "Mark paid" : "No payment due"}
              </Button>
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3">
        <header className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Notes timeline</h2>
          <p className="text-xs text-muted-foreground">
            Last logged {notes[0] ? formatDate(notes[0].date) : "never"}
          </p>
        </header>
        <SessionFeed
          notes={notes}
          students={[student]}
          emptyTitle="No classes logged"
          emptyDescription="Press N to log a class for this student."
        />
      </div>

      <StudentDialog open={editing} onOpenChange={setEditing} student={student} />
    </div>
  )
}

export default function StudentDetailPage() {
  return (
    <Suspense fallback={null}>
      <StudentDetail />
    </Suspense>
  )
}
