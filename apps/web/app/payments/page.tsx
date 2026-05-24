"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  CheckCircle,
  Plus,
  Trash,
  Wallet,
} from "@phosphor-icons/react"

import { useTutoringStore } from "@/lib/store"
import {
  formatDate,
  getClassPaymentState,
  parseFee,
  todayIso,
} from "@/lib/derive"
import type { Payment, Student } from "@/lib/tutoring-data"
import {
  EmptyState,
  KPI,
  Panel,
  Pill,
  StudentAvatar,
} from "@/components/ui-bits"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { toast } from "@workspace/ui/components/sonner"

type PaymentDraft = {
  studentId: string
  amount: string
  classesCovered: string
  date: string
  note: string
}

function emptyDraft(studentId = ""): PaymentDraft {
  return {
    studentId,
    amount: "",
    classesCovered: "",
    date: todayIso(),
    note: "",
  }
}

export default function PaymentsPage() {
  const students = useTutoringStore((s) => s.students)
  const notes = useTutoringStore((s) => s.notes)
  const payments = useTutoringStore((s) => s.payments)
  const addPayment = useTutoringStore((s) => s.addPayment)
  const deletePayment = useTutoringStore((s) => s.deletePayment)
  const markPaid = useTutoringStore((s) => s.markPaidThroughNow)

  const [draftOpen, setDraftOpen] = useState(false)
  const [draft, setDraft] = useState<PaymentDraft>(emptyDraft())

  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const monthEarnings = useMemo(
    () =>
      payments
        .filter((payment) => payment.date.startsWith(currentMonth))
        .reduce((sum, payment) => sum + payment.amount, 0),
    [payments, currentMonth]
  )
  const ytdEarnings = useMemo(() => {
    const year = now.getFullYear()
    return payments
      .filter((payment) => payment.date.startsWith(`${year}-`))
      .reduce((sum, payment) => sum + payment.amount, 0)
  }, [payments, now])

  const dueStudents = useMemo(
    () =>
      students
        .map((student) => ({
          student,
          state: getClassPaymentState(student, notes),
        }))
        .filter((entry) => entry.state.due),
    [students, notes]
  )

  function openDraft(studentId?: string) {
    setDraft(emptyDraft(studentId ?? students[0]?.id ?? ""))
    setDraftOpen(true)
  }

  function savePayment() {
    const amount = parseFee(draft.amount)
    if (!draft.studentId || amount <= 0) return
    addPayment({
      studentId: draft.studentId,
      amount,
      classesCovered:
        Number.parseInt(draft.classesCovered, 10) > 0
          ? Number.parseInt(draft.classesCovered, 10)
          : 0,
      date: draft.date,
      note: draft.note.trim() || undefined,
    })
    markPaid(draft.studentId)
    toast.success("Payment logged")
    setDraftOpen(false)
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ledger
          </p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Payments
          </h1>
        </div>
        <Button type="button" onClick={() => openDraft()}>
          <Plus data-icon="inline-start" />
          Log payment
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <KPI
          label="This month"
          value={`Tk ${monthEarnings.toLocaleString()}`}
          accent="success"
        />
        <KPI
          label="Year to date"
          value={`Tk ${ytdEarnings.toLocaleString()}`}
          accent="info"
          hint={`${payments.length} payments`}
        />
        <KPI
          label="Due now"
          value={dueStudents.length}
          accent={dueStudents.length === 0 ? "success" : "danger"}
          hint={dueStudents.length === 0 ? "Clear" : "Action needed"}
        />
      </div>

      <Panel className="p-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-semibold">Due now</h2>
            <p className="text-xs text-muted-foreground">
              Students who hit their class-per-payment target.
            </p>
          </div>
        </header>

        {dueStudents.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            All students are within their current cycle.
          </p>
        ) : (
          <div className="mt-3 grid gap-2">
            {dueStudents.map(({ student, state }) => (
              <DueRow
                key={student.id}
                student={student}
                sincePaid={state.sincePaid}
                target={state.target}
                onLog={() => openDraft(student.id)}
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel className="p-4">
        <header className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-base font-semibold">History</h2>
          <Pill tone="muted">{payments.length} entries</Pill>
        </header>
        {payments.length === 0 ? (
          <EmptyState
            className="mt-3"
            icon={<Wallet weight="duotone" className="size-6" />}
            title="No payments yet"
            description="Log your first payment to start the ledger."
            action={<Button onClick={() => openDraft()}>Log payment</Button>}
          />
        ) : (
          <div className="mt-3 grid gap-2">
            {payments.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                student={students.find((s) => s.id === payment.studentId)}
                onDelete={() => deletePayment(payment.id)}
              />
            ))}
          </div>
        )}
      </Panel>

      <Dialog open={draftOpen} onOpenChange={setDraftOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log payment</DialogTitle>
            <DialogDescription>
              Records the payment and marks the student&apos;s current class
              cycle as paid.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Student
              </Label>
              <Select
                value={draft.studentId}
                onValueChange={(value) =>
                  setDraft((current) => ({ ...current, studentId: value }))
                }
              >
                <SelectTrigger className="w-full bg-card">
                  <SelectValue placeholder="Pick a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Amount (Tk)
                </Label>
                <Input
                  type="number"
                  value={draft.amount}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  inputMode="numeric"
                  placeholder="6000"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Classes covered
                </Label>
                <Input
                  type="number"
                  value={draft.classesCovered}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      classesCovered: event.target.value,
                    }))
                  }
                  inputMode="numeric"
                  placeholder="8"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </Label>
                <Input
                  type="date"
                  value={draft.date}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Note
                </Label>
                <Input
                  value={draft.note}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  placeholder="cash, bkash, ..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDraftOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={savePayment}
              disabled={!draft.studentId || parseFee(draft.amount) <= 0}
            >
              Save payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DueRow({
  student,
  sincePaid,
  target,
  onLog,
}: {
  student: Student
  sincePaid: number
  target: number
  onLog: () => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-destructive/8 px-3 py-2.5">
      <StudentAvatar student={student} />
      <div className="min-w-0 flex-1">
        <Link
          href={`/student?id=${student.id}`}
          className="block text-sm font-semibold hover:underline"
        >
          {student.name}
        </Link>
        <p className="text-xs text-muted-foreground">
          {sincePaid} of {target} classes . {student.monthlyFee ? `Tk ${student.monthlyFee}` : "Set fee"}
        </p>
      </div>
      <Button type="button" size="sm" onClick={onLog}>
        <CheckCircle data-icon="inline-start" />
        Settle
      </Button>
    </div>
  )
}

function PaymentRow({
  payment,
  student,
  onDelete,
}: {
  payment: Payment
  student?: Student
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-transparent bg-card px-3 py-2.5 transition-colors hover:border-border">
      {student ? (
        <StudentAvatar student={student} />
      ) : (
        <span className="grid size-9 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
          ?
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{student?.name ?? "Unknown"}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(payment.date)}
          {payment.classesCovered > 0
            ? ` . ${payment.classesCovered} classes`
            : ""}
          {payment.note ? ` . ${payment.note}` : ""}
        </p>
      </div>
      <Pill tone="success">Tk {payment.amount.toLocaleString()}</Pill>
      <Button
        type="button"
        size="icon-xs"
        variant="ghost"
        onClick={onDelete}
        aria-label="Delete payment"
      >
        <Trash />
      </Button>
    </div>
  )
}
