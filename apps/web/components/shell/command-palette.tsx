"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  BookOpen,
  CalendarBlank,
  ChartLineUp,
  House,
  Plus,
  Stack,
  UsersThree,
  Wallet,
} from "@phosphor-icons/react"

import { useTutoringStore } from "@/lib/store"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@workspace/ui/components/command"

const routes = [
  { id: "today", label: "Today", href: "/", icon: House },
  { id: "sessions", label: "Sessions", href: "/sessions", icon: Stack },
  { id: "students", label: "Students", href: "/students", icon: UsersThree },
  { id: "schedule", label: "Schedule", href: "/schedule", icon: CalendarBlank },
  { id: "payments", label: "Payments", href: "/payments", icon: Wallet },
  { id: "library", label: "Library", href: "/library", icon: BookOpen },
  { id: "stats", label: "Stats", href: "/stats", icon: ChartLineUp },
]

export function CommandPalette({
  open,
  onOpenChange,
  onQuickLog,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onQuickLog: () => void
}) {
  const router = useRouter()
  const students = useTutoringStore((s) => s.students)

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onOpenChange])

  function go(href: string) {
    onOpenChange(false)
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to anything..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              onOpenChange(false)
              onQuickLog()
            }}
          >
            <Plus className="size-4" />
            Log a class
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigate">
          {routes.map((route) => {
            const Icon = route.icon
            return (
              <CommandItem
                key={route.id}
                onSelect={() => go(route.href)}
              >
                <Icon className="size-4" />
                {route.label}
              </CommandItem>
            )
          })}
        </CommandGroup>
        {students.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Students">
              {students.map((student) => (
                <CommandItem
                  key={student.id}
                  value={`student ${student.name}`}
                  onSelect={() => go(`/student?id=${student.id}`)}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: student.color ?? "#3B82F6" }}
                  />
                  {student.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  )
}
