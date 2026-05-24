export type ProgressStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "needs-revision"

export type Subject = {
  id: string
  code: string
  name: string
  bookFile: string
  chapters: string[]
}

export type ScheduleSlot = {
  dayOfWeek: number
  startTime: string
  durationMin: number
}

export type Student = {
  id: string
  name: string
  classLevel: "Class 9"
  guardianPhone?: string
  schedule?: string
  scheduleSlots?: ScheduleSlot[]
  color?: string
  monthlyFee?: string
  classesPerPayment?: string
  paidThroughClassCount?: number
  assignedSubjectIds: string[]
  chapterProgress: {
    [subjectId: string]: {
      [chapterIndex: number]: ProgressStatus
    }
  }
  createdAt: string
  updatedAt: string
}

export type SessionItem = {
  subjectId: string
  chapterIndex: number
}

export type SessionNote = {
  id: string
  studentId: string
  /** Primary subject for the session (back-compat with single-subject notes). */
  subjectId: string
  /** Primary chapter (back-compat with single-subject notes). */
  chapterIndex: number
  /**
   * Optional list of (subject, chapter) pairs covered in a single class.
   * When present, this is the source of truth and `subjectId`/`chapterIndex`
   * mirror `items[0]`.
   */
  items?: SessionItem[]
  note: string
  tags?: string[]
  homework?: string
  nextStep?: string
  durationMin?: number
  date: string
  createdAt: string
}

export type Payment = {
  id: string
  studentId: string
  amount: number
  date: string
  classesCovered: number
  note?: string
  createdAt: string
}

export type TutoringExport = {
  version: 2
  exportedAt: string
  students: Student[]
  sessionNotes: SessionNote[]
  payments: Payment[]
}

// HeroUI-style vibrant palette tuned for gradient avatars on a black canvas
export const studentPalette = [
  "#3B82F6", // primary blue (matches HeroUI primary)
  "#EC4899", // pink
  "#A855F7", // purple
  "#F59E0B", // amber
  "#22D3EE", // cyan
  "#14B8A6", // teal
  "#F97316", // orange
  "#10B981", // emerald
]

export const subjects: Subject[] = [
  {
    id: "physics",
    code: "P",
    name: "Physics",
    bookFile: "/books/physics.pdf",
    chapters: [
      "Physical Quantities and Their Measurements",
      "Motion",
      "Force",
      "Work, Power and Energy",
      "Pressure and States of Matter",
      "Effect of Heat on Matter",
      "Waves and Sound",
      "Reflection of Light",
      "Refraction of Light",
      "Static Electricity",
      "Current Electricity",
      "Magnetic Effects of Current",
      "Modern Physics and Electronics",
      "Physics to Save Life",
    ],
  },
  {
    id: "chemistry",
    code: "C",
    name: "Chemistry",
    bookFile: "/books/chemistry.pdf",
    chapters: [
      "Concept of Chemistry",
      "States of Matter",
      "Structure of Matter",
      "Periodic Table",
      "Chemical Bonds",
      "Concept of Mole and Chemical Calculations",
      "Chemical Reaction",
      "Chemistry and Energy",
      "Acid-Base Balance",
      "Mineral Resources: Metal-Nonmetal",
      "Mineral Resources-Fossil",
      "Chemistry in Our Life",
    ],
  },
  {
    id: "mathematics",
    code: "M",
    name: "Mathematics",
    bookFile: "/books/mathematics.pdf",
    chapters: [
      "Real Number",
      "Set and Function",
      "Algebraic Expressions",
      "Exponents and Logarithms",
      "Equations with One Variable",
      "Lines, Angles and Triangles",
      "Practical Geometry",
      "Circle",
      "Trigonometric Ratio",
      "Distance and Height",
      "Algebraic Ratio and Proportion",
      "Simple Simultaneous Equations with Two Variables",
      "Finite Series",
      "Ratio, Similarity and Symmetry",
      "Area Related Theorems and Constructions",
      "Mensuration",
      "Statistics",
    ],
  },
  {
    id: "biology",
    code: "B",
    name: "Biology",
    bookFile: "/books/biology.pdf",
    chapters: [
      "Lesson on Life",
      "Cell and Tissue of Organism",
      "Cell Division",
      "Bioenergetics",
      "Food, Nutrition, and Digestion",
      "Transport in Organisms",
      "Exchange of Gases",
      "Human Excretion",
      "Firmness and Locomotion",
      "Co-ordination Process in Animal",
      "Reproduction",
      "Heredity in Organisms and Evolution",
      "Environment around Life",
      "Biotechnology",
    ],
  },
  {
    id: "higher-mathematics",
    code: "HM",
    name: "Higher Mathematics",
    bookFile: "/books/higher-mathematics.pdf",
    chapters: [
      "Sets and Functions",
      "Algebraic Expressions",
      "Geometry",
      "Geometric Constructions",
      "Equations",
      "Inequality",
      "Infinite Series",
      "Trigonometry",
      "Exponential and Logarithmic Functions",
      "Binomial Expansion",
      "Coordinate Geometry",
      "Vectors in a Plane",
      "Solid Geometry",
      "Probability",
    ],
  },
]

