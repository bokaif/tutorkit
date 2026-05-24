import {
  defaultSubjects,
  type ProgressStatus,
  type SessionItem,
  type SessionNote,
  type Student,
  type Subject,
  type Payment,
} from "@/lib/tutoring-data"

export type ChapterRef = {
  subject: Subject
  chapter: string
  chapterIndex: number
  status: ProgressStatus
}

export const todayIso = () => new Date().toISOString().slice(0, 10)
export const newId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`

/**
 * Module-level subjects registry. Helpers in this file (and a handful of
 * non-React callers) read subjects from here. The Zustand store calls
 * `setSubjectRegistry(state.subjects)` on every subject mutation so this stays
 * in sync with the store and Firestore.
 *
 * We default to the bundled NCTB list so server-rendering doesn't crash and
 * the app feels populated before hydration completes.
 */
let subjectRegistry: Subject[] = defaultSubjects

export function setSubjectRegistry(next: Subject[]) {
  subjectRegistry = next
}

export function getAllSubjects(): Subject[] {
  return subjectRegistry
}

export function getSubject(subjectId: string) {
  return subjectRegistry.find((subject) => subject.id === subjectId)
}

export function getSessionItems(note: SessionNote): SessionItem[] {
  if (note.items && note.items.length > 0) return note.items
  return [{ subjectId: note.subjectId, chapterIndex: note.chapterIndex }]
}

export function getStatus(
  student: Student,
  subjectId: string,
  chapterIndex: number
) {
  return student.chapterProgress[subjectId]?.[chapterIndex] ?? "not-started"
}

export function countCompleted(student: Student, subjectId: string) {
  const subject = getSubject(subjectId)
  if (!subject) return 0
  return subject.chapters.filter(
    (_, idx) => getStatus(student, subjectId, idx) === "completed"
  ).length
}

export function studentProgress(student: Student) {
  const totals = student.assignedSubjectIds.reduce(
    (acc, subjectId) => {
      const subject = getSubject(subjectId)
      if (!subject) return acc
      acc.total += subject.chapters.length
      acc.done += countCompleted(student, subjectId)
      return acc
    },
    { done: 0, total: 0 }
  )

  return totals.total === 0 ? 0 : Math.round((totals.done / totals.total) * 100)
}

export function subjectProgress(student: Student, subjectId: string) {
  const subject = getSubject(subjectId)
  if (!subject) return 0
  return Math.round(
    (countCompleted(student, subjectId) / subject.chapters.length) * 100
  )
}

export function getChapters(
  student: Student,
  subjectId: string
): ChapterRef[] {
  const subject = getSubject(subjectId)
  if (!subject) return []

  return subject.chapters.map((chapter, chapterIndex) => ({
    subject,
    chapter,
    chapterIndex,
    status: getStatus(student, subjectId, chapterIndex),
  }))
}

export function getNextChapter(
  student: Student,
  subjectId: string
): ChapterRef | null {
  const chapters = getChapters(student, subjectId)
  return (
    chapters.find((c) => c.status === "in-progress") ??
    chapters.find((c) => c.status === "not-started") ??
    chapters.find((c) => c.status === "needs-revision") ??
    chapters[0] ??
    null
  )
}

export function getRevisionItems(students: Student[]) {
  return students.flatMap((student) =>
    student.assignedSubjectIds.flatMap((subjectId) =>
      getChapters(student, subjectId)
        .filter((chapter) => chapter.status === "needs-revision")
        .map((chapter) => ({ ...chapter, student }))
    )
  )
}

export function formatDate(value?: string) {
  if (!value) return "Not set"
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

export function formatMonth(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}-01T00:00:00`))
}

export function getMonthKey(value = new Date()) {
  return value.toISOString().slice(0, 7)
}

export function getMonthDays(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number)
  const safeYear = year && Number.isFinite(year) ? year : new Date().getFullYear()
  const safeMonth =
    month && Number.isFinite(month) ? month : new Date().getMonth() + 1
  const count = new Date(safeYear, safeMonth, 0).getDate()

  return Array.from({ length: count }, (_, idx) => {
    const day = idx + 1
    return `${monthKey}-${String(day).padStart(2, "0")}`
  })
}

export function getTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean)
}

export function parsePositiveInt(value?: string) {
  const number = Number.parseInt(value ?? "", 10)
  return Number.isFinite(number) && number > 0 ? number : 0
}

export function parseFee(value?: string) {
  const number = Number.parseFloat(value ?? "")
  return Number.isFinite(number) ? number : 0
}

export function getStudentClassCount(
  notes: SessionNote[],
  studentId: string
) {
  return notes.filter((note) => note.studentId === studentId).length
}

export function getClassPaymentState(student: Student, notes: SessionNote[]) {
  const totalClasses = getStudentClassCount(notes, student.id)
  const paidThrough = Math.min(
    student.paidThroughClassCount ?? 0,
    totalClasses
  )
  const sincePaid = Math.max(totalClasses - paidThrough, 0)
  const target = parsePositiveInt(student.classesPerPayment)

  return {
    totalClasses,
    paidThrough,
    sincePaid,
    target,
    remaining: target > 0 ? Math.max(target - sincePaid, 0) : 0,
    due: target > 0 && sincePaid >= target,
  }
}

export type HeatLevel = 0 | 1 | 2 | 3 | 4

export function heatLevel(count: number): HeatLevel {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count === 3) return 3
  return 4
}

export function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function isoFromDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export type YearMatrixCell = {
  iso: string
  date: Date
  count: number
  level: HeatLevel
  inYear: boolean
}

