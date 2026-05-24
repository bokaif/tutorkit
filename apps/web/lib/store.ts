"use client"

import { useEffect } from "react"
import { create } from "zustand"

import { newId, setSubjectRegistry } from "@/lib/derive"
import { resolveSafeHref } from "@/lib/safe-url"
import type {
  ChapterMaterials,
  Material,
  MaterialKind,
  Payment,
  ProgressStatus,
  ScheduleSlot,
  SessionNote,
  Student,
  Subject,
} from "@/lib/tutoring-data"
import {
  bootstrapIfEmpty,
  clearAll as clearStorage,
  resetToDemo as resetStorage,
  saveChapterMaterials,
  savePayments,
  saveSessionNotes,
  saveStudents,
  saveSubjects,
} from "@/lib/tutoring-storage"

type StudentDraft = Omit<
  Student,
  "id" | "chapterProgress" | "createdAt" | "updatedAt"
>

type StudentUpdate = Partial<Omit<Student, "id" | "createdAt">>

type SubjectDraft = {
  name: string
  code?: string
  color?: string
  bookFile?: string
  chapters?: string[]
}

type SubjectUpdate = Partial<
  Pick<Subject, "name" | "code" | "color" | "bookFile">
>

type MaterialDraft = {
  kind?: MaterialKind
  title: string
  url?: string
  body?: string
}

type TutoringState = {
  hydrated: boolean
  students: Student[]
  notes: SessionNote[]
  payments: Payment[]
  subjects: Subject[]
  chapterMaterials: ChapterMaterials
  hydrate: () => void
  /**
   * Replace all state from an external source (e.g. Firestore snapshot).
   * Persists to localStorage but is meant to be paired with a syncer that
   * suppresses the resulting echo write back to the source of truth.
   */
  replaceAll: (next: {
    students: Student[]
    notes: SessionNote[]
    payments: Payment[]
    subjects?: Subject[]
    chapterMaterials?: ChapterMaterials
  }) => void
  resetDemo: () => void
  wipe: () => void
  addStudent: (draft: StudentDraft) => Student
  updateStudent: (id: string, patch: StudentUpdate) => void
  deleteStudent: (id: string) => void
  setChapterStatus: (
    studentId: string,
    subjectId: string,
    chapterIndex: number,
    status: ProgressStatus
  ) => void
  setScheduleSlots: (studentId: string, slots: ScheduleSlot[]) => void
  markPaidThroughNow: (studentId: string) => void
  addSession: (
    note: Omit<SessionNote, "id" | "createdAt">
  ) => SessionNote
  updateSession: (
    id: string,
    patch: Partial<Omit<SessionNote, "id" | "createdAt">>
  ) => void
  deleteSession: (id: string) => void
  addPayment: (
    payment: Omit<Payment, "id" | "createdAt">
  ) => Payment
  deletePayment: (id: string) => void

  // Subject & chapter management ------------------------------------------------
  addSubject: (draft: SubjectDraft) => Subject
  updateSubject: (id: string, patch: SubjectUpdate) => void
  deleteSubject: (id: string) => void
  addChapter: (subjectId: string, title: string) => void
  updateChapter: (subjectId: string, index: number, title: string) => void
  removeChapter: (subjectId: string, index: number) => void

  // Per-chapter materials -------------------------------------------------------
  addMaterial: (
    subjectId: string,
    chapterIndex: number,
    draft: MaterialDraft
  ) => Material
  updateMaterial: (
    subjectId: string,
    chapterIndex: number,
    materialId: string,
    patch: Partial<Omit<Material, "id" | "createdAt">>
  ) => void
  deleteMaterial: (
    subjectId: string,
    chapterIndex: number,
    materialId: string
  ) => void
}

const persistStudents = (students: Student[]) => {
  saveStudents(students)
}

const persistNotes = (notes: SessionNote[]) => {
  saveSessionNotes(notes)
}

const persistPayments = (payments: Payment[]) => {
  savePayments(payments)
}

const persistSubjects = (subjects: Subject[]) => {
  saveSubjects(subjects)
  setSubjectRegistry(subjects)
}

const persistMaterials = (materials: ChapterMaterials) => {
  saveChapterMaterials(materials)
}