const isoNow = () => new Date().toISOString()
const isoDate = (offsetDays = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export const demoStudents: Student[] = [
  {
    id: "student-demo-1",
    name: "Kay",
    classLevel: "Class 9",
    guardianPhone: "01700-000000",
    schedule: "Sun Tue Thu, 7:30 PM",
    scheduleSlots: [
      { dayOfWeek: 0, startTime: "19:30", durationMin: 60 },
      { dayOfWeek: 2, startTime: "19:30", durationMin: 60 },
      { dayOfWeek: 4, startTime: "19:30", durationMin: 60 },
    ],
    color: studentPalette[1],
    monthlyFee: "6000",
    classesPerPayment: "8",
    paidThroughClassCount: 0,
    assignedSubjectIds: ["physics", "mathematics"],
    chapterProgress: {
      physics: {
        0: "completed",
        1: "in-progress",
        2: "needs-revision",
      },
      mathematics: {
        0: "completed",
      },
    },
    createdAt: isoNow(),
    updatedAt: isoNow(),
  },
  {
    id: "student-demo-2",
    name: "Rafi",
    classLevel: "Class 9",
    guardianPhone: "01800-000000",
    schedule: "Mon Wed, 6:00 PM",
    scheduleSlots: [
      { dayOfWeek: 1, startTime: "18:00", durationMin: 75 },
      { dayOfWeek: 3, startTime: "18:00", durationMin: 75 },
    ],
    color: studentPalette[2],
    monthlyFee: "4500",
    classesPerPayment: "6",
    paidThroughClassCount: 0,
    assignedSubjectIds: subjects.map((subject) => subject.id),
    chapterProgress: {
      chemistry: {
        0: "completed",
        1: "needs-revision",
      },
      biology: {
        0: "in-progress",
      },
    },
    createdAt: isoNow(),
    updatedAt: isoNow(),
  },
]

export const demoSessionNotes: SessionNote[] = [
  {
    id: "note-demo-1",
    studentId: "student-demo-1",
    subjectId: "physics",
    chapterIndex: 1,
    note: "Covered velocity-time graph basics and assigned motion numericals.",
    tags: ["graph", "motion"],
    homework: "Solve 8 graph problems from Motion.",
    nextStep: "Check graph axes, then start Force.",
    durationMin: 60,
    date: isoDate(0),
    createdAt: isoNow(),
  },
  {
    id: "note-demo-2",
    studentId: "student-demo-2",
    subjectId: "chemistry",
    chapterIndex: 1,
    note: "States of matter recap. Rafi confused on plasma examples.",
    tags: ["recap"],
    homework: "Read pages 18 to 24.",
    durationMin: 75,
    date: isoDate(-2),
    createdAt: isoNow(),
  },
  {
    id: "note-demo-3",
    studentId: "student-demo-1",
    subjectId: "mathematics",
    chapterIndex: 0,
    note: "Real number system, rational vs irrational.",
    tags: ["algebra"],
    durationMin: 60,
    date: isoDate(-3),
    createdAt: isoNow(),
  },
  {
    id: "note-demo-4",
    studentId: "student-demo-1",
    subjectId: "physics",
    chapterIndex: 0,
    note: "Units, measurement, significant figures.",
    durationMin: 60,
    date: isoDate(-5),
    createdAt: isoNow(),
  },
  {
    id: "note-demo-5",
    studentId: "student-demo-2",
    subjectId: "biology",
    chapterIndex: 0,
    note: "Intro to life and biology scope.",
    durationMin: 75,
    date: isoDate(-7),
    createdAt: isoNow(),
  },
]

export const demoPayments: Payment[] = []
