"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowSquareOut,
  Books,
  CaretDown,
  CaretRight,
  ChalkboardTeacher,
  PencilSimple,
  Plus,
  Trash,
  Warning,
} from "@phosphor-icons/react"

import { useTutoringStore } from "@/lib/store"
import { resolveSafeHref } from "@/lib/safe-url"
import { studentPalette, type Subject } from "@/lib/tutoring-data"
import { usePdfAvailability } from "@/hooks/use-pdf-availability"
import { ChapterDetailSheet } from "@/components/library/chapter-detail-sheet"
import {
  EmptyState,
  Panel,
  Pill,
  SectionHeader,
  SubjectMark,
} from "@/components/ui-bits"
import { Button } from "@workspace/ui/components/button"
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

export default function LibraryPage() {
  const subjects = useTutoringStore((s) => s.subjects)
  const students = useTutoringStore((s) => s.students)
  const chapterMaterials = useTutoringStore((s) => s.chapterMaterials)
  const availability = usePdfAvailability(subjects)

  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [creatingSubject, setCreatingSubject] = useState(false)
  const [openSubjectIds, setOpenSubjectIds] = useState<Set<string>>(
    new Set(subjects.slice(0, 1).map((s) => s.id))
  )
  const [activeChapter, setActiveChapter] = useState<{
    subject: Subject
    chapterIndex: number
  } | null>(null)

  function toggleSubject(id: string) {
    setOpenSubjectIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="grid gap-4" data-tour="library-root">
      <SectionHeader
        title="Library"
        description="Subjects, chapters, and the materials you've collected for each."
        action={
          <Button onClick={() => setCreatingSubject(true)} size="sm">
            <Plus data-icon="inline-start" />
            New subject
          </Button>
        }
      />

      {subjects.length === 0 ? (
        <EmptyState
          icon={<Books weight="duotone" className="size-6" />}
          title="No subjects yet"
          description="Add a subject to start building your syllabus, chapters, and chapter-level resources."
          action={
            <Button onClick={() => setCreatingSubject(true)}>
              <Plus data-icon="inline-start" />
              Add subject
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {subjects.map((subject) => {
            const present = availability[subject.id]
            const assigned = students.filter((student) =>
              student.assignedSubjectIds.includes(subject.id)
            )
            const isOpen = openSubjectIds.has(subject.id)
            const materialsBySubject = chapterMaterials[subject.id] ?? {}

            return (
              <Panel key={subject.id} className="overflow-hidden p-0">
                <button
                  type="button"
                  onClick={() => toggleSubject(subject.id)}
                  className="tactile flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-secondary/40"
                  aria-expanded={isOpen}
                >
                  <SubjectMark subject={subject} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-heading text-base font-semibold">
                        {subject.name}
                      </h3>
                      <Pill tone="muted">{subject.chapters.length} ch</Pill>
                      {subject.bookFile ? (
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
                            ? "Book ready"
                            : present === false
                              ? "Book missing"
                              : "Checking"}
                        </Pill>
                      ) : null}
                    </div>
                    {assigned.length > 0 ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        Used by{" "}
                        {assigned.map((s) => s.name).join(", ")}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Not assigned to any student yet.
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-lg bg-secondary text-muted-foreground transition-transform",
                      isOpen && "rotate-0"
                    )}
                  >
                    {isOpen ? (
                      <CaretDown weight="bold" className="size-4" />
                    ) : (
                      <CaretRight weight="bold" className="size-4" />
                    )}
                  </span>
                </button>

                {isOpen ? (
                  <div className="border-t border-border bg-background/40 p-4">
                    <SubjectBody
                      subject={subject}
                      onEdit={() => setEditingSubject(subject)}
                      onOpenChapter={(chapterIndex) =>
                        setActiveChapter({ subject, chapterIndex })
                      }
                      materialCounts={Object.fromEntries(
                        Object.entries(materialsBySubject).map(
                          ([k, v]) => [k, v.length]
                        )
                      )}
                    />
                  </div>
                ) : null}
              </Panel>
            )
          })}
        </div>
      )}

      <SubjectFormDialog
        open={creatingSubject || Boolean(editingSubject)}
        onOpenChange={(next) => {
          if (!next) {
            setCreatingSubject(false)
            setEditingSubject(null)
          }
        }}
        subject={editingSubject}
      />

      <ChapterDetailSheet
        open={Boolean(activeChapter)}
        onOpenChange={(next) => {
          if (!next) setActiveChapter(null)
        }}
        subject={activeChapter?.subject ?? null}
        chapterIndex={activeChapter?.chapterIndex ?? null}
        studentsForGlobalView={students}
      />
    </div>
  )
}

