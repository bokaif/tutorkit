"use client"

import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { CheckCircle, ClipboardText, Plus, X } from "@phosphor-icons/react"

import { useTutoringStore } from "@/lib/store"
import {
  getNextChapter,
  getSubject,
  getTags,
  todayIso,
} from "@/lib/derive"
import { SubjectMark } from "@/components/ui-bits"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Textarea } from "@workspace/ui/components/textarea"
import { toast } from "@workspace/ui/components/sonner"
import { cn } from "@workspace/ui/lib/utils"

const DURATION_CHIPS = [30, 45, 60, 75, 90, 120]
const DRAFT_KEY = "tutorkit:quick-log:draft"

type QuickLogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultStudentId?: string | null
}

type DraftItem = {
  subjectId: string
  chapterIndex: number
}

type Draft = {
  studentId: string
  items: DraftItem[]
  date: string
  durationMin: number
  note: string
  tags: string
  homework: string
  markChapterDone: boolean
}

function emptyDraft(studentId: string, items: DraftItem[] = []): Draft {
  return {
    studentId,
    items,
    date: todayIso(),
    durationMin: 60,
    note: "",
    tags: "",
    homework: "",
    markChapterDone: false,
  }
}

export function QuickLogSheet({
  open,
  onOpenChange,
  defaultStudentId,
}: QuickLogProps) {
  const students = useTutoringStore((s) => s.students)
  const addSession = useTutoringStore((s) => s.addSession)
  const setChapterStatus = useTutoringStore((s) => s.setChapterStatus)

  const fallbackStudent = students[0]
  const initialStudent =
    students.find((student) => student.id === defaultStudentId) ??
    fallbackStudent ??
    null

  const [draft, setDraft] = useState<Draft>(() =>
    emptyDraft(initialStudent?.id ?? "")
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(DRAFT_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Draft>
        setDraft((current) => ({
          ...current,
          ...parsed,
          items: Array.isArray(parsed.items) ? parsed.items : [],
          date: todayIso(),
        }))
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (
      !draft.note &&
      !draft.tags &&
      !draft.homework &&
      draft.items.length === 0
    ) {
      window.localStorage.removeItem(DRAFT_KEY)
      return
    }
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [draft])

  useEffect(() => {
    if (!open) return
    setDraft((current) => {
      if (current.studentId) return current
      if (!initialStudent) return current
      return { ...current, studentId: initialStudent.id }
    })
  }, [open, initialStudent])

  const activeStudent = useMemo(
    () => students.find((student) => student.id === draft.studentId) ?? null,
    [draft.studentId, students]
  )

  useEffect(() => {
    if (!activeStudent) return
    const assigned = new Set(activeStudent.assignedSubjectIds)
    setDraft((current) => {
      const filtered = current.items.filter((it) => assigned.has(it.subjectId))
      if (filtered.length === current.items.length) return current
      return { ...current, items: filtered }
    })
  }, [activeStudent])

  function toggleSubject(subjectId: string) {
    if (!activeStudent) return
    setDraft((current) => {
      const exists = current.items.some((it) => it.subjectId === subjectId)
      if (exists) {
        return {
          ...current,
          items: current.items.filter((it) => it.subjectId !== subjectId),
        }
      }
      const next = getNextChapter(activeStudent, subjectId)
      return {
        ...current,
        items: [
          ...current.items,
          { subjectId, chapterIndex: next?.chapterIndex ?? 0 },
        ],
      }
    })
  }

  function updateChapter(subjectId: string, chapterIndex: number) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((it) =>
        it.subjectId === subjectId ? { ...it, chapterIndex } : it
      ),
    }))
  }

  function reset() {
    setDraft((current) => ({
      ...current,
      items: [],
      note: "",
      tags: "",
      homework: "",
      markChapterDone: false,
    }))
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DRAFT_KEY)
    }
  }

  function save() {
    if (!activeStudent || draft.items.length === 0) return
    const first = draft.items[0]!

    addSession({
      studentId: activeStudent.id,
      subjectId: first.subjectId,
      chapterIndex: first.chapterIndex,
      items: draft.items,
      note: draft.note.trim(),
      tags: getTags(draft.tags),
      homework: draft.homework.trim() || undefined,
      durationMin: draft.durationMin,
      date: draft.date || todayIso(),
    })

    if (draft.markChapterDone) {
      for (const it of draft.items) {
        setChapterStatus(
          activeStudent.id,
          it.subjectId,
          it.chapterIndex,
          "completed"
        )
      }
    }

    const summaryNames = draft.items
      .map((it) => getSubject(it.subjectId)?.name ?? "")
      .filter(Boolean)
      .join(", ")
    toast.success("Class logged", {
      description: `${activeStudent.name} · ${summaryNames} · ${draft.durationMin}m`,
    })
    reset()
    onOpenChange(false)
  }

  const canSave = Boolean(activeStudent && draft.items.length > 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md app-scroll overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Log a class</SheetTitle>
          <SheetDescription>
            One-tap session entry. Hotkey N. Tap as many subjects as you
            covered.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-5">
          <Field label="Student">
            <div className="flex flex-wrap gap-2">
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add a student first.
                </p>
              ) : (
                students.map((student) => (
                  <ChipButton
                    key={student.id}
                    active={student.id === draft.studentId}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        studentId: student.id,
                        items: [],
                      }))
                    }
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: student.color ?? "#3B82F6" }}
                    />
                    {student.name}
                  </ChipButton>
                ))
              )}
            </div>
          </Field>

          <Field
            label="Subjects"
            hint={
              draft.items.length > 0
                ? `${draft.items.length} selected`
                : undefined
            }
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(activeStudent?.assignedSubjectIds ?? []).map((id) => {
                const s = getSubject(id)
                if (!s) return null
                const isActive = draft.items.some(
                  (it) => it.subjectId === id
                )
                return (
                  <ChipButton
                    key={id}
                    active={isActive}
                    onClick={() => toggleSubject(id)}
                    className="w-full justify-start"
                  >
                    <SubjectMark subject={s} size="sm" />
                    <span className="truncate">{s.name}</span>
                  </ChipButton>
                )
              })}
            </div>
          </Field>

          {draft.items.length > 0 ? (
            <Field label="Chapters">
              <div className="grid gap-2">
                {draft.items.map((it) => {
                  const s = getSubject(it.subjectId)
                  if (!s) return null
                  return (
                    <div
                      key={it.subjectId}
                      className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 p-2"
                    >
                      <SubjectMark subject={s} size="sm" />
                      <Select
                        value={String(it.chapterIndex)}
                        onValueChange={(v) =>
                          updateChapter(it.subjectId, Number(v))
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          className="h-9 w-auto flex-1 bg-card text-sm"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {s.chapters.map((ch, idx) => (
                            <SelectItem key={ch} value={String(idx)}>
                              {idx + 1}. {ch}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        type="button"
                        className="tactile grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                        onClick={() => toggleSubject(it.subjectId)}
                        aria-label={`Remove ${s.name}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </Field>
          ) : null}

          <Field label="Duration">
            <div className="grid grid-cols-6 gap-1.5">
              {DURATION_CHIPS.map((mins) => (
                <ChipButton
                  key={mins}
                  active={draft.durationMin === mins}
                  className="justify-center px-0"
                  onClick={() =>
                    setDraft((current) => ({ ...current, durationMin: mins }))
                  }
                >
                  {mins}m
                </ChipButton>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Date">
              <Input
                type="date"
                value={draft.date}
                onChange={(event) =>
                  setDraft((c) => ({ ...c, date: event.target.value }))
                }
              />
            </Field>
            <Field label="Tags">
              <Input
                value={draft.tags}
                onChange={(event) =>
                  setDraft((c) => ({ ...c, tags: event.target.value }))
                }
                placeholder="algebra, recap"
              />
            </Field>
          </div>

          <Field label="Note">
            <Textarea
              value={draft.note}
              onChange={(event) =>
                setDraft((c) => ({ ...c, note: event.target.value }))
              }
              placeholder="What was covered, weak points, parent updates..."
              className="min-h-28 resize-none"
            />
          </Field>

          <Field label="Homework">
            <Input
              value={draft.homework}
              onChange={(event) =>
                setDraft((c) => ({ ...c, homework: event.target.value }))
              }
              placeholder="Pages, exercises"
            />
          </Field>

          <label className="flex cursor-pointer select-none items-center gap-3 rounded-xl bg-muted/60 px-3 py-2.5 text-sm font-medium">
            <Checkbox
              checked={draft.markChapterDone}
              onCheckedChange={(checked) =>
                setDraft((c) => ({
                  ...c,
                  markChapterDone: Boolean(checked),
                }))
              }
            />
            <CheckCircle className="size-4 text-[color:var(--success)]" />
            Mark {draft.items.length > 1 ? "all chapters" : "chapter"} as done
            after saving
          </label>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button type="button" onClick={save} disabled={!canSave}>
            <ClipboardText data-icon="inline-start" />
            Save class
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
        {hint ? (
          <span className="text-[10.5px] font-medium uppercase tracking-wider text-primary">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function ChipButton({
  children,
  active,
  onClick,
  className,
}: {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "tactile inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-border/70 bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  )
}

export function QuickLogFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tactile fixed right-5 bottom-5 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground ring-1 ring-white/15 hover:bg-primary/90"
    >
      <Plus weight="bold" className="size-6" />
      <span className="sr-only">Log class</span>
    </button>
  )
}
