"use client"

import { useMemo } from "react"
import Link from "next/link"
import { CalendarBlank } from "@phosphor-icons/react"

import { useTutoringStore } from "@/lib/store"
import {
  formatTime,
  getTodayDayIndex,
  getWeekdayName,
} from "@/lib/derive"
import type { ScheduleSlot, Student } from "@/lib/tutoring-data"
import {
  EmptyState,
  Panel,
  SectionHeader,
  StudentAvatar,
} from "@/components/ui-bits"
import { cn } from "@workspace/ui/lib/utils"

type SlotBlock = {
  student: Student
  slot: ScheduleSlot
}

const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6]
const START_HOUR = 8
const END_HOUR = 22
const HOUR_HEIGHT = 56

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export default function SchedulePage() {
  const students = useTutoringStore((s) => s.students)
  const todayIndex = getTodayDayIndex()

  const blocksByDay = useMemo(() => {
    const map = new Map<number, SlotBlock[]>()
    for (const day of DAY_INDICES) {
      map.set(day, [])
    }
    for (const student of students) {
      for (const slot of student.scheduleSlots ?? []) {
        const bucket = map.get(slot.dayOfWeek)
        if (bucket) bucket.push({ student, slot })
      }
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime))
    }
    return map
  }, [students])

  const hasAnySlot = useMemo(
    () =>
      students.some((student) => (student.scheduleSlots?.length ?? 0) > 0),
    [students]
  )

  const totalHours = END_HOUR - START_HOUR

  return (
    <div className="grid gap-4">
      <SectionHeader
        title="Weekly schedule"
        description="Tap a slot to open the student. Edit slots from their detail page."
      />

      {!hasAnySlot ? (
        <EmptyState
          icon={<CalendarBlank weight="duotone" className="size-6" />}
          title="No weekly slots yet"
          description="Open a student and add day + time blocks under Weekly slots."
        />
      ) : (
        <Panel className="p-3 sm:p-4">
          <div className="overflow-x-auto">
            <div
              className="grid min-w-[820px]"
              style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}
            >
              <div className="sticky left-0 bg-card" />
              {DAY_INDICES.map((day) => (
                <div
                  key={day}
                  className={cn(
                    "flex flex-col items-start gap-0.5 border-b border-border px-3 py-2",
                    day === todayIndex && "bg-primary/5"
                  )}
                >
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {getWeekdayName(day).slice(0, 3)}
                  </span>
                  <span className="font-heading text-sm font-semibold">
                    {getWeekdayName(day)}
                  </span>
                </div>
              ))}

              <div className="relative">
                {Array.from({ length: totalHours }, (_, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-end pr-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  >
                    {formatTime(`${String(START_HOUR + idx).padStart(2, "0")}:00`)}
                  </div>
                ))}
              </div>
              {DAY_INDICES.map((day) => {
                const blocks = blocksByDay.get(day) ?? []
                return (
                  <div
                    key={day}
                    className={cn(
                      "relative border-l border-border",
                      day === todayIndex && "bg-primary/5"
                    )}
                    style={{ height: `${HOUR_HEIGHT * totalHours}px` }}
                  >
                    {Array.from({ length: totalHours }, (_, idx) => (
                      <div
                        key={idx}
                        className="border-b border-border/60"
                        style={{ height: `${HOUR_HEIGHT}px` }}
                      />
                    ))}
                    {blocks.map(({ student, slot }) => {
                      const startMin = toMinutes(slot.startTime)
                      const offsetMin = startMin - START_HOUR * 60
                      if (offsetMin < 0) return null
                      const top = (offsetMin / 60) * HOUR_HEIGHT
                      const height = Math.max(
                        (slot.durationMin / 60) * HOUR_HEIGHT,
                        32
                      )
                      const color = student.color ?? "#3B82F6"
                      return (
                        <Link
                          key={`${student.id}-${slot.dayOfWeek}-${slot.startTime}`}
                          href={`/students/${student.id}`}
                          className="tactile absolute inset-x-1.5 overflow-hidden rounded-lg p-2 text-[11px] font-semibold text-white shadow-sm transition hover:brightness-110"
                          style={{
                            top,
                            height,
                            backgroundColor: color,
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <StudentAvatar student={student} size="sm" />
                            <span className="truncate">{student.name}</span>
                          </div>
                          <p className="mt-1 text-[10px] text-white/85">
                            {formatTime(slot.startTime)} . {slot.durationMin}m
                          </p>
                        </Link>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </Panel>
      )}
    </div>
  )
}
