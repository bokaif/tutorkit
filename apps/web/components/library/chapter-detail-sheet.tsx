"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowSquareOut,
  ClipboardText,
  Link as LinkIcon,
  Note,
  Paperclip,
  Plus,
  Trash,
} from "@phosphor-icons/react"

import { formatDate, getSessionItems } from "@/lib/derive"
import { useTutoringStore } from "@/lib/store"
import type {
  Material,
  MaterialKind,
  SessionNote,
  Student,
  Subject,
} from "@/lib/tutoring-data"
import { Pill, StudentAvatar, SubjectMark } from "@/components/ui-bits"
import { Button } from "@workspace/ui/components/button"
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
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"

const KIND_ICON: Record<MaterialKind, typeof LinkIcon> = {
  link: LinkIcon,
  note: Note,
  file: Paperclip,
}

const KIND_LABEL: Record<MaterialKind, string> = {
  link: "Link",
  note: "Note",
  file: "File",
}

/**
 * Frozen empty array reused across renders so the materials selector below
 * returns a referentially stable value when a chapter has no materials yet.
 * Without this, Zustand's snapshot equality check fails and React loops.
 */
const EMPTY_MATERIALS: readonly Material[] = Object.freeze([])

/**
 * Right-side drawer that owns everything about a single chapter:
 *  - Materials CRUD (links, notes, file URLs)
 *  - Optional student-scoped session timeline + per-student progress controls
 *
 * Pass `student` to scope the timeline to one tutor-student relationship; omit
 * it to render the global Library view (materials only, useful when you're
 * curating a syllabus before assigning it).
 */
