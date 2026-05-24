"use client"

import { useEffect, useState, type ReactNode } from "react"
import { CircleNotch } from "@phosphor-icons/react"

import { Landing } from "@/components/auth/landing"
import { MobileSidebar, Sidebar } from "@/components/shell/sidebar"
import { Topbar } from "@/components/shell/topbar"
import { QuickLogFab, QuickLogSheet } from "@/components/shell/quick-log"
import { CommandPalette } from "@/components/shell/command-palette"
import { InstallPrompt } from "@/components/shell/install-prompt"
import { TourOverlay } from "@/components/tour/tour-overlay"
import { TourProvider } from "@/components/tour/tour-provider"
import { useAuth } from "@/lib/auth"
import { useHydrate, useTutoringStore } from "@/lib/store"
import { useFirestoreSync } from "@/lib/sync"
import { Toaster } from "@workspace/ui/components/sonner"

function AuthedShell({ children }: { children: ReactNode }) {
  const hydrated = useHydrate()
  const students = useTutoringStore((s) => s.students)
  const [quickLogOpen, setQuickLogOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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
    return <SplashScreen label="Setting up your desk…" />
  }

  return (
    <TourProvider>
      <div className="flex h-svh w-full bg-background text-foreground">
        <Sidebar syncStatus={syncStatus} />
        <MobileSidebar
          open={menuOpen}
          onOpenChange={setMenuOpen}
          syncStatus={syncStatus}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            onQuickLog={() => setQuickLogOpen(true)}
            onCommand={() => setCommandOpen(true)}
            onMenu={() => setMenuOpen(true)}
          />
          <main className="app-scroll min-h-0 flex-1 overflow-y-auto p-3 sm:p-6">
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
        <TourOverlay />
        <Toaster />
      </div>
    </TourProvider>
  )
}

function SplashScreen({ label }: { label: string }) {
  return (
    <main className="grid h-svh place-items-center bg-background text-muted-foreground">
      <div className="flex items-center gap-2.5 text-sm">
        <CircleNotch className="size-4 animate-spin text-primary" />
        {label}
      </div>
    </main>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (status === "loading") {
    return <SplashScreen label="Checking your session…" />
  }

  if (status === "signed-out") {
    return (
      <>
        <Landing />
        <Toaster />
      </>
    )
  }

  // status === "signed-in" OR "unconfigured" (no Firebase env) — both render
  // the app shell. In unconfigured mode the sync hook returns "disabled" and
  // everything works against localStorage only, which is what dev uses
  // without a .env.local.
  return <AuthedShell>{children}</AuthedShell>
}