const stamp = () => new Date().toISOString()

function generateSubjectCode(name: string, existing: Subject[]): string {
  const upper = name
    .split(/\s+/)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3)
  const base = (upper || name.slice(0, 2).toUpperCase() || "S").slice(0, 3)
  const taken = new Set(existing.map((s) => s.code))
  if (!taken.has(base)) return base
  for (let i = 2; i < 99; i++) {
    const candidate = `${base[0] ?? "S"}${i}`
    if (!taken.has(candidate)) return candidate
  }
  return base
}

export const useTutoringStore = create<TutoringState>((set, get) => ({
  hydrated: false,
  students: [],
  notes: [],
  payments: [],
  subjects: [],
  chapterMaterials: {},

  hydrate: () => {
    if (get().hydrated) return
    const { students, notes, payments, subjects, chapterMaterials } =
      bootstrapIfEmpty()
    setSubjectRegistry(subjects)
    set({
      students,
      notes,
      payments,
      subjects,
      chapterMaterials,
      hydrated: true,
    })
  },

  replaceAll: ({
    students,
    notes,
    payments,
    subjects,
    chapterMaterials,
  }) => {
    persistStudents(students)
    persistNotes(notes)
    persistPayments(payments)
    if (subjects) persistSubjects(subjects)
    if (chapterMaterials) persistMaterials(chapterMaterials)
    set({
      students,
      notes,
      payments,
      ...(subjects ? { subjects } : {}),
      ...(chapterMaterials ? { chapterMaterials } : {}),
      hydrated: true,
    })
  },

  resetDemo: () => {
    resetStorage()
    const { students, notes, payments, subjects, chapterMaterials } =
      bootstrapIfEmpty()
    setSubjectRegistry(subjects)
    set({
      students,
      notes,
      payments,
      subjects,
      chapterMaterials,
      hydrated: true,
    })
  },

  wipe: () => {
    clearStorage()
    setSubjectRegistry([])
    set({
      students: [],
      notes: [],
      payments: [],
      subjects: [],
      chapterMaterials: {},
      hydrated: true,
    })
  },

  addStudent: (draft) => {
    const stamp = new Date().toISOString()
    const student: Student = {
      ...draft,
      id: newId(),
      chapterProgress: {},
      createdAt: stamp,
      updatedAt: stamp,
    }
    const next = [student, ...get().students]
    persistStudents(next)
    set({ students: next })
    return student
  },

  updateStudent: (id, patch) => {
    const next = get().students.map((student) =>
      student.id === id
        ? {
            ...student,
            ...patch,
            updatedAt: new Date().toISOString(),
          }
        : student
    )
    persistStudents(next)
    set({ students: next })
  },

  deleteStudent: (id) => {
    const nextStudents = get().students.filter((s) => s.id !== id)
    const nextNotes = get().notes.filter((n) => n.studentId !== id)
    const nextPayments = get().payments.filter((p) => p.studentId !== id)
    persistStudents(nextStudents)
    persistNotes(nextNotes)
    persistPayments(nextPayments)
    set({
      students: nextStudents,
      notes: nextNotes,
      payments: nextPayments,
    })
  },

  setChapterStatus: (studentId, subjectId, chapterIndex, status) => {
    const next = get().students.map((student) => {
      if (student.id !== studentId) return student
      return {
        ...student,
        chapterProgress: {
          ...student.chapterProgress,
          [subjectId]: {
            ...(student.chapterProgress[subjectId] ?? {}),
            [chapterIndex]: status,
          },
        },
        updatedAt: new Date().toISOString(),
      }
    })
    persistStudents(next)
    set({ students: next })
  },

  setScheduleSlots: (studentId, slots) => {
    const next = get().students.map((student) =>
      student.id === studentId
        ? {
            ...student,
            scheduleSlots: slots,
            updatedAt: new Date().toISOString(),
          }
        : student
    )
    persistStudents(next)
    set({ students: next })
  },

  markPaidThroughNow: (studentId) => {
    const totalClasses = get().notes.filter(
      (note) => note.studentId === studentId
    ).length
    const next = get().students.map((student) =>
      student.id === studentId
        ? {
            ...student,
            paidThroughClassCount: totalClasses,
            updatedAt: new Date().toISOString(),
          }
        : student
    )
    persistStudents(next)
    set({ students: next })
  },

  addSession: (note) => {
    const session: SessionNote = {
      ...note,
      id: newId(),
      createdAt: new Date().toISOString(),
    }
    const next = [session, ...get().notes]
    persistNotes(next)
    set({ notes: next })
    return session
  },

  updateSession: (id, patch) => {
    const next = get().notes.map((note) =>
      note.id === id ? { ...note, ...patch } : note
    )
    persistNotes(next)
    set({ notes: next })
  },

  deleteSession: (id) => {
    const next = get().notes.filter((note) => note.id !== id)
    persistNotes(next)
    set({ notes: next })
  },

  addPayment: (payment) => {
    const entry: Payment = {
      ...payment,
      id: newId(),
      createdAt: new Date().toISOString(),
    }
    const next = [entry, ...get().payments]
    persistPayments(next)
    set({ payments: next })
    return entry
  },

  deletePayment: (id) => {
    const next = get().payments.filter((p) => p.id !== id)
    persistPayments(next)
    set({ payments: next })
  },

  addSubject: (draft) => {
    const now = stamp()
    const existing = get().subjects
    const id = newId()
    const subject: Subject = {
      id,
      name: draft.name.trim() || "Untitled subject",
      code: (draft.code?.trim() || generateSubjectCode(draft.name, existing))
        .slice(0, 3)
        .toUpperCase(),
      color: draft.color,
      bookFile: resolveSafeHref(draft.bookFile) ?? "",
      chapters: (draft.chapters ?? []).map((c) => c.trim()).filter(Boolean),
      createdAt: now,
      updatedAt: now,
    }
    const next = [...existing, subject]
    persistSubjects(next)
    set({ subjects: next })
    return subject
  },

  updateSubject: (id, patch) => {
    const safeBook =
      patch.bookFile !== undefined
        ? (resolveSafeHref(patch.bookFile) ?? "")
        : undefined
    const next = get().subjects.map((subject) =>
      subject.id === id
        ? {
            ...subject,
            ...patch,
            ...(safeBook !== undefined ? { bookFile: safeBook } : {}),
            ...(patch.code ? { code: patch.code.slice(0, 3).toUpperCase() } : {}),
            updatedAt: stamp(),
          }
        : subject
    )
    persistSubjects(next)
    set({ subjects: next })
  },

  deleteSubject: (id) => {
    const nextSubjects = get().subjects.filter((subject) => subject.id !== id)
    persistSubjects(nextSubjects)

    const { [id]: _droppedMaterials, ...remainingMaterials } =
      get().chapterMaterials
    persistMaterials(remainingMaterials)

    const nextStudents = get().students.map((student) => {
      const assigned = student.assignedSubjectIds.filter((sid) => sid !== id)
      const { [id]: _droppedProgress, ...progress } = student.chapterProgress
      if (
        assigned.length === student.assignedSubjectIds.length &&
        Object.keys(student.chapterProgress).length ===
          Object.keys(progress).length
      ) {
        return student
      }
      return {
        ...student,
        assignedSubjectIds: assigned,
        chapterProgress: progress,
        updatedAt: stamp(),
      }
    })
    persistStudents(nextStudents)

    set({
      subjects: nextSubjects,
      chapterMaterials: remainingMaterials,
      students: nextStudents,
    })
  },

  addChapter: (subjectId, title) => {
    const trimmed = title.trim()
    if (!trimmed) return
    const next = get().subjects.map((subject) =>
      subject.id === subjectId
        ? {
            ...subject,
            chapters: [...subject.chapters, trimmed],
            updatedAt: stamp(),
          }
        : subject
    )
    persistSubjects(next)
    set({ subjects: next })
  },

  updateChapter: (subjectId, index, title) => {
    const trimmed = title.trim()
    if (!trimmed) return
    const next = get().subjects.map((subject) => {
      if (subject.id !== subjectId) return subject
      const chapters = [...subject.chapters]
      chapters[index] = trimmed
      return { ...subject, chapters, updatedAt: stamp() }
    })
    persistSubjects(next)
    set({ subjects: next })
  },

  removeChapter: (subjectId, index) => {
    const nextSubjects = get().subjects.map((subject) => {
      if (subject.id !== subjectId) return subject
      const chapters = subject.chapters.filter((_, idx) => idx !== index)
      return { ...subject, chapters, updatedAt: stamp() }
    })
    persistSubjects(nextSubjects)

    const materials = get().chapterMaterials
    const subjectMaterials = materials[subjectId]
    let nextMaterials = materials
    if (subjectMaterials) {
      const shifted: Record<number, Material[]> = {}
      for (const [idxStr, list] of Object.entries(subjectMaterials)) {
        const idx = Number(idxStr)
        if (idx === index) continue
        const target = idx > index ? idx - 1 : idx
        shifted[target] = list
      }
      nextMaterials = { ...materials, [subjectId]: shifted }
      persistMaterials(nextMaterials)
    }

    const nextStudents = get().students.map((student) => {
      const progress = student.chapterProgress[subjectId]
      if (!progress) return student
      const shifted: Record<number, ProgressStatus> = {}
      for (const [idxStr, status] of Object.entries(progress)) {
        const idx = Number(idxStr)
        if (idx === index) continue
        const target = idx > index ? idx - 1 : idx
        shifted[target] = status
      }
      return {
        ...student,
        chapterProgress: {
          ...student.chapterProgress,
          [subjectId]: shifted,
        },
        updatedAt: stamp(),
      }
    })
    persistStudents(nextStudents)

    set({
      subjects: nextSubjects,
      chapterMaterials: nextMaterials,
      students: nextStudents,
    })
  },

  addMaterial: (subjectId, chapterIndex, draft) => {
    const material: Material = {
      id: newId(),
      kind: draft.kind ?? "link",
      title: draft.title.trim() || "Untitled",
      url: draft.url?.trim() || undefined,
      body: draft.body?.trim() || undefined,
      createdAt: stamp(),
    }
    const subjectMap = get().chapterMaterials[subjectId] ?? {}
    const list = subjectMap[chapterIndex] ?? []
    const nextSubjectMap = { ...subjectMap, [chapterIndex]: [material, ...list] }
    const next = { ...get().chapterMaterials, [subjectId]: nextSubjectMap }
    persistMaterials(next)
    set({ chapterMaterials: next })
    return material
  },

  updateMaterial: (subjectId, chapterIndex, materialId, patch) => {
    const subjectMap = get().chapterMaterials[subjectId]
    if (!subjectMap) return
    const list = subjectMap[chapterIndex]
    if (!list) return
    const nextList = list.map((m) => {
      if (m.id !== materialId) return m
      const nextPatch = { ...patch }
      if (nextPatch.url !== undefined) {
        nextPatch.url = resolveSafeHref(nextPatch.url) ?? undefined
      }
      if (nextPatch.title !== undefined) {
        nextPatch.title = nextPatch.title.trim().slice(0, 240) || m.title
      }
      if (nextPatch.body !== undefined) {
        nextPatch.body = nextPatch.body.trim().slice(0, 8_000) || undefined
      }
      return { ...m, ...nextPatch }
    })
    const nextSubjectMap = { ...subjectMap, [chapterIndex]: nextList }
    const next = { ...get().chapterMaterials, [subjectId]: nextSubjectMap }
    persistMaterials(next)
    set({ chapterMaterials: next })
  },

  deleteMaterial: (subjectId, chapterIndex, materialId) => {
    const subjectMap = get().chapterMaterials[subjectId]
    if (!subjectMap) return
    const list = subjectMap[chapterIndex]
    if (!list) return
    const nextList = list.filter((m) => m.id !== materialId)
    const nextSubjectMap = { ...subjectMap, [chapterIndex]: nextList }
    const next = { ...get().chapterMaterials, [subjectId]: nextSubjectMap }
    persistMaterials(next)
    set({ chapterMaterials: next })
  },
}))

export function useHydrate() {
  const hydrated = useTutoringStore((s) => s.hydrated)
  const hydrate = useTutoringStore((s) => s.hydrate)

  useEffect(() => {
    if (!hydrated) hydrate()
  }, [hydrated, hydrate])

  return hydrated
}
