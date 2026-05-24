"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  CalendarBlank,
  ChartLineUp,
  GraduationCap,
  House,
  Stack,
  UsersThree,
  Wallet,
} from "@phosphor-icons/react"

import { useTutoringStore } from "@/lib/store"
import { getClassPaymentState, studentProgress } from "@/lib/derive"
import type { SyncStatus } from "@/lib/sync"
import { StudentAvatar } from "@/components/ui-bits"
import { cn } from "@workspace/ui/lib/utils"

const navItems = [
  { id: "today", label: "Today", href: "/", icon: House },
  { id: "sessions", label: "Sessions", href: "/sessions", icon: Stack },
  { id: "students", label: "Students", href: "/students", icon: UsersThree },
  { id: "schedule", label: "Schedule", href: "/schedule", icon: CalendarBlank },
  { id: "payments", label: "Payments", href: "/payments", icon: Wallet },
  { id: "library", label: "Library", href: "/library", icon: BookOpen },
  { id: "stats", label: "Stats", href: "/stats", icon: ChartLineUp },
]

const SYNC_LABEL: Record<SyncStatus, { dot: string; label: string }> = {
  disabled: { dot: "bg-foreground/30", label: "Local only" },
  connecting: { dot: "bg-[color:var(--warning)]", label: "Connecting" },
  online: { dot: "bg-[color:var(--success)]", label: "Synced" },
  saving: { dot: "bg-primary animate-pulse", label: "Saving" },
  offline: { dot: "bg-muted", label: "Offline" },
  error: { dot: "bg-destructive", label: "Sync error" },
}

export function Sidebar({ syncStatus = "disabled" }: { syncStatus?: SyncStatus }) {
  const pathname = usePathname()
  const students = useTutoringStore((s) => s.students)
  const notes = useTutoringStore((s) => s.notes)
  const syncMeta = SYNC_LABEL[syncStatus]

  const dueCount = useMemo(
    () =>
      students.filter((student) => getClassPaymentState(student, notes).due)
        .length,
    [students, notes]
  )

  return (
    <aside className="flex h-full w-[244px] shrink-0 flex-col gap-3 border-r border-border/60 bg-background p-3 text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-2 py-1">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_30px_-6px_oklch(0.65_0.19_252/0.55)]">
          <GraduationCap weight="duotone" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-semibold leading-none">
            Teach101
          </p>
          <p
            className="mt-1 flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wider text-sidebar-foreground/55"
            title={syncMeta.label}
          >
            <span
              className={cn("inline-block size-1.5 rounded-full", syncMeta.dot)}
            />
            {syncMeta.label}
          </p>
        </div>
      </div>

      <nav className="grid gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)
          const isPayments = item.id === "payments"

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "tactile group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                isActive
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              {isActive ? (
                <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-primary" />
              ) : null}
              <Icon className="size-4 shrink-0" weight={isActive ? "fill" : "regular"} />
              <span className="flex-1">{item.label}</span>
              {isPayments && dueCount > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {dueCount}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="mt-2 flex items-center justify-between px-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Students
        </p>
        <span className="text-[10.5px] font-semibold text-sidebar-foreground/60">
          {students.length}
        </span>
      </div>

      <div className="app-scroll -mx-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1">
        {students.length === 0 ? (
          <p className="rounded-lg bg-sidebar-accent/50 p-3 text-xs text-sidebar-foreground/60">
            No students yet. Add one to start.
          </p>
        ) : (
          students.map((student) => {
            const isActive = pathname === `/students/${student.id}`
            const progress = studentProgress(student)
            return (
              <Link
                key={student.id}
                href={`/students/${student.id}`}
                className={cn(
                  "tactile flex items-center gap-2.5 rounded-lg px-2 py-1.5",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60"
                )}
              >
                <StudentAvatar student={student} size="sm" />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                  {student.name}
                </span>
                <span className="text-[10.5px] font-semibold text-sidebar-foreground/60">
                  {progress}%
                </span>
              </Link>
            )
          })
        )}
      </div>
    </aside>
  )
}
