"use client"

import { useEffect } from "react"
import { create } from "zustand"

import { newId } from "@/lib/derive"
import type {
  Payment,
  ProgressStatus,
  ScheduleSlot,
  SessionNote,
  Student,
} from "@/lib/tutoring-data"
import {
  bootstrapIfEmpty,
  clearAll as clearStorage,
  resetToDemo as resetStorage,
  savePayments,
  saveSessionNotes,
  saveStudents,
} from "@/lib/tutoring-storage"

type StudentDraft = Omit<
  Student,
  "id" | "chapterProgress" | "createdAt" | "updatedAt"
>

type StudentUpdate = Partial<Omit<Student, "id" | "createdAt">>

type TutoringState = {
  hydrated: boolean
  students: Student[]
  notes: SessionNote[]
  payments: Payment[]
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

export const useTutoringStore = create<TutoringState>((set, get) => ({
  hydrated: false,
  students: [],
  notes: [],
  payments: [],

  hydrate: () => {
    if (get().hydrated) return
    const { students, notes, payments } = bootstrapIfEmpty()
    set({ students, notes, payments, hydrated: true })
  },

  replaceAll: ({ students, notes, payments }) => {
    persistStudents(students)
    persistNotes(notes)
    persistPayments(payments)
    set({ students, notes, payments, hydrated: true })
  },

  resetDemo: () => {
    resetStorage()
    const { students, notes, payments } = bootstrapIfEmpty()
    set({ students, notes, payments, hydrated: true })
  },

  wipe: () => {
    clearStorage()
    set({ students: [], notes: [], payments: [], hydrated: true })
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
}))

export function useHydrate() {
  const hydrated = useTutoringStore((s) => s.hydrated)
  const hydrate = useTutoringStore((s) => s.hydrate)

  useEffect(() => {
    if (!hydrated) hydrate()
  }, [hydrated, hydrate])

  return hydrated
}
