"use client"

import { useMemo, useState } from "react"
import { Plus } from "@phosphor-icons/react"

import { useTutoringStore } from "@/lib/store"
import type { Student } from "@/lib/tutoring-data"
import { StudentCard } from "@/components/students/student-card"
import { StudentDialog } from "@/components/students/student-dialog"
import { EmptyState, SectionHeader } from "@/components/ui-bits"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { MagnifyingGlass, UsersThree } from "@phosphor-icons/react"

export default function StudentsPage() {
  const students = useTutoringStore((s) => s.students)
  const notes = useTutoringStore((s) => s.notes)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return students
    return students.filter((student) =>
      [
        student.name,
        student.schedule ?? "",
        student.guardianPhone ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    )
  }, [students, query])

  function openNew() {
    setEditing(null)
    setOpen(true)
  }

  function openEdit(student: Student) {
    setEditing(student)
    setOpen(true)
  }

  return (
    <div className="grid gap-4">
      <SectionHeader
        title="Students"
        description={`${students.length} student${students.length === 1 ? "" : "s"} on your roster`}
        action={
          <Button type="button" onClick={openNew}>
            <Plus data-icon="inline-start" />
            Add student
          </Button>
        }
      />

      <div className="relative max-w-md">
        <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search students, phone, schedule"
          className="pl-9"
        />
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={<UsersThree weight="duotone" className="size-6" />}
          title="No students yet"
          description="Add your first student to start tracking classes."
          action={<Button onClick={openNew}>Add student</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Try a different search term."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              notes={notes}
              onEdit={() => openEdit(student)}
            />
          ))}
        </div>
      )}

      <StudentDialog
        open={open}
        onOpenChange={setOpen}
        student={editing}
      />
    </div>
  )
}
