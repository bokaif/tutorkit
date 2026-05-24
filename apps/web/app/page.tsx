"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CalendarBlank,
  Flame,
  GraduationCap,
  Wallet,
  WarningCircle,
} from "@phosphor-icons/react"

import { useTutoringStore } from "@/lib/store"
import {
  formatTime,
  getClassPaymentState,
  getRevisionItems,
  getStreak,
  getTodayDayIndex,
  studentProgress,
  todayIso,
} from "@/lib/derive"
import { MiniHeatStrip } from "@/components/graph/contribution-graph"
import { SessionFeed } from "@/components/sessions/session-feed"
import {
  EmptyState,
  KPI,
  Panel,
  Pill,
  StudentAvatar,
} from "@/components/ui-bits"
import { Button } from "@workspace/ui/components/button"

export default function TodayPage() {
  const students = useTutoringStore((s) => s.students)
  const notes = useTutoringStore((s) => s.notes)

  const today = todayIso()
  const todayIndex = getTodayDayIndex()

  const upcomingToday = useMemo(() => {
    const items: Array<{
      student: (typeof students)[number]
      startTime: string
      durationMin: number
    }> = []
    for (const student of students) {
      const slots = student.scheduleSlots ?? []
      for (const slot of slots) {
        if (slot.dayOfWeek === todayIndex) {
          items.push({
            student,
            startTime: slot.startTime,
            durationMin: slot.durationMin,
          })
        }
      }
    }
    return items.sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [students, todayIndex])

  const todayNotes = useMemo(
    () => notes.filter((note) => note.date === today),
    [notes, today]
  )

  const streak = useMemo(() => getStreak(notes), [notes])

  const overdueStudents = useMemo(
    () =>
      students.filter((student) => getClassPaymentState(student, notes).due),
    [students, notes]
  )

  const revisionItems = useMemo(() => getRevisionItems(students), [students])

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPI
          label="Today"
          value={todayNotes.length}
          hint={`${upcomingToday.length} scheduled`}
        />
        <KPI
          label="Streak"
          value={`${streak.current}d`}
          hint={`Best ${streak.longest}d`}
          accent="warning"
        />
        <KPI
          label="Students"
          value={students.length}
          hint={`${students.filter((s) => studentProgress(s) >= 50).length} past 50%`}
        />
        <KPI
          label="Fees due"
          value={overdueStudents.length}
          hint={overdueStudents.length === 0 ? "All clear" : "Tap to settle"}
          accent={overdueStudents.length > 0 ? "danger" : "success"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="p-4 sm:p-5">
          <header className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Schedule today
              </p>
              <h2 className="mt-1 font-heading text-xl font-semibold tracking-tight">
                {new Intl.DateTimeFormat("en", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                }).format(new Date())}
              </h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/schedule">
                Open
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </header>

          {upcomingToday.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={<CalendarBlank weight="duotone" className="size-6" />}
              title="No classes scheduled today"
              description="Add weekly slots in Schedule."
            />
          ) : (
            <div className="mt-4 grid gap-2">
              {upcomingToday.map(({ student, startTime, durationMin }) => (
                <Link
                  key={`${student.id}-${startTime}`}
                  href={`/student?id=${student.id}`}
                  className="tactile flex items-center gap-3 rounded-lg bg-secondary/60 p-3 ring-1 ring-border hover:bg-secondary hover:ring-primary/30"
                >
                  <StudentAvatar student={student} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {student.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {student.assignedSubjectIds.length} subjects . {durationMin}m
                    </p>
                  </div>
                  <Pill tone="primary">{formatTime(startTime)}</Pill>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-5 grid gap-2">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              Last 30 days
            </p>
            <MiniHeatStrip notes={notes} />
          </div>
        </Panel>

        <div className="grid gap-4">
          <Panel className="p-4">
            <header className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-lg bg-destructive/10 text-destructive">
                  <Wallet weight="duotone" className="size-4" />
                </span>
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Fees
                  </p>
                  <h3 className="font-heading text-base font-semibold">
                    {overdueStudents.length === 0
                      ? "All clear"
                      : `${overdueStudents.length} student(s) due`}
                  </h3>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/payments">Open</Link>
              </Button>
            </header>
            {overdueStudents.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {overdueStudents.slice(0, 4).map((student) => {
                  const payment = getClassPaymentState(student, notes)
                  return (
                    <Link
                      key={student.id}
                      href={`/student?id=${student.id}`}
                      className="tactile flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 ring-1 ring-destructive/15 hover:bg-destructive/18"
                    >
                      <StudentAvatar student={student} size="sm" />
                      <span className="flex-1 text-sm font-semibold">
                        {student.name}
                      </span>
                      <Pill tone="danger">
                        {payment.sincePaid}/{payment.target || "-"}
                      </Pill>
                    </Link>
                  )
                })}
              </div>
            ) : null}
          </Panel>

          <Panel className="p-4">
            <header className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-lg bg-[color:var(--warning)]/15 text-[color:var(--warning)]">
                  <WarningCircle weight="duotone" className="size-4" />
                </span>
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Revision
                  </p>
                  <h3 className="font-heading text-base font-semibold">
                    {revisionItems.length} chapters
                  </h3>
                </div>
              </div>
            </header>
            {revisionItems.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Queue clear. Nice.
              </p>
            ) : (
              <div className="mt-3 grid gap-2">
                {revisionItems.slice(0, 4).map((item) => (
                  <Link
                    key={`${item.student.id}-${item.subject.id}-${item.chapterIndex}`}
                    href={`/student?id=${item.student.id}`}
                    className="tactile rounded-lg bg-[color:var(--warning)]/12 px-3 py-2 ring-1 ring-[color:var(--warning)]/15 hover:bg-[color:var(--warning)]/20"
                  >
                    <p className="text-sm font-semibold">{item.chapter}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.student.name} . {item.subject.name}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel className="p-4">
            <header className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Flame weight="duotone" className="size-4" />
              </span>
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Streak
                </p>
                <h3 className="font-heading text-base font-semibold">
                  {streak.current === 0
                    ? "Log a class today"
                    : `${streak.current} day${streak.current === 1 ? "" : "s"} strong`}
                </h3>
              </div>
            </header>
            <p className="mt-3 text-sm text-muted-foreground">
              Personal best: {streak.longest} day{streak.longest === 1 ? "" : "s"}.
            </p>
          </Panel>
        </div>
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={<GraduationCap weight="duotone" className="size-6" />}
          title="Add your first student"
          description="Open Students to add a name, subjects, schedule, and fee."
          action={
            <Button asChild>
              <Link href="/students">Add student</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recent
              </p>
              <h2 className="mt-1 font-heading text-lg font-semibold tracking-tight">
                Latest classes
              </h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/sessions">
                See all
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </header>
          <SessionFeed
            notes={notes.slice(0, 8)}
            students={students}
            emptyTitle="Nothing logged yet"
            emptyDescription="Press N to log your first class."
          />
        </div>
      )}
    </div>
  )
}
