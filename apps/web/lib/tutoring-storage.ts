import {
  demoPayments,
  demoSessionNotes,
  demoStudents,
  type Payment,
  type SessionNote,
  type Student,
  type TutoringExport,
} from "@/lib/tutoring-data"

const STUDENTS_KEY = "teach101:tutoring:students"
const NOTES_KEY = "teach101:tutoring:session-notes"
const PAYMENTS_KEY = "teach101:tutoring:payments"
const BOOTSTRAPPED_KEY = "teach101:tutoring:bootstrapped"

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback

  try {
    const value = window.localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function getStudents(): Student[] {
  return readJson<Student[]>(STUDENTS_KEY, [])
}

export function saveStudents(students: Student[]) {
  writeJson(STUDENTS_KEY, students)
}

export function getSessionNotes(): SessionNote[] {
  return readJson<SessionNote[]>(NOTES_KEY, [])
}

export function saveSessionNotes(notes: SessionNote[]) {
  writeJson(NOTES_KEY, notes)
}

export function getPayments(): Payment[] {
  return readJson<Payment[]>(PAYMENTS_KEY, [])
}

export function savePayments(payments: Payment[]) {
  writeJson(PAYMENTS_KEY, payments)
}

export function bootstrapIfEmpty(): {
  students: Student[]
  notes: SessionNote[]
  payments: Payment[]
} {
  if (typeof window === "undefined") {
    return { students: [], notes: [], payments: [] }
  }

  const bootstrapped = window.localStorage.getItem(BOOTSTRAPPED_KEY) === "1"
  const students = getStudents()
  const notes = getSessionNotes()
  const payments = getPayments()

  if (!bootstrapped && students.length === 0 && notes.length === 0) {
    saveStudents(demoStudents)
    saveSessionNotes(demoSessionNotes)
    savePayments(demoPayments)
    window.localStorage.setItem(BOOTSTRAPPED_KEY, "1")
    return {
      students: demoStudents,
      notes: demoSessionNotes,
      payments: demoPayments,
    }
  }

  if (students.length === 0 && notes.length === 0 && payments.length === 0) {
    return { students: [], notes: [], payments: [] }
  }

  return { students, notes, payments }
}

export function resetToDemo() {
  if (typeof window === "undefined") return
  saveStudents(demoStudents)
  saveSessionNotes(demoSessionNotes)
  savePayments(demoPayments)
  window.localStorage.setItem(BOOTSTRAPPED_KEY, "1")
}

export function clearAll() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STUDENTS_KEY)
  window.localStorage.removeItem(NOTES_KEY)
  window.localStorage.removeItem(PAYMENTS_KEY)
  window.localStorage.setItem(BOOTSTRAPPED_KEY, "1")
}

export function exportTutoringData(
  students: Student[],
  sessionNotes: SessionNote[],
  payments: Payment[]
): TutoringExport {
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    students,
    sessionNotes,
    payments,
  }
}

export function parseTutoringImport(value: string): TutoringExport {
  const data = JSON.parse(value) as Partial<TutoringExport>

  if (!Array.isArray(data.students) || !Array.isArray(data.sessionNotes)) {
    throw new Error("Import file must include students and sessionNotes arrays.")
  }

  return {
    version: 2,
    exportedAt: data.exportedAt ?? new Date().toISOString(),
    students: data.students,
    sessionNotes: data.sessionNotes,
    payments: Array.isArray(data.payments) ? data.payments : [],
  }
}
