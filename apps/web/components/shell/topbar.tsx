"use client"

import { usePathname } from "next/navigation"
import { List, MagnifyingGlass, Plus } from "@phosphor-icons/react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const titleByRoute: {
  match: (path: string) => boolean
  title: string
  subtitle: string
}[] = [
  { match: (p) => p === "/", title: "Today", subtitle: "Today's classes, alerts, quick log" },
  { match: (p) => p.startsWith("/sessions"), title: "Sessions", subtitle: "Heat-graph and class log" },
  { match: (p) => p === "/student" || p.startsWith("/students"), title: "Students", subtitle: "Roster, progress, chapter ladder" },
  { match: (p) => p.startsWith("/schedule"), title: "Schedule", subtitle: "Weekly grid by student" },
  { match: (p) => p.startsWith("/payments"), title: "Payments", subtitle: "Ledger and monthly earnings" },
  { match: (p) => p.startsWith("/library"), title: "Library", subtitle: "Book shelf and PDFs" },
  { match: (p) => p.startsWith("/stats"), title: "Stats", subtitle: "Streaks, totals, breakdowns" },
]

export function Topbar({
  onQuickLog,
  onCommand,
  onMenu,
}: {
  onQuickLog: () => void
  onCommand: () => void
  onMenu: () => void
}) {
  const pathname = usePathname()
  const match = titleByRoute.find((entry) => entry.match(pathname))

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/70 px-3 backdrop-blur-md supports-backdrop-filter:bg-background/55 sm:gap-3 sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open navigation"
        className="tactile grid size-10 shrink-0 place-items-center rounded-xl border border-border/60 bg-card/70 text-foreground md:hidden"
      >
        <List className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          {match?.subtitle ?? ""}
        </p>
        <h1 className="truncate font-heading text-lg font-semibold leading-tight">
          {match?.title ?? "TutorKit"}
        </h1>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCommand}
        className={cn(
          "h-9 gap-2 rounded-full border-border/70 bg-card/70 text-muted-foreground backdrop-blur"
        )}
      >
        <MagnifyingGlass className="size-3.5" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="ml-1 hidden rounded border border-border bg-background/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:inline-block">
          Ctrl K
        </kbd>
      </Button>
      <Button
        type="button"
        size="sm"
        onClick={onQuickLog}
        className="h-9 rounded-full px-3 sm:px-4"
      >
        <Plus data-icon="inline-start" />
        <span className="hidden sm:inline">Log class</span>
      </Button>
    </header>
  )
}
