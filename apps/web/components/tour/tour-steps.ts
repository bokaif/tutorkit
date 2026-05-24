import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import {
  BookOpen,
  CalendarBlank,
  ChalkboardTeacher,
  HandWaving,
  Plus,
  Sparkle,
  UsersThree,
} from "@phosphor-icons/react"

export type TourStep = {
  id: string
  /**
   * CSS selector for the element to highlight. `null` renders a centered
   * modal with no spotlight.
   */
  target: string | null
  title: string
  body: string
  icon: PhosphorIcon
  preferredSide?: "right" | "bottom" | "top" | "left"
}

export const tourSteps: TourStep[] = [
  {
    id: "welcome",
    target: null,
    title: "Welcome to TutorKit",
    body:
      "60-second tour. You'll know where every part of the app lives — students, syllabus, sessions, fees, and the keyboard shortcut you'll use the most.",
    icon: HandWaving,
  },
  {
    id: "students",
    target: '[data-tour="nav-students"]',
    title: "Students live here",
    body:
      "Add a student once and TutorKit tracks their subjects, weekly schedule, monthly fee, and per-chapter progress. Everything below hangs off the student.",
    icon: UsersThree,
    preferredSide: "right",
  },
  {
    id: "library",
    target: '[data-tour="nav-library"]',
    title: "Library — your syllabus HQ",
    body:
      "Build subjects, then chapters inside each subject. Each chapter holds materials (links, notes, PDFs) and an optional textbook URL. You can keep your whole syllabus and reference stash here.",
    icon: BookOpen,
    preferredSide: "right",
  },
  {
    id: "chapter-drill",
    target: '[data-tour="nav-students"]',
    title: "Drill into any chapter",
    body:
      "Open a student → switch to the subject tab → click a chapter row. You'll see every class you've taught on that chapter, plus a place to add resources right then and there.",
    icon: ChalkboardTeacher,
    preferredSide: "right",
  },
  {
    id: "schedule",
    target: '[data-tour="nav-schedule"]',
    title: "Schedule",
    body:
      "Weekly slot grid by student. Drop time blocks per day; Today reads from this so the dashboard knows what's coming.",
    icon: CalendarBlank,
    preferredSide: "right",
  },
  {
    id: "log",
    target: '[data-tour="log-class"]',
    title: "Log a class fast",
    body:
      "Press N or tap this button to log a class. Pick the student, attach one or more (subject, chapter) pairs in a single class, add a note and homework. Done.",
    icon: Plus,
    preferredSide: "bottom",
  },
  {
    id: "finish",
    target: null,
    title: "You're set",
    body:
      "Start by adding your first student in Students. You can replay this tour anytime from the ‘?’ button in the top bar.",
    icon: Sparkle,
  },
]
