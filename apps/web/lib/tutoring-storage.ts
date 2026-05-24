import {
  defaultSubjects,
  demoPayments,
  demoSessionNotes,
  demoStudents,
  type ChapterMaterials,
  type Payment,
  type SessionNote,
  type Student,
  type Subject,
  type TutoringExport,
} from "@/lib/tutoring-data"

const STUDENTS_KEY = "tutorkit:students"
const NOTES_KEY = "tutorkit:session-notes"
const PAYMENTS_KEY = "tutorkit:payments"
const SUBJECTS_KEY = "tutorkit:subjects"
const MATERIALS_KEY = "tutorkit:chapter-materials"
const BOOTSTRAPPED_KEY = "tutorkit:bootstrapped"
const MIGRATED_KEY = "tutorkit:migrated-from-teach101"
const SUBJECTS_SEEDED_KEY = "tutorkit:subjects-seeded"
const DEMO_PURGE_KEY = "tutorkit:demo-students-purged"

const LEGACY_KEYS: Record<string, string> = {
  [STUDENTS_KEY]: "teach101:tutoring:students",
  [NOTES_KEY]: "teach101:tutoring:session-notes",
  [PAYMENTS_KEY]: "teach101:tutoring:payments",
  [BOOTSTRAPPED_KEY]: "teach101:tutoring:bootstrapped",
}

const DEMO_STUDENT_IDS = new Set(["student-demo-1", "student-demo-2"])

function migrateLegacyKeysOnce() {
  if (typeof window === "undefined") return
  if (window.localStorage.getItem(MIGRATED_KEY) === "1") return
  for (const [next, legacy] of Object.entries(LEGACY_KEYS)) {
    if (window.localStorage.getItem(next) != null) continue
    const value = window.localStorage.getItem(legacy)
    if (value != null) window.localStorage.setItem(next, value)
  }
  window.localStorage.setItem(MIGRATED_KEY, "1")
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback

  try {
    migrateLegacyKeysOnce()
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

export function getSubjects(): Subject[] {
  return readJson<Subject[]>(SUBJECTS_KEY, [])
}

export function saveSubjects(subjects: Subject[]) {
  writeJson(SUBJECTS_KEY, subjects)
}

export function getChapterMaterials(): ChapterMaterials {
  return readJson<ChapterMaterials>(MATERIALS_KEY, {})
}

export function saveChapterMaterials(materials: ChapterMaterials) {
  writeJson(MATERIALS_KEY, materials)
}

/**
 * One-time scrub for the hard-coded "Kay" and "Rafi" demo students that older
 * builds auto-seeded into every signed-in account. Runs once per device; the
 * marker flag prevents it from clobbering students that the tutor manually
 * named the same later.
 */
function purgeDemoStudentsOnce() {
  if (typeof window === "undefined") return
  if (window.localStorage.getItem(DEMO_PURGE_KEY) === "1") return

  const students = getStudents()
  const survivors = students.filter((s) => !DEMO_STUDENT_IDS.has(s.id))
  if (survivors.length !== students.length) {
    saveStudents(survivors)
    const notes = getSessionNotes().filter(
      (note) => !DEMO_STUDENT_IDS.has(note.studentId)
    )
    saveSessionNotes(notes)
    const payments = getPayments().filter(
      (payment) => !DEMO_STUDENT_IDS.has(payment.studentId)
    )
    savePayments(payments)
  }

  window.localStorage.setItem(DEMO_PURGE_KEY, "1")
}

export function bootstrapIfEmpty(): {
  students: Student[]
  notes: SessionNote[]
  payments: Payment[]
  subjects: Subject[]
  chapterMaterials: ChapterMaterials
} {
  if (typeof window === "undefined") {
    return {
      students: [],
      notes: [],
      payments: [],
      subjects: defaultSubjects,
      chapterMaterials: {},
    }
  }

  purgeDemoStudentsOnce()

  const students = getStudents()
  const notes = getSessionNotes()
  const payments = getPayments()
  let subjects = getSubjects()
  const chapterMaterials = getChapterMaterials()

  // Seed subjects exactly once. After this, an empty subjects list is taken at
  // face value (user deleted them all on purpose).
  const subjectsSeeded =
    window.localStorage.getItem(SUBJECTS_SEEDED_KEY) === "1"
  if (!subjectsSeeded && subjects.length === 0) {
    subjects = defaultSubjects
    saveSubjects(subjects)
    window.localStorage.setItem(SUBJECTS_SEEDED_KEY, "1")
  }

  // We no longer auto-seed students/notes. Make sure the bootstrap marker is
  // set so legacy code paths don't try.
  window.localStorage.setItem(BOOTSTRAPPED_KEY, "1")

  return { students, notes, payments, subjects, chapterMaterials }
}

export function resetToDemo() {
  if (typeof window === "undefined") return
  saveStudents(demoStudents)
  saveSessionNotes(demoSessionNotes)
  savePayments(demoPayments)
  saveSubjects(defaultSubjects)
  saveChapterMaterials({})
  window.localStorage.setItem(BOOTSTRAPPED_KEY, "1")
  window.localStorage.setItem(SUBJECTS_SEEDED_KEY, "1")
  // Allow the next bootstrap to leave these demo students in place.
  window.localStorage.setItem(DEMO_PURGE_KEY, "1")
}

export function clearAll() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(STUDENTS_KEY)
  window.localStorage.removeItem(NOTES_KEY)
  window.localStorage.removeItem(PAYMENTS_KEY)
  window.localStorage.removeItem(SUBJECTS_KEY)
  window.localStorage.removeItem(MATERIALS_KEY)
  window.localStorage.setItem(BOOTSTRAPPED_KEY, "1")
  window.localStorage.setItem(SUBJECTS_SEEDED_KEY, "1")
  window.localStorage.setItem(DEMO_PURGE_KEY, "1")
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
