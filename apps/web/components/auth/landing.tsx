"use client"

import {
  BookOpen,
  CalendarBlank,
  ChartLineUp,
  Command,
  DeviceMobile,
  GraduationCap,
  type Icon as PhosphorIcon,
  Stack,
  Steps,
  Wallet,
} from "@phosphor-icons/react"

import { useAuth } from "@/lib/auth"
import { GoogleSignInButton } from "@/components/auth/google-button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

type FeatureIcon = PhosphorIcon

const features: {
  icon: FeatureIcon
  title: string
  detail: string
}[] = [
  {
    icon: Stack,
    title: "Quick log",
    detail:
      "Two taps to log a class. Pick multiple subjects + chapters in one go.",
  },
  {
    icon: ChartLineUp,
    title: "Year in green",
    detail:
      "A GitHub-style contribution heat-map of every class you've taught.",
  },
  {
    icon: CalendarBlank,
    title: "Weekly grid",
    detail:
      "Every recurring slot rendered on a 7-day grid, color-coded per student.",
  },
  {
    icon: Wallet,
    title: "Payment ledger",
    detail:
      "Per-student dues with month-by-month totals. Spreadsheets retired.",
  },
  {
    icon: Steps,
    title: "Chapter ladder",
    detail:
      "Watch each student climb their subject ladder, chapter by chapter.",
  },
  {
    icon: BookOpen,
    title: "Book shelf",
    detail: "Per-student PDF library, opens straight inside the app.",
  },
  {
    icon: Command,
    title: "⌘K palette",
    detail: "Jump to any page or action without ever touching the mouse.",
  },
  {
    icon: DeviceMobile,
    title: "PWA",
    detail: "Install on phone, use offline, syncs the moment you're back.",
  },
]

function HeatmapPreview() {
  const weeks = 22
  const days = 7
  return (
    <div
      aria-hidden="true"
      className="grid gap-[3px]"
      style={{
        gridTemplateColumns: `repeat(${weeks}, 1fr)`,
        gridAutoFlow: "column",
        gridTemplateRows: `repeat(${days}, 1fr)`,
      }}
    >
      {Array.from({ length: weeks * days }).map((_, i) => {
        const seed = Math.sin(i * 12.9898) * 43758.5453
        const noise = seed - Math.floor(seed)
        let bucket = 0
        if (noise > 0.6) bucket = 1
        if (noise > 0.78) bucket = 2
        if (noise > 0.92) bucket = 3
        const color = [
          "bg-foreground/[0.06]",
          "bg-primary/35",
          "bg-primary/60",
          "bg-primary",
        ][bucket]
        return (
          <span
            key={i}
            className={cn("aspect-square w-full rounded-[3px]", color)}
          />
        )
      })}
    </div>
  )
}

function FeatureChip({
  icon: Icon,
  title,
  detail,
}: {
  icon: FeatureIcon
  title: string
  detail: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          tabIndex={0}
          className={cn(
            "tactile group flex items-center gap-2 rounded-xl border border-border bg-card/70 px-3 py-2",
            "text-[12.5px] font-semibold text-foreground/85 backdrop-blur",
            "hover:border-primary/40 hover:bg-card hover:text-foreground",
            "focus:outline-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30"
          )}
        >
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/15 text-primary transition-colors group-hover:bg-primary/25">
            <Icon weight="duotone" className="size-3.5" />
          </span>
          <span className="truncate">{title}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={8}
        className="max-w-[240px] rounded-lg bg-card px-3 py-2 text-left text-[12px] font-normal leading-snug text-foreground ring-1 ring-border"
      >
        {detail}
      </TooltipContent>
    </Tooltip>
  )
}

