import * as React from "react"

import type { Subject, Student } from "@/lib/tutoring-data"
import { cn } from "@workspace/ui/lib/utils"

export function Panel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card shadow-[0_1px_0_oklch(1_0_0_/_0.04)_inset,0_24px_60px_-30px_rgba(0,0,0,0.6)]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-3",
        className
      )}
    >
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </header>
  )
}

export function KPI({
  label,
  value,
  hint,
  className,
  accent,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  className?: string
  accent?: "default" | "success" | "warning" | "danger" | "info"
}) {
  const accentClass = {
    default: "text-foreground",
    success: "text-[color:var(--success)]",
    warning: "text-[color:var(--warning)]",
    danger: "text-destructive",
    info: "text-[color:var(--info)]",
  }[accent ?? "default"]

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-border",
        className
      )}
    >
      <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-heading text-3xl font-semibold leading-none tracking-tight",
          accentClass
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function Pill({
  children,
  className,
  tone = "neutral",
}: {
  children: React.ReactNode
  className?: string
  tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "muted"
}) {
  const toneClass = {
    neutral:
      "bg-foreground/[0.06] text-foreground/85 border-foreground/10",
    primary: "bg-primary/15 text-primary border-primary/25",
    success:
      "bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/25",
    warning:
      "bg-[color:var(--warning)]/18 text-[color:var(--warning)] border-[color:var(--warning)]/25",
    danger: "bg-destructive/15 text-destructive border-destructive/25",
    info: "bg-[color:var(--info)]/15 text-[color:var(--info)] border-[color:var(--info)]/25",
    muted: "bg-muted text-muted-foreground border-transparent",
  }[tone]

  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1 rounded-full border px-2 text-[10.5px] font-semibold uppercase tracking-wider",
        toneClass,
        className
      )}
    >
      {children}
    </span>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center",
        className
      )}
    >
      {icon ? (
        <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <p className="font-heading text-base font-semibold">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

const subjectColors: Record<string, { bg: string; fg: string }> = {
  physics: { bg: "#15803D", fg: "#ECFDF5" },
  chemistry: { bg: "#E11D48", fg: "#FFF1F2" },
  mathematics: { bg: "#2563EB", fg: "#EFF6FF" },
  biology: { bg: "#65A30D", fg: "#F7FEE7" },
  "higher-mathematics": { bg: "#7C3AED", fg: "#F5F3FF" },
}

export function SubjectMark({
  subject,
  size = "md",
  className,
}: {
  subject: Subject
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const palette = subjectColors[subject.id] ?? {
    bg: "var(--primary)",
    fg: "var(--primary-foreground)",
  }
  const sizeClass = {
    sm: "size-6 text-[10px]",
    md: "size-8 text-xs",
    lg: "size-10 text-sm",
  }[size]

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-lg font-bold",
        sizeClass,
        className
      )}
      style={{ backgroundColor: palette.bg, color: palette.fg }}
    >
      {subject.code}
    </span>
  )
}

function gradientFor(hex: string) {
  // build a two-stop hue-shifted gradient so avatars feel like the HeroUI marketing bubbles
  return `linear-gradient(135deg, color-mix(in oklch, ${hex} 80%, white 20%), ${hex} 55%, color-mix(in oklch, ${hex} 70%, black 30%))`
}

export function StudentAvatar({
  student,
  size = "md",
  className,
}: {
  student: Student
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const initials = student.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("")

  const sizeClass = {
    sm: "size-7 text-[10px]",
    md: "size-9 text-xs",
    lg: "size-11 text-sm",
  }[size]

  const color = student.color ?? "#3B82F6"

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold text-white ring-1 ring-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]",
        sizeClass,
        className
      )}
      style={{ background: gradientFor(color) }}
    >
      {initials || "?"}
    </span>
  )
}

export function InfoLine({
  label,
  value,
  className,
}: {
  label: string
  value: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="min-w-0 truncate text-sm font-semibold">{value}</p>
    </div>
  )
}
