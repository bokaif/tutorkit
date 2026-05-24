"use client"

import Link from "next/link"
import { PencilSimple } from "@phosphor-icons/react"

import {
  getClassPaymentState,
  getSubject,
  studentProgress,
} from "@/lib/derive"
import type { SessionNote, Student } from "@/lib/tutoring-data"
import { Pill, StudentAvatar, SubjectMark } from "@/components/ui-bits"
import { Progress } from "@workspace/ui/components/progress"
import { Button } from "@workspace/ui/components/button"

export function StudentCard({
  student,
  notes,
  onEdit,
}: {
  student: Student
  notes: SessionNote[]
  onEdit?: () => void
}) {
  const progress = studentProgress(student)
  const payment = getClassPaymentState(student, notes)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-card/80">
      <div className="flex items-start gap-3">
        <StudentAvatar student={student} size="lg" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/student?id=${student.id}`}
            className="block truncate font-heading text-base font-semibold hover:underline"
          >
            {student.name}
          </Link>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {student.schedule || "No schedule"}
          </p>
        </div>
        {onEdit ? (
          <Button
            type="button"
            size="icon-xs"
            variant="outline"
            onClick={onEdit}
            aria-label="Edit"
          >
            <PencilSimple />
          </Button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {student.assignedSubjectIds.slice(0, 4).map((id) => {
          const subject = getSubject(id)
          if (!subject) return null
          return <SubjectMark key={id} subject={subject} size="sm" />
        })}
        {student.assignedSubjectIds.length > 4 ? (
          <span className="grid size-6 place-items-center rounded-md bg-muted text-[10px] font-semibold text-muted-foreground">
            +{student.assignedSubjectIds.length - 4}
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Progress</span>
          <span className="text-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="mt-1.5 h-1.5" />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Pill tone="muted">
          {payment.totalClasses} class{payment.totalClasses === 1 ? "" : "es"}
        </Pill>
        {payment.target > 0 ? (
          <Pill tone={payment.due ? "danger" : "success"}>
            {payment.sincePaid}/{payment.target}
          </Pill>
        ) : null}
        {student.monthlyFee ? <Pill tone="info">Tk {student.monthlyFee}</Pill> : null}
      </div>
    </div>
  )
}