export function Landing() {
  const { signIn, error, status } = useAuth()
  const unconfigured = status === "unconfigured"

  return (
    <TooltipProvider delayDuration={120}>
      <div className="relative isolate h-svh w-full overflow-x-hidden overflow-y-auto bg-background text-foreground">
        {/* Ambient — soft radial spotlights + dot grid. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute -top-40 -left-40 size-[40rem] rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute right-[-12rem] top-1/3 size-[34rem] rounded-full bg-fuchsia-500/[0.07] blur-3xl" />
          <div className="absolute bottom-[-12rem] left-1/3 size-[28rem] rounded-full bg-cyan-500/[0.06] blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, oklch(1 0 0 / 0.05) 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="flex min-h-full w-full items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Wrapper card */}
          <div
            className={cn(
              "w-full max-w-[1240px] overflow-hidden rounded-[28px]",
              "border border-border bg-card/70 backdrop-blur-xl"
            )}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
              {/* LEFT — pitch */}
              <section className="flex flex-col gap-8 p-8 sm:p-10 lg:gap-10 lg:p-12">
                <header className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                      <GraduationCap
                        weight="duotone"
                        className="size-5"
                      />
                    </span>
                    <div className="leading-tight">
                      <p className="font-heading text-[15px] font-semibold">
                        TutorKit
                      </p>
                      <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Personal tutoring desk
                      </p>
                    </div>
                  </div>
                  <span className="hidden items-center gap-1.5 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:inline-flex">
                    <span className="size-1.5 rounded-full bg-primary" />
                    v1
                  </span>
                </header>

                <div className="flex flex-col gap-5">
                  <h1 className="font-heading text-[2.25rem] font-semibold leading-[1.05] tracking-tight sm:text-[2.75rem] lg:text-[3rem]">
                    The desk every home tutor
                    <br />
                    <span className="bg-gradient-to-br from-primary via-fuchsia-300/85 to-cyan-300/80 bg-clip-text text-transparent">
                      actually deserves.
                    </span>
                  </h1>
                  <p className="max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                    Log every class in two taps. Watch your year fill with
                    green squares. Keep payments honest. All in one tactile,
                    keyboard-driven desk.
                  </p>
                </div>

                <div className="mt-1 flex flex-col gap-2.5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Everything that comes with it
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {features.map((feature) => (
                      <FeatureChip
                        key={feature.title}
                        icon={feature.icon}
                        title={feature.title}
                        detail={feature.detail}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground/80">
                    Hover any chip for details.
                  </p>
                </div>
              </section>

              {/* RIGHT — auth + visual */}
              <section
                className={cn(
                  "flex flex-col gap-6 border-border bg-background/40 p-8 sm:p-10",
                  "lg:gap-7 lg:border-l lg:p-10"
                )}
              >
                <div className="flex flex-col items-center text-center">
                  <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                    <GraduationCap weight="duotone" className="size-6" />
                  </span>
                  <h2 className="mt-4 font-heading text-xl font-semibold tracking-tight">
                    Welcome to TutorKit
                  </h2>
                  <p className="mt-1.5 max-w-[260px] text-[13.5px] leading-snug text-muted-foreground">
                    Sign in to claim your desk and pick up where you left off.
                  </p>
                </div>

                <GoogleSignInButton
                  onClick={signIn}
                  label={
                    unconfigured
                      ? "Sign-in unavailable"
                      : "Continue with Google"
                  }
                />

                {error ? (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] leading-snug text-destructive">
                    {error}
                  </p>
                ) : null}

                <div className="mt-2 rounded-2xl border border-border bg-card/80 p-4">
                  <div className="mb-3 flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <span>Last 22 weeks</span>
                    <span>184 classes</span>
                  </div>
                  <HeatmapPreview />
                  <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground/80">
                    <span>Less</span>
                    <span className="size-2.5 rounded-sm bg-foreground/[0.08]" />
                    <span className="size-2.5 rounded-sm bg-primary/35" />
                    <span className="size-2.5 rounded-sm bg-primary/60" />
                    <span className="size-2.5 rounded-sm bg-primary" />
                    <span>More</span>
                  </div>
                </div>

                <dl className="grid grid-cols-3 gap-2.5">
                  <PreviewStat label="Streak" value="12" suffix="days" />
                  <PreviewStat label="Hours / mo" value="46" suffix="h" />
                  <PreviewStat label="Students" value="7" />
                </dl>
              </section>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

function PreviewStat({
  label,
  value,
  suffix,
}: {
  label: string
  value: string
  suffix?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card/70 p-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-1 font-heading text-xl font-semibold tracking-tight">
        {value}
        {suffix ? (
          <span className="text-[11px] font-medium text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </p>
    </div>
  )
}