export function getYearMatrix(year: number, notes: SessionNote[]) {
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31)

  const firstDay = new Date(yearStart)
  const dayOfWeek = (firstDay.getDay() + 6) % 7
  firstDay.setDate(firstDay.getDate() - dayOfWeek)

  const lastDay = new Date(yearEnd)
  const endDayOfWeek = (lastDay.getDay() + 6) % 7
  lastDay.setDate(lastDay.getDate() + (6 - endDayOfWeek))

  const countByIso = new Map<string, number>()
  for (const note of notes) {
    countByIso.set(note.date, (countByIso.get(note.date) ?? 0) + 1)
  }

  const weeks: YearMatrixCell[][] = []
  const cursor = new Date(firstDay)

  while (cursor <= lastDay) {
    const week: YearMatrixCell[] = []
    for (let i = 0; i < 7; i++) {
      const iso = isoFromDate(cursor)
      const count = countByIso.get(iso) ?? 0
      week.push({
        iso,
        date: new Date(cursor),
        count,
        level: heatLevel(count),
        inYear: cursor.getFullYear() === year,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  const totalClassesInYear = Array.from(countByIso.entries()).reduce(
    (sum, [iso, count]) =>
      iso.startsWith(`${year}-`) ? sum + count : sum,
    0
  )

  const activeDays = Array.from(countByIso.entries()).filter(
    ([iso, count]) => iso.startsWith(`${year}-`) && count > 0
  ).length

  return { weeks, totalClassesInYear, activeDays }
}

export function getStreak(notes: SessionNote[]) {
  if (notes.length === 0) {
    return { current: 0, longest: 0 }
  }

  const dateSet = new Set(notes.map((note) => note.date))
  const sortedDates = Array.from(dateSet).sort()

  let longest = 0
  let run = 0
  let prev: Date | null = null

  for (const iso of sortedDates) {
    const d = new Date(iso)
    if (prev) {
      const diffDays = Math.round(
        (d.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (diffDays === 1) {
        run += 1
      } else {
        longest = Math.max(longest, run)
        run = 1
      }
    } else {
      run = 1
    }
    prev = d
  }
  longest = Math.max(longest, run)

  let current = 0
  const today = startOfDay(new Date())
  const cursor = new Date(today)
  while (dateSet.has(isoFromDate(cursor))) {
    current += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  if (current === 0) {
    const yesterday = addDays(today, -1)
    if (dateSet.has(isoFromDate(yesterday))) {
      const probe = new Date(yesterday)
      while (dateSet.has(isoFromDate(probe))) {
        current += 1
        probe.setDate(probe.getDate() - 1)
      }
    }
  }

  return { current, longest }
}

export function getEarningsByMonth(
  payments: Payment[],
  year: number
): { month: string; amount: number }[] {
  const months: { month: string; amount: number }[] = []
  for (let m = 0; m < 12; m++) {
    const key = `${year}-${String(m + 1).padStart(2, "0")}`
    const total = payments
      .filter((p) => p.date.startsWith(key))
      .reduce((sum, p) => sum + p.amount, 0)
    months.push({ month: key, amount: total })
  }
  return months
}

export function getTopSubject(notes: SessionNote[]) {
  const counts = new Map<string, number>()
  for (const note of notes) {
    for (const item of getSessionItems(note)) {
      counts.set(item.subjectId, (counts.get(item.subjectId) ?? 0) + 1)
    }
  }
  let best: { subjectId: string; count: number } | null = null
  for (const [subjectId, count] of counts) {
    if (!best || count > best.count) best = { subjectId, count }
  }
  return best
}

export function getTopStudent(notes: SessionNote[]) {
  const counts = new Map<string, number>()
  for (const note of notes) {
    counts.set(note.studentId, (counts.get(note.studentId) ?? 0) + 1)
  }
  let best: { studentId: string; count: number } | null = null
  for (const [studentId, count] of counts) {
    if (!best || count > best.count) best = { studentId, count }
  }
  return best
}

export function getTotalMinutes(notes: SessionNote[]) {
  return notes.reduce((sum, note) => sum + (note.durationMin ?? 0), 0)
}

const weekdayShort = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const weekdayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

export function getWeekdayShort(index: number) {
  return weekdayShort[index] ?? ""
}

export function getWeekdayName(index: number) {
  return weekdayNames[index] ?? ""
}

export function normalizeDayOfWeek(jsDayOfWeek: number) {
  return (jsDayOfWeek + 6) % 7
}

export function getDayIndexFromIso(iso: string) {
  return normalizeDayOfWeek(new Date(iso).getDay())
}

export function getTodayDayIndex() {
  return normalizeDayOfWeek(new Date().getDay())
}

export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  if (h == null || m == null) return hhmm
  const period = h >= 12 ? "PM" : "AM"
  const hour = ((h + 11) % 12) + 1
  return `${hour}:${String(m).padStart(2, "0")} ${period}`
}

export function studentColor(student: Student, fallback = "#3B82F6") {
  return student.color ?? fallback
}

export function classesByMonth(notes: SessionNote[], year: number) {
  return Array.from({ length: 12 }, (_, idx) => {
    const key = `${year}-${String(idx + 1).padStart(2, "0")}`
    return {
      month: key,
      count: notes.filter((note) => note.date.startsWith(key)).length,
    }
  })
}

export function lastNDays(n: number) {
  const today = startOfDay(new Date())
  return Array.from({ length: n }, (_, idx) =>
    isoFromDate(addDays(today, -(n - 1 - idx)))
  )
}
