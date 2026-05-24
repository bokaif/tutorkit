"use client"

import { useMemo, useState } from "react"
import { CaretLeft, CaretRight, Flame, Trophy } from "@phosphor-icons/react"

import {
  formatDate,
  getStreak,
  getYearMatrix,
  getWeekdayShort,
  isoFromDate,
  startOfDay,
  type HeatLevel,
} from "@/lib/derive"
import type { SessionNote, Student } from "@/lib/tutoring-data"
import { Panel, Pill } from "@/components/ui-bits"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

const HEAT_CLASS: Record<HeatLevel, string> = {
  0: "heat-0",
  1: "heat-1",
  2: "heat-2",
  3: "heat-3",
  4: "heat-4",
}

function cellTitle(iso: string, count: number, names: string[]) {
  const noun = count === 1 ? "class" : "classes"
  const who = names.length ? ` (${names.join(", ")})` : ""
  return `${formatDate(iso)} . ${count} ${noun}${who}`
}

export function ContributionGraph({
  notes,
  students,
  selectedDate,
  onSelectDate,
  pulseIso,
  className,
}: {
  notes: SessionNote[]
  students: Student[]
  selectedDate?: string
  onSelectDate?: (iso: string) => void
  pulseIso?: string | null
  className?: string
}) {
  const [year, setYear] = useState(new Date().getFullYear())

  const { weeks, totalClassesInYear, activeDays } = useMemo(
    () => getYearMatrix(year, notes),
    [year, notes]
  )

  const streak = useMemo(() => getStreak(notes), [notes])

  const topDay = useMemo(() => {
    let best: { iso: string; count: number } | null = null
    for (const week of weeks) {
      for (const cell of week) {
        if (!cell.inYear) continue
        if (!best || cell.count > best.count) {
          if (cell.count > 0) best = { iso: cell.iso, count: cell.count }
        }
      }
    }
    return best
  }, [weeks])

  const studentById = useMemo(
    () => new Map(students.map((s) => [s.id, s] as const)),
    [students]
  )

  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = []
    let lastMonth = -1
    weeks.forEach((week, col) => {
      const sample = week[0]
      if (!sample) return
      const month = sample.date.getMonth()
      if (month !== lastMonth && sample.inYear) {
        labels.push({ col, label: MONTHS[month] ?? "" })
        lastMonth = month
      }
    })
    return labels
  }, [weeks])

  return (
    <Panel className={cn("min-w-0 overflow-hidden p-4 sm:p-5", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
            Contributions
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="icon-xs"
              variant="outline"
              onClick={() => setYear((y) => y - 1)}
              aria-label="Previous year"
            >
              <CaretLeft />
            </Button>
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              {year}
            </h2>
            <Button
              type="button"
              size="icon-xs"
              variant="outline"
              onClick={() => setYear((y) => y + 1)}
              aria-label="Next year"
              disabled={year >= new Date().getFullYear()}
            >
              <CaretRight />
            </Button>
            <Pill tone="muted">
              {totalClassesInYear} classes · {activeDays} days
            </Pill>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Pill tone="primary" className="gap-1.5">
            <Flame weight="fill" className="size-3" />
            {streak.current} day streak
          </Pill>
          <Pill tone="warning" className="gap-1.5">
            <Trophy weight="fill" className="size-3" />
            Best {streak.longest}
          </Pill>
          {topDay ? (
            <Pill tone="info" className="gap-1.5">
              Top {formatDate(topDay.iso)} . {topDay.count}
            </Pill>
          ) : null}
        </div>
      </div>

      <TooltipProvider>
        <div className="mt-5 -mx-1 overflow-x-auto overscroll-x-contain px-1 pb-1 sm:mx-0 sm:px-0">
          <div className="inline-flex flex-col gap-1 [--heat-cell:12px] sm:[--heat-cell:14px]">
            <div
              className="relative ml-6 grid gap-[3px] text-[10px] font-semibold text-muted-foreground sm:ml-7"
              style={{
                gridTemplateColumns: `repeat(${weeks.length}, var(--heat-cell))`,
              }}
            >
              {monthLabels.map((entry) => (
                <span
                  key={`${entry.col}-${entry.label}`}
                  style={{ gridColumn: entry.col + 1 }}
                  className="leading-none"
                >
                  {entry.label}
                </span>
              ))}
            </div>

            <div className="flex gap-1">
              <div className="grid grid-rows-7 gap-[3px] pr-1 text-[9px] font-semibold text-muted-foreground sm:text-[9.5px]">
                {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                  <span
                    key={idx}
                    className="flex h-[var(--heat-cell)] items-center"
                    style={{ opacity: idx % 2 === 0 ? 1 : 0 }}
                  >
                    {getWeekdayShort(idx)}
                  </span>
                ))}
              </div>

              <div className="flex gap-[3px]">
                {weeks.map((week, weekIdx) => (
                  <div
                    key={weekIdx}
                    className="flex flex-col gap-[3px]"
                  >
                    {week.map((cell) => {
                      const names = notes
                        .filter((note) => note.date === cell.iso)
                        .map((note) => studentById.get(note.studentId)?.name)
                        .filter((name): name is string => Boolean(name))
                      const uniqueNames = Array.from(new Set(names))
                      const isSelected =
                        selectedDate === cell.iso && cell.inYear
                      const isPulse = pulseIso === cell.iso

                      return (
                        <Tooltip key={cell.iso}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              disabled={!cell.inYear}
                              onClick={() =>
                                cell.inYear && onSelectDate?.(cell.iso)
                              }
                              className={cn(
                                "size-[var(--heat-cell)] rounded-[3px] outline-none transition-[transform,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                                cell.inYear
                                  ? HEAT_CLASS[cell.level]
                                  : "bg-transparent",
                                cell.inYear && cell.count > 0
                                  ? "hover:scale-[1.25]"
                                  : "",
                                isSelected && "ring-2 ring-foreground/70",
                                isPulse && "pulse-cell"
                              )}
                            />
                          </TooltipTrigger>
                          {cell.inYear ? (
                            <TooltipContent>
                              {cellTitle(cell.iso, cell.count, uniqueNames)}
                            </TooltipContent>
                          ) : null}
                        </Tooltip>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-xs text-muted-foreground">
          Tap a square to filter the log below.
        </p>
        <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={cn(
                "size-[12px] rounded-[3px]",
                HEAT_CLASS[level as HeatLevel]
              )}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </Panel>
  )
}

export function MiniHeatStrip({
  notes,
  className,
}: {
  notes: SessionNote[]
  className?: string
}) {
  const days = useMemo(() => {
    const today = startOfDay(new Date())
    const cells: { iso: string; count: number; level: HeatLevel }[] = []
    const countByIso = new Map<string, number>()
    for (const note of notes) {
      countByIso.set(note.date, (countByIso.get(note.date) ?? 0) + 1)
    }

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const iso = isoFromDate(d)
      const count = countByIso.get(iso) ?? 0
      let level: HeatLevel = 0
      if (count >= 4) level = 4
      else if (count === 3) level = 3
      else if (count === 2) level = 2
      else if (count === 1) level = 1
      cells.push({ iso, count, level })
    }
    return cells
  }, [notes])

  return (
    <TooltipProvider>
      <div className={cn("flex flex-wrap gap-[3px]", className)}>
        {days.map((cell) => (
          <Tooltip key={cell.iso}>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "size-[14px] rounded-[3px]",
                  HEAT_CLASS[cell.level]
                )}
                aria-label={`${cell.iso} ${cell.count}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              {formatDate(cell.iso)} . {cell.count}{" "}
              {cell.count === 1 ? "class" : "classes"}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
