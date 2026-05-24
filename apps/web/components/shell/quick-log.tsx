"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle, ClipboardText, Plus } from "@phosphor-icons/react"

import { useTutoringStore } from "@/lib/store"
import {
  getNextChapter,
  getSubject,
  getTags,
  todayIso,
} from "@/lib/derive"
import { SubjectMark } from "@/components/ui-bits"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
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
const DRAFT_KEY = "teach101:quick-log:draft"

type QuickLogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultStudentId?: string | null
}

type Draft = {
  studentId: string
  subjectId: string
  chapterIndex: number
  date: string
  durationMin: number
  note: string
  tags: string
  homework: string
  markChapterDone: boolean
}

function emptyDraft(studentId: string, subjectId: string): Draft {
  return {
    studentId,
    subjectId,
    chapterIndex: 0,
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
  const initialSubjectId = initialStudent?.assignedSubjectIds[0] ?? ""

  const [draft, setDraft] = useState<Draft>(() =>
    emptyDraft(initialStudent?.id ?? "", initialSubjectId)
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(DRAFT_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Draft
        setDraft((current) => ({ ...current, ...parsed, date: todayIso() }))
      }
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!draft.note && !draft.tags && !draft.homework) {
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
      return {
        ...current,
        studentId: initialStudent.id,
        subjectId: initialStudent.assignedSubjectIds[0] ?? "",
      }
    })
  }, [open, initialStudent])

  const activeStudent = useMemo(
    () => students.find((student) => student.id === draft.studentId) ?? null,
    [draft.studentId, students]
  )

  const subject = useMemo(
    () => (draft.subjectId ? getSubject(draft.subjectId) : null),
    [draft.subjectId]
  )

  const focusChapter = useMemo(() => {
    if (!activeStudent || !subject) return null
    return getNextChapter(activeStudent, subject.id)
  }, [activeStudent, subject])

  useEffect(() => {
    if (!focusChapter) return
    setDraft((current) =>
      current.chapterIndex === focusChapter.chapterIndex
        ? current
        : { ...current, chapterIndex: focusChapter.chapterIndex }
    )
  }, [focusChapter])

  function reset() {
    setDraft((current) => ({
      ...current,
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
    if (!activeStudent || !subject) return

    addSession({
      studentId: activeStudent.id,
      subjectId: subject.id,
      chapterIndex: draft.chapterIndex,
      note: draft.note.trim(),
      tags: getTags(draft.tags),
      homework: draft.homework.trim() || undefined,
      durationMin: draft.durationMin,
      date: draft.date || todayIso(),
    })

    if (draft.markChapterDone) {
      setChapterStatus(
        activeStudent.id,
        subject.id,
        draft.chapterIndex,
        "completed"
      )
    }

    toast.success("Class logged", {
      description: `${activeStudent.name} . ${subject.name} . ${draft.durationMin}m`,
    })
    reset()
    onOpenChange(false)
  }

  const canSave = Boolean(activeStudent && subject)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md app-scroll overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Log a class</SheetTitle>
          <SheetDescription>
            One-tap session entry. Hotkey N.
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Student
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {students.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add a student first.
                </p>
              ) : (
                students.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        studentId: student.id,
                        subjectId:
                          student.assignedSubjectIds.includes(
                            current.subjectId
                          )
                            ? current.subjectId
                            : student.assignedSubjectIds[0] ?? "",
                      }))
                    }
                    className={cn(
                      "tactile flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                      student.id === draft.studentId
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-muted/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: student.color ?? "#3B82F6" }}
                    />
                    {student.name}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Subject
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {(activeStudent?.assignedSubjectIds ?? []).map((id) => {
                const s = getSubject(id)
                if (!s) return null
                const isActive = id === draft.subjectId
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({ ...current, subjectId: id }))
                    }
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
          </div>

          {subject ? (
            <div className="grid gap-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Chapter
              </Label>
              <select
                value={draft.chapterIndex}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    chapterIndex: Number(event.target.value),
                  }))
                }
                className="tactile h-10 rounded-lg border border-border bg-card px-3 text-sm shadow-[0_1px_2px_rgb(15_23_42_/_0.04)] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                {subject.chapters.map((chapter, idx) => (
                  <option key={chapter} value={idx}>
                    {idx + 1}. {chapter}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="grid gap-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Duration
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_CHIPS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() =>
                    setDraft((current) => ({ ...current, durationMin: mins }))
                  }
                  className={cn(
                    "tactile h-8 rounded-full border px-3 text-xs font-semibold",
                    draft.durationMin === mins
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-muted/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
                Tags
              </Label>
              <Input
                value={draft.tags}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    tags: event.target.value,
                  }))
                }
                placeholder="algebra, recap"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Note
            </Label>
            <Textarea
              value={draft.note}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  note: event.target.value,
                }))
              }
              placeholder="What was covered, weak points, parent updates..."
              className="min-h-28 resize-none"
            />
          </div>

          <div className="grid gap-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Homework
            </Label>
            <Input
              value={draft.homework}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  homework: event.target.value,
                }))
              }
              placeholder="Pages, exercises"
            />
          </div>

          <label className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={draft.markChapterDone}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  markChapterDone: event.target.checked,
                }))
              }
              className="size-4 accent-primary"
            />
            <CheckCircle className="size-4 text-[color:var(--success)]" />
            Mark chapter as done after saving
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

export function QuickLogFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tactile fixed right-5 bottom-5 z-40 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_24px_60px_-12px_oklch(0.65_0.19_252/0.6),0_1px_0_oklch(1_0_0_/0.2)_inset] ring-1 ring-white/10 hover:brightness-110"
    >
      <Plus weight="bold" className="size-6" />
      <span className="sr-only">Log class</span>
    </button>
  )
}
