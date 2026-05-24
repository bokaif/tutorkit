"use client"

import {
  CalendarBlank,
  ChartLineUp,
  GraduationCap,
  Stack,
  Wallet,
} from "@phosphor-icons/react"

import { useAuth } from "@/lib/auth"
import { GoogleSignInButton } from "@/components/auth/google-button"
import { cn } from "@workspace/ui/lib/utils"

const features = [
  {
    icon: Stack,
    title: "Quick log",
    blurb: "Two taps to log a class, with multi-subject + chapter checkboxes.",
  },
  {
    icon: ChartLineUp,
    title: "Year in green",
    blurb: "A GitHub-style contribution graph for every class you teach.",
  },
  {
    icon: Wallet,
    title: "Payment ledger",
    blurb: "Per-student dues, month-by-month totals, no spreadsheets.",
  },
  {
    icon: CalendarBlank,
    title: "Weekly grid",
    blurb: "See every recurring slot at a glance, color-coded per student.",
  },
] as const

/**
 * A tiny synthetic contribution graph that hints at what the product looks
 * like. Deterministic so it doesn't flicker between renders.
 */
function HeatmapPreview() {
  const weeks = 26
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
        if (noise > 0.62) bucket = 1
        if (noise > 0.78) bucket = 2
        if (noise > 0.9) bucket = 3
        const color = [
          "bg-foreground/[0.06]",
          "bg-primary/30",
          "bg-primary/55",
          "bg-primary",
        ][bucket]
        return (
          <span
            key={i}
            className={cn("h-2.5 w-2.5 rounded-[3px]", color)}
          />
        )
      })}
    </div>
  )
}

export function Landing() {
  const { signIn, error, status } = useAuth()
  const unconfigured = status === "unconfigured"

  return (
    <div className="relative isolate flex min-h-svh w-full overflow-hidden bg-background text-foreground">
      {/* Ambient — soft radial spotlights + dot grid, no glow shadows. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-40 -left-40 size-[40rem] rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute right-[-12rem] top-1/3 size-[34rem] rounded-full bg-fuchsia-500/[0.06] blur-3xl" />
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

      <div className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_460px]">
        {/* LEFT — pitch */}
        <section className="flex flex-col justify-between gap-10 px-6 py-10 sm:px-10 lg:px-16 lg:py-16">
          <header className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap weight="duotone" className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="font-heading text-base font-semibold">TutorKit</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Personal tutoring desk
              </p>
            </div>
          </header>

          <div className="flex max-w-2xl flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-primary" />
              v1 · for home tutors
            </span>
            <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              The desk every home tutor
              <br />
              <span className="bg-gradient-to-br from-primary via-primary/80 to-cyan-300/80 bg-clip-text text-transparent">
                actually deserves.
              </span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Log every class in two taps, watch your year fill with green
              squares, keep payments honest, and let each student climb a
              chapter ladder you can see.
            </p>

            <div className="mt-1 max-w-xl rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
              <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <span>Last 26 weeks</span>
                <span>184 classes</span>
              </div>
              <HeatmapPreview />
            </div>
          </div>

          <div className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="flex gap-3 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Icon weight="duotone" className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-semibold">
                      {feature.title}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                      {feature.blurb}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* RIGHT — auth card */}
        <section className="flex items-center justify-center border-border px-6 py-10 sm:px-10 lg:border-l lg:px-12 lg:py-16">
          <div className="w-full max-w-sm">
            <div className="rounded-3xl border border-border bg-card/80 p-7 backdrop-blur-xl">
              <div className="mb-6 flex flex-col items-center text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                  <GraduationCap weight="duotone" className="size-6" />
                </span>
                <h2 className="mt-4 font-heading text-xl font-semibold tracking-tight">
                  Welcome to TutorKit
                </h2>
                <p className="mt-1.5 text-[13.5px] leading-snug text-muted-foreground">
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
                <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] leading-snug text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
