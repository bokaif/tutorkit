"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  ArrowRight,
  ChartLineUp,
  Flame,
  GraduationCap,
} from "@phosphor-icons/react"

import { useTutoringStore } from "@/lib/store"
import {
  classesByMonth,
  formatMonth,
  getStreak,
  getSubject,
  getTopStudent,
  getTopSubject,
  getTotalMinutes,
  studentProgress,
} from "@/lib/derive"
import {
  KPI,
  Panel,
  Pill,
  SectionHeader,
  StudentAvatar,
  SubjectMark,
} from "@/components/ui-bits"
import { cn } from "@workspace/ui/lib/utils"

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

export default function StatsPage() {
  const students = useTutoringStore((s) => s.students)
  const notes = useTutoringStore((s) => s.notes)
  const payments = useTutoringStore((s) => s.payments)

  const year = new Date().getFullYear()

  const streak = useMemo(() => getStreak(notes), [notes])
  const totalMinutes = useMemo(() => getTotalMinutes(notes), [notes])
  const topSubject = useMemo(() => getTopSubject(notes), [notes])
  const topStudent = useMemo(() => getTopStudent(notes), [notes])

  const monthly = useMemo(() => classesByMonth(notes, year), [notes, year])
  const maxMonth = Math.max(1, ...monthly.map((m) => m.count))

  const subjectBreakdown = useMemo(() => {
    const counts = new Map<string, number>()
    for (const note of notes) {
      counts.set(note.subjectId, (counts.get(note.subjectId) ?? 0) + 1)
    }
    const total = Array.from(counts.values()).reduce((a, b) => a + b, 0) || 1
    return Array.from(counts.entries())
      .map(([subjectId, count]) => ({
        subjectId,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count)
  }, [notes])

  const totalEarnings = useMemo(
    () =>
      payments
        .filter((payment) => payment.date.startsWith(`${year}-`))
        .reduce((sum, payment) => sum + payment.amount, 0),
    [payments, year]
  )

  const topStudentEntry =
    topStudent && students.find((student) => student.id === topStudent.studentId)
  const topSubjectEntry =
    topSubject && getSubject(topSubject.subjectId)

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return (
    <div className="grid gap-4">
      <SectionHeader
        title="Stats"
        description={`Snapshot for ${year}`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPI
          label="Total classes"
          value={notes.length}
          hint={`${hours}h ${minutes}m taught`}
        />
        <KPI
          label="Current streak"
          value={`${streak.current}d`}
          accent="warning"
          hint={`Best ${streak.longest}d`}
        />
        <KPI
          label="Earnings YTD"
          value={`Tk ${totalEarnings.toLocaleString()}`}
          accent="success"
        />
        <KPI
          label="Students"
          value={students.length}
          hint={`${students.filter((s) => studentProgress(s) >= 50).length} past 50%`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel className="p-4 sm:p-5">
          <header className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Monthly classes
              </p>
              <h2 className="mt-1 font-heading text-lg font-semibold tracking-tight">
                {year}
              </h2>
            </div>
            <Pill tone="muted">{notes.length} this year</Pill>
          </header>

          <div className="mt-5 grid grid-cols-12 gap-2">
            {monthly.map((entry, idx) => {
              const height = Math.max((entry.count / maxMonth) * 100, 4)
              const isCurrentMonth =
                entry.month === new Date().toISOString().slice(0, 7)
              return (
                <div
                  key={entry.month}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="flex h-32 w-full items-end">
                    <div
                      className={cn(
                        "w-full rounded-t-md transition-all",
                        entry.count > 0
                          ? isCurrentMonth
                            ? "bg-primary"
                            : "bg-primary/40"
                          : "bg-muted"
                      )}
                      style={{ height: `${height}%` }}
                      title={`${formatMonth(entry.month)}: ${entry.count}`}
                    />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {MONTH_SHORT[idx]}
                  </span>
                  <span className="text-[11px] font-semibold">
                    {entry.count}
                  </span>
                </div>
              )
            })}
          </div>
        </Panel>

        <div className="grid gap-4">
          <Panel className="p-4">
            <header className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Flame weight="duotone" />
              </span>
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Streak
                </p>
                <h3 className="font-heading text-base font-semibold">
                  {streak.current} day{streak.current === 1 ? "" : "s"}
                </h3>
              </div>
            </header>
            <p className="mt-2 text-sm text-muted-foreground">
              Best run: {streak.longest} day{streak.longest === 1 ? "" : "s"}.
            </p>
          </Panel>

          {topSubjectEntry ? (
            <Panel className="p-4">
              <header className="flex items-center gap-2">
                <SubjectMark subject={topSubjectEntry} size="lg" />
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Top subject
                  </p>
                  <h3 className="font-heading text-base font-semibold">
                    {topSubjectEntry.name}
                  </h3>
                </div>
              </header>
              <p className="mt-2 text-sm text-muted-foreground">
                {topSubject?.count} classes logged.
              </p>
            </Panel>
          ) : null}

          {topStudentEntry ? (
            <Panel className="p-4">
              <header className="flex items-center gap-2">
                <StudentAvatar student={topStudentEntry} size="lg" />
                <div>
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Top student
                  </p>
                  <h3 className="font-heading text-base font-semibold">
                    {topStudentEntry.name}
                  </h3>
                </div>
              </header>
              <p className="mt-2 text-sm text-muted-foreground">
                {topStudent?.count} sessions.
              </p>
              <Link
                href={`/students/${topStudentEntry.id}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Open profile <ArrowRight className="size-3" />
              </Link>
            </Panel>
          ) : null}
        </div>
      </div>

      <Panel className="p-4">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <ChartLineUp weight="duotone" />
            </span>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Subject mix
              </p>
              <h3 className="font-heading text-base font-semibold">
                Where time goes
              </h3>
            </div>
          </div>
        </header>

        {subjectBreakdown.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Log a class to see your subject mix.
          </p>
        ) : (
          <div className="mt-3 grid gap-2">
            {subjectBreakdown.map((entry) => {
              const subject = getSubject(entry.subjectId)
              if (!subject) return null
              return (
                <div
                  key={entry.subjectId}
                  className="grid gap-1.5 rounded-lg bg-muted/40 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <SubjectMark subject={subject} size="sm" />
                      <span className="text-sm font-semibold">
                        {subject.name}
                      </span>
                    </div>
                    <Pill tone="muted">{entry.count}</Pill>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-card">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${entry.percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Panel>

      {students.length > 0 ? (
        <Panel className="p-4">
          <header className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <GraduationCap weight="duotone" />
            </span>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Roster
              </p>
              <h3 className="font-heading text-base font-semibold">
                Progress by student
              </h3>
            </div>
          </header>
          <div className="mt-3 grid gap-2">
            {students
              .slice()
              .sort((a, b) => studentProgress(b) - studentProgress(a))
              .map((student) => {
                const progress = studentProgress(student)
                return (
                  <Link
                    key={student.id}
                    href={`/students/${student.id}`}
                    className="grid gap-1.5 rounded-lg bg-muted/40 px-3 py-2 transition-colors hover:bg-muted"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StudentAvatar student={student} size="sm" />
                        <span className="text-sm font-semibold">
                          {student.name}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-card">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </Link>
                )
              })}
          </div>
        </Panel>
      ) : null}
    </div>
  )
}