function SubjectBody({
  subject,
  onEdit,
  onOpenChapter,
  materialCounts,
}: {
  subject: Subject
  onEdit: () => void
  onOpenChapter: (chapterIndex: number) => void
  materialCounts: Record<string, number>
}) {
  const addChapter = useTutoringStore((s) => s.addChapter)
  const updateChapter = useTutoringStore((s) => s.updateChapter)
  const removeChapter = useTutoringStore((s) => s.removeChapter)
  const deleteSubject = useTutoringStore((s) => s.deleteSubject)
  const [newChapter, setNewChapter] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [draftTitle, setDraftTitle] = useState("")

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {resolveSafeHref(subject.bookFile) ? (
          <Button asChild variant="outline" size="sm">
            <a
              href={resolveSafeHref(subject.bookFile)!}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ArrowSquareOut data-icon="inline-start" />
              Open book
            </a>
          </Button>
        ) : null}
        <Button variant="outline" size="sm" onClick={onEdit}>
          <PencilSimple data-icon="inline-start" />
          Edit subject
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (
              window.confirm(
                `Delete ${subject.name}? Chapters, materials, and any progress for this subject go too.`
              )
            ) {
              deleteSubject(subject.id)
            }
          }}
        >
          <Trash data-icon="inline-start" />
          Delete subject
        </Button>
      </div>

      <div className="grid gap-1.5">
        {subject.chapters.length === 0 ? (
          <p className="rounded-lg bg-secondary/55 px-3 py-2.5 text-sm text-muted-foreground">
            No chapters yet — add the first one below.
          </p>
        ) : (
          subject.chapters.map((title, index) => {
            const isEditing = editingIndex === index
            const materialCount = materialCounts[index] ?? 0
            return (
              <div
                key={`${title}-${index}`}
                className="group flex items-center gap-2 rounded-lg bg-secondary/55 px-2.5 py-2 ring-1 ring-border/60 transition-colors hover:bg-secondary hover:ring-border"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-card text-xs font-semibold text-muted-foreground ring-1 ring-border">
                  {index + 1}
                </span>
                {isEditing ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      updateChapter(subject.id, index, draftTitle)
                      setEditingIndex(null)
                    }}
                    className="flex flex-1 items-center gap-2"
                  >
                    <Input
                      autoFocus
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                      className="h-8 bg-background text-sm"
                    />
                    <Button type="submit" size="xs">
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="xs"
                      variant="ghost"
                      onClick={() => setEditingIndex(null)}
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenChapter(index)}
                      className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:text-primary"
                    >
                      {title}
                    </button>
                    {materialCount > 0 ? (
                      <Pill tone="primary">
                        {materialCount}{" "}
                        {materialCount === 1 ? "item" : "items"}
                      </Pill>
                    ) : null}
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => {
                        setEditingIndex(index)
                        setDraftTitle(title)
                      }}
                      aria-label="Rename chapter"
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <PencilSimple />
                    </Button>
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete chapter "${title}"? Materials and progress for this chapter go too.`
                          )
                        ) {
                          removeChapter(subject.id, index)
                        }
                      }}
                      aria-label="Delete chapter"
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash />
                    </Button>
                  </>
                )}
              </div>
            )
          })
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!newChapter.trim()) return
          addChapter(subject.id, newChapter)
          setNewChapter("")
        }}
        className="flex items-center gap-2 rounded-xl bg-secondary/55 p-2 ring-1 ring-border/60"
      >
        <Input
          value={newChapter}
          onChange={(event) => setNewChapter(event.target.value)}
          placeholder="Add a chapter title"
          className="h-9 bg-background"
        />
        <Button type="submit" size="sm" disabled={!newChapter.trim()}>
          <Plus data-icon="inline-start" />
          Add chapter
        </Button>
      </form>
    </div>
  )
}

type SubjectFormState = {
  name: string
  code: string
  bookFile: string
  color: string
}

function emptySubjectForm(): SubjectFormState {
  return {
    name: "",
    code: "",
    bookFile: "",
    color: studentPalette[0] ?? "#3B82F6",
  }
}

function SubjectFormDialog({
  open,
  onOpenChange,
  subject,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject?: Subject | null
}) {
  const addSubject = useTutoringStore((s) => s.addSubject)
  const updateSubject = useTutoringStore((s) => s.updateSubject)
  const [form, setForm] = useState<SubjectFormState>(emptySubjectForm)

  const isEditing = Boolean(subject)

  useEffect(() => {
    if (!open) return
    if (subject) {
      setForm({
        name: subject.name,
        code: subject.code,
        bookFile: subject.bookFile,
        color: subject.color ?? studentPalette[0] ?? "#3B82F6",
      })
    } else {
      setForm(emptySubjectForm())
    }
  }, [open, subject])

  function handleSubmit() {
    if (!form.name.trim()) return
    if (subject) {
      updateSubject(subject.id, {
        name: form.name,
        code: form.code || undefined,
        bookFile: form.bookFile,
        color: form.color,
      })
    } else {
      addSubject({
        name: form.name,
        code: form.code,
        bookFile: form.bookFile,
        color: form.color,
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {isEditing ? "Edit subject" : "New subject"}
          </DialogTitle>
          <DialogDescription>
            Subjects organize chapters and the resources you collect along the
            way.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="subject-name">Name</Label>
            <Input
              id="subject-name"
              autoFocus
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="e.g. Physics, English Grammar"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
            <div className="grid gap-1.5">
              <Label htmlFor="subject-code">Code</Label>
              <Input
                id="subject-code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value.toUpperCase().slice(0, 3),
                  }))
                }
                placeholder="P, CH, ENG"
                maxLength={3}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="subject-book">Book URL (optional)</Label>
              <Input
                id="subject-book"
                value={form.bookFile}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bookFile: event.target.value,
                  }))
                }
                placeholder="https://... or /books/foo.pdf"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-1.5">
              {studentPalette.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({ ...current, color }))
                  }
                  className={cn(
                    "size-7 rounded-full ring-2 ring-transparent transition-transform hover:scale-110",
                    form.color === color && "ring-foreground"
                  )}
                  style={{ background: color }}
                  aria-label={`Pick color ${color}`}
                />
              ))}
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!form.name.trim()}>
            <ChalkboardTeacher data-icon="inline-start" />
            {isEditing ? "Save changes" : "Create subject"}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  )
}