export function ChapterDetailSheet({
  open,
  onOpenChange,
  subject,
  chapterIndex,
  student,
  studentsForGlobalView,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: Subject | null
  chapterIndex: number | null
  student?: Student | null
  studentsForGlobalView?: Student[]
}) {
  const chapterTitle =
    subject && chapterIndex != null ? subject.chapters[chapterIndex] : null

  // Stable empty reference so the Zustand selector doesn't fail the
  // "result of getSnapshot should be cached" check by returning a fresh []
  // on every render when this chapter has no materials yet.
  const materials =
    useTutoringStore((s) => {
      if (!subject || chapterIndex == null) return EMPTY_MATERIALS
      return s.chapterMaterials[subject.id]?.[chapterIndex] ?? EMPTY_MATERIALS
    }) as Material[]
  const notes = useTutoringStore((s) => s.notes)

  const relevantSessions = useMemo(() => {
    if (!subject || chapterIndex == null) return [] as SessionNote[]
    return notes.filter((note) => {
      if (student && note.studentId !== student.id) return false
      return getSessionItems(note).some(
        (item) =>
          item.subjectId === subject.id && item.chapterIndex === chapterIndex
      )
    })
  }, [notes, subject, chapterIndex, student])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl"
      >
        <SheetHeader>
          {subject && chapterTitle ? (
            <>
              <div className="flex items-center gap-2.5">
                <SubjectMark subject={subject} size="sm" />
                <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {subject.name} · Chapter {(chapterIndex ?? 0) + 1}
                </p>
              </div>
              <SheetTitle className="font-heading">{chapterTitle}</SheetTitle>
              <SheetDescription>
                Materials, resources, and what you've covered with{" "}
                {student ? student.name : "your students"} for this chapter.
              </SheetDescription>
            </>
          ) : (
            <SheetTitle>Chapter</SheetTitle>
          )}
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-5">
          {subject && chapterIndex != null ? (
            <>
              <MaterialsSection
                materials={materials}
                subjectId={subject.id}
                chapterIndex={chapterIndex}
              />
              <SessionsSection
                sessions={relevantSessions}
                student={student ?? null}
                studentsForGlobalView={studentsForGlobalView ?? []}
              />
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MaterialsSection({
  materials,
  subjectId,
  chapterIndex,
}: {
  materials: Material[]
  subjectId: string
  chapterIndex: number
}) {
  const addMaterial = useTutoringStore((s) => s.addMaterial)
  const deleteMaterial = useTutoringStore((s) => s.deleteMaterial)
  const [showForm, setShowForm] = useState(false)

  return (
    <section className="space-y-3">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Materials
          </p>
          <h3 className="font-heading text-base font-semibold">
            {materials.length === 0
              ? "Nothing yet"
              : `${materials.length} item${materials.length === 1 ? "" : "s"}`}
          </h3>
        </div>
        <Button
          type="button"
          size="sm"
          variant={showForm ? "outline" : "default"}
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus data-icon="inline-start" />
          {showForm ? "Cancel" : "Add"}
        </Button>
      </header>

      {showForm ? (
        <AddMaterialForm
          onSubmit={(draft) => {
            addMaterial(subjectId, chapterIndex, draft)
            setShowForm(false)
          }}
        />
      ) : null}

      {materials.length === 0 && !showForm ? (
        <p className="rounded-xl bg-secondary/55 px-4 py-5 text-center text-sm text-muted-foreground">
          Add a textbook chapter PDF, a YouTube link, or a quick note to
          remember a key formula.
        </p>
      ) : null}

      <div className="grid gap-2">
        {materials.map((material) => (
          <MaterialRow
            key={material.id}
            material={material}
            onDelete={() =>
              deleteMaterial(subjectId, chapterIndex, material.id)
            }
          />
        ))}
      </div>
    </section>
  )
}

function AddMaterialForm({
  onSubmit,
}: {
  onSubmit: (draft: {
    kind: MaterialKind
    title: string
    url?: string
    body?: string
  }) => void
}) {
  const [kind, setKind] = useState<MaterialKind>("link")
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [body, setBody] = useState("")

  const canSubmit =
    title.trim().length > 0 && (kind === "note" ? body.trim().length > 0 : url.trim().length > 0)

  function reset() {
    setTitle("")
    setUrl("")
    setBody("")
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (!canSubmit) return
        onSubmit({ kind, title, url: kind === "note" ? undefined : url, body })
        reset()
      }}
      className="grid gap-2.5 rounded-xl bg-secondary/55 p-3 ring-1 ring-border"
    >
      <div className="grid gap-2.5 sm:grid-cols-[140px_1fr]">
        <div className="grid gap-1">
          <Label className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Type
          </Label>
          <Select
            value={kind}
            onValueChange={(value) => setKind(value as MaterialKind)}
          >
            <SelectTrigger className="h-9 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="link">Link</SelectItem>
              <SelectItem value="file">File / PDF</SelectItem>
              <SelectItem value="note">Note</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <Label className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Title
          </Label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={
              kind === "note"
                ? "Pythagoras key idea"
                : kind === "file"
                  ? "Chapter 3 PDF"
                  : "Khan Academy intro"
            }
            className="h-9 bg-background"
          />
        </div>
      </div>

      {kind === "note" ? (
        <div className="grid gap-1">
          <Label className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Body
          </Label>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Anything you want to remember next time you teach this."
            className="min-h-[88px] bg-background"
          />
        </div>
      ) : (
        <div className="grid gap-1">
          <Label className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            URL
          </Label>
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
            className="h-9 bg-background"
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="submit" size="sm" disabled={!canSubmit}>
          Save material
        </Button>
      </div>
    </form>
  )
}

function MaterialRow({
  material,
  onDelete,
}: {
  material: Material
  onDelete: () => void
}) {
  const Icon = KIND_ICON[material.kind]
  const isLink = material.kind !== "note" && Boolean(material.url)

  return (
    <div className="group flex items-start gap-3 rounded-xl bg-secondary/60 p-3 ring-1 ring-border/60 transition-colors hover:bg-secondary hover:ring-border">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
        <Icon weight="duotone" className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {isLink ? (
            <a
              href={material.url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm font-semibold hover:underline"
            >
              {material.title}
            </a>
          ) : (
            <p className="truncate text-sm font-semibold">{material.title}</p>
          )}
          <Pill tone="muted">{KIND_LABEL[material.kind]}</Pill>
        </div>
        {material.kind === "note" && material.body ? (
          <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
            {material.body}
          </p>
        ) : null}
        {isLink ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {material.url}
          </p>
        ) : null}
      </div>
      {isLink ? (
        <Button asChild size="icon-xs" variant="ghost">
          <a href={material.url} target="_blank" rel="noreferrer">
            <ArrowSquareOut />
          </a>
        </Button>
      ) : null}
      <Button
        type="button"
        size="icon-xs"
        variant="ghost"
        onClick={onDelete}
        aria-label="Delete material"
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Trash />
      </Button>
    </div>
  )
}

function SessionsSection({
  sessions,
  student,
  studentsForGlobalView,
}: {
  sessions: SessionNote[]
  student: Student | null
  studentsForGlobalView: Student[]
}) {
  const studentById = useMemo(
    () => new Map(studentsForGlobalView.map((s) => [s.id, s] as const)),
    [studentsForGlobalView]
  )

  return (
    <section className="space-y-3 pb-6">
      <header>
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          {student ? "Sessions with " + student.name : "Sessions taught"}
        </p>
        <h3 className="font-heading text-base font-semibold">
          {sessions.length === 0
            ? "Not taught yet"
            : `${sessions.length} class${sessions.length === 1 ? "" : "es"}`}
        </h3>
      </header>

      {sessions.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl bg-secondary/55 p-4 text-sm text-muted-foreground">
          <ClipboardText weight="duotone" className="size-5 text-primary" />
          <span>
            Log a class with this chapter and it shows up here automatically.
          </span>
        </div>
      ) : null}

      <ol className="relative grid gap-2 border-l border-border/80 pl-4">
        {sessions.map((session) => {
          const noteStudent = student ?? studentById.get(session.studentId)
          return (
            <li
              key={session.id}
              className={cn(
                "relative rounded-xl bg-secondary/55 p-3 ring-1 ring-border/60",
                "before:absolute before:-left-[18px] before:top-4 before:size-2 before:rounded-full before:bg-primary"
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {formatDate(session.date)}
                </p>
                {session.durationMin ? (
                  <Pill tone="muted">{session.durationMin}m</Pill>
                ) : null}
                {noteStudent ? (
                  <Link
                    href={`/student?id=${noteStudent.id}`}
                    className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                  >
                    <StudentAvatar student={noteStudent} size="sm" />
                    {noteStudent.name}
                  </Link>
                ) : null}
              </div>
              {session.note ? (
                <p className="mt-1.5 whitespace-pre-line text-sm text-foreground/90">
                  {session.note}
                </p>
              ) : null}
              {session.homework ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">
                    Homework
                  </span>
                  <span className="mx-1.5">·</span>
                  {session.homework}
                </p>
              ) : null}
              {session.tags && session.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {session.tags.map((tag) => (
                    <Pill key={tag} tone="muted">
                      #{tag}
                    </Pill>
                  ))}
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
