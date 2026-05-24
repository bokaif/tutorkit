"use client"

import { useEffect, useMemo, useState } from "react"

import { useTutoringStore } from "@/lib/store"
import {
  type ScheduleSlot,
  type Student,
  studentPalette,
  subjects,
} from "@/lib/tutoring-data"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

type StudentFormState = {
  id?: string
  name: string
  guardianPhone: string
  schedule: string
  monthlyFee: string
  classesPerPayment: string
  color: string
  assignedSubjectIds: string[]
  scheduleSlots: ScheduleSlot[]
}

function emptyForm(): StudentFormState {
  return {
    name: "",
    guardianPhone: "",
    schedule: "",
    monthlyFee: "",
    classesPerPayment: "",
    color: studentPalette[0] ?? "#3B82F6",
    assignedSubjectIds: subjects.map((s) => s.id),
    scheduleSlots: [],
  }
}

export function StudentDialog({
  open,
  onOpenChange,
  student,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student | null
}) {
  const addStudent = useTutoringStore((s) => s.addStudent)
  const updateStudent = useTutoringStore((s) => s.updateStudent)

  const [form, setForm] = useState<StudentFormState>(emptyForm())

  useEffect(() => {
    if (!open) return
    if (student) {
      setForm({
        id: student.id,
        name: student.name,
        guardianPhone: student.guardianPhone ?? "",
        schedule: student.schedule ?? "",
        monthlyFee: student.monthlyFee ?? "",
        classesPerPayment: student.classesPerPayment ?? "",
        color: student.color ?? studentPalette[0] ?? "#3B82F6",
        assignedSubjectIds: student.assignedSubjectIds,
        scheduleSlots: student.scheduleSlots ?? [],
      })
    } else {
      setForm(emptyForm())
    }
  }, [open, student])

  const allSelected = form.assignedSubjectIds.length === subjects.length

  function toggleSubject(subjectId: string, checked: boolean) {
    setForm((current) => ({
      ...current,
      assignedSubjectIds: checked
        ? Array.from(new Set([...current.assignedSubjectIds, subjectId]))
        : current.assignedSubjectIds.filter((id) => id !== subjectId),
    }))
  }

  function toggleDay(day: number) {
    setForm((current) => {
      const existing = current.scheduleSlots.find((s) => s.dayOfWeek === day)
      if (existing) {
        return {
          ...current,
          scheduleSlots: current.scheduleSlots.filter(
            (s) => s.dayOfWeek !== day
          ),
        }
      }
      const lastSlot = current.scheduleSlots[current.scheduleSlots.length - 1]
      return {
        ...current,
        scheduleSlots: [
          ...current.scheduleSlots,
          {
            dayOfWeek: day,
            startTime: lastSlot?.startTime ?? "19:00",
            durationMin: lastSlot?.durationMin ?? 60,
          },
        ].sort((a, b) => a.dayOfWeek - b.dayOfWeek),
      }
    })
  }

  function updateSlot(
    day: number,
    patch: Partial<Omit<ScheduleSlot, "dayOfWeek">>
  ) {
    setForm((current) => ({
      ...current,
      scheduleSlots: current.scheduleSlots.map((slot) =>
        slot.dayOfWeek === day ? { ...slot, ...patch } : slot
      ),
    }))
  }

  const activeDays = useMemo(
    () => new Set(form.scheduleSlots.map((slot) => slot.dayOfWeek)),
    [form.scheduleSlots]
  )

  function save() {
    const name = form.name.trim()
    if (!name || form.assignedSubjectIds.length === 0) return

    const base = {
      name,
      classLevel: "Class 9" as const,
      guardianPhone: form.guardianPhone.trim() || undefined,
      schedule: form.schedule.trim() || undefined,
      monthlyFee: form.monthlyFee.trim() || undefined,
      classesPerPayment: form.classesPerPayment.trim() || undefined,
      color: form.color,
      assignedSubjectIds: form.assignedSubjectIds,
      scheduleSlots: form.scheduleSlots,
    }

    if (form.id) {
      updateStudent(form.id, base)
    } else {
      addStudent(base)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {form.id ? "Edit student" : "Add student"}
          </DialogTitle>
          <DialogDescription>
            Name, fee, subjects, weekly schedule. Keep it tight.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Student name"
              />
            </Field>
            <Field label="Guardian phone">
              <Input
                value={form.guardianPhone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    guardianPhone: event.target.value,
                  }))
                }
                placeholder="01..."
              />
            </Field>
            <Field label="Fee amount">
              <Input
                value={form.monthlyFee}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    monthlyFee: event.target.value,
                  }))
                }
                placeholder="6000"
                inputMode="numeric"
              />
            </Field>
            <Field label="Classes per payment">
              <Input
                value={form.classesPerPayment}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    classesPerPayment: event.target.value,
                  }))
                }
                placeholder="8"
                inputMode="numeric"
              />
            </Field>
          </div>

          <Field label="Color">
            <div className="flex flex-wrap gap-2">
              {studentPalette.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({ ...current, color }))
                  }
                  className={cn(
                    "tactile size-7 rounded-full border-2",
                    form.color === color
                      ? "border-foreground"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Pick ${color}`}
                />
              ))}
            </div>
          </Field>

          <div>
            <div className="flex items-center justify-between gap-3">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Subjects
              </Label>
              <button
                type="button"
                className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    assignedSubjectIds: allSelected
                      ? []
                      : subjects.map((s) => s.id),
                  }))
                }
              >
                {allSelected ? "Clear" : "Select all"}
              </button>
            </div>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {subjects.map((subject) => (
                <label
                  key={subject.id}
                  className="flex items-center gap-2.5 rounded-lg bg-muted/60 px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={form.assignedSubjectIds.includes(subject.id)}
                    onCheckedChange={(checked) =>
                      toggleSubject(subject.id, Boolean(checked))
                    }
                  />
                  <span className="font-semibold">{subject.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Weekly slots
            </Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DAY_LABELS.map((label, idx) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={cn(
                    "tactile h-9 rounded-full border px-3 text-xs font-semibold",
                    activeDays.has(idx)
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-muted/60 text-muted-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {form.scheduleSlots.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {form.scheduleSlots.map((slot) => (
                  <div
                    key={slot.dayOfWeek}
                    className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2"
                  >
                    <span className="w-12 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {DAY_LABELS[slot.dayOfWeek]}
                    </span>
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(event) =>
                        updateSlot(slot.dayOfWeek, {
                          startTime: event.target.value,
                        })
                      }
                      className="h-9 max-w-[140px] bg-card"
                    />
                    <Input
                      type="number"
                      min={15}
                      step={15}
                      value={slot.durationMin}
                      onChange={(event) =>
                        updateSlot(slot.dayOfWeek, {
                          durationMin:
                            Number.parseInt(event.target.value, 10) || 0,
                        })
                      }
                      className="h-9 max-w-[100px] bg-card"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <Field label="Schedule note (optional)">
            <Input
              value={form.schedule}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  schedule: event.target.value,
                }))
              }
              placeholder="Sun Tue Thu, 7:30 PM"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={!form.name.trim() || form.assignedSubjectIds.length === 0}
          >
            Save student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  )
}
