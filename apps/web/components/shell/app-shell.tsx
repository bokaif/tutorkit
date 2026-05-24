"use client"

import { useEffect, useState, type ReactNode } from "react"

import { Sidebar } from "@/components/shell/sidebar"
import { Topbar } from "@/components/shell/topbar"
import { QuickLogFab, QuickLogSheet } from "@/components/shell/quick-log"
import { CommandPalette } from "@/components/shell/command-palette"
import { InstallPrompt } from "@/components/shell/install-prompt"
import { useHydrate, useTutoringStore } from "@/lib/store"
import { useFirestoreSync } from "@/lib/sync"
import { Toaster } from "@workspace/ui/components/sonner"

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useHydrate()
  const students = useTutoringStore((s) => s.students)
  const [quickLogOpen, setQuickLogOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const syncStatus = useFirestoreSync(hydrated)

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName.toLowerCase()
      const isInput =
        tag === "input" || tag === "textarea" || target?.isContentEditable
      if (isInput) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() === "n") {
        event.preventDefault()
        setQuickLogOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  if (!hydrated) {
    return (
      <main className="grid h-svh place-items-center bg-background text-muted-foreground">
        <p className="text-sm">Loading desk...</p>
      </main>
    )
  }

  return (
    <div className="flex h-svh w-full bg-background text-foreground">
      <Sidebar syncStatus={syncStatus} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onQuickLog={() => setQuickLogOpen(true)}
          onCommand={() => setCommandOpen(true)}
        />
        <main className="app-scroll min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
      <QuickLogFab onClick={() => setQuickLogOpen(true)} />
      <QuickLogSheet
        open={quickLogOpen}
        onOpenChange={setQuickLogOpen}
        defaultStudentId={students[0]?.id}
      />
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        onQuickLog={() => setQuickLogOpen(true)}
      />
      <InstallPrompt />
      <Toaster />
    </div>
  )
}
