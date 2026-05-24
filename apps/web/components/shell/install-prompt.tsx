"use client"

import { useEffect, useState } from "react"
import { DeviceMobile, DownloadSimple, X } from "@phosphor-icons/react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

const STORAGE_KEY = "tutorkit:install-prompt-dismissed-at"
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7 // a week

function isStandalone() {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

function isIos() {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function InstallPrompt() {
  const [deferred, setDeferred] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)
  const [iosHint, setIosHint] = useState(false)

  // Register the service worker exactly once (production only — Next's dev
  // server doesn't play nicely with aggressive caching).
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    if (process.env.NODE_ENV !== "production") return

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) =>
        console.error("[tutorkit] service worker registration failed", err)
      )
  }, [])

  // Capture beforeinstallprompt + decide whether to surface the banner.
  useEffect(() => {
    if (typeof window === "undefined") return
    if (isStandalone()) return

    const dismissedAt = Number(
      window.localStorage.getItem(STORAGE_KEY) ?? "0"
    )
    const muted = dismissedAt && Date.now() - dismissedAt < COOLDOWN_MS

    function onBeforeInstall(event: Event) {
      event.preventDefault()
      const e = event as BeforeInstallPromptEvent
      setDeferred(e)
      if (!muted) setOpen(true)
    }

    function onInstalled() {
      setOpen(false)
      setDeferred(null)
      window.localStorage.removeItem(STORAGE_KEY)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    window.addEventListener("appinstalled", onInstalled)

    // iOS Safari never fires beforeinstallprompt, so show a different hint.
    if (!muted && isIos() && !isStandalone()) {
      setIosHint(true)
      setOpen(true)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()))
    }
    setOpen(false)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    if (choice.outcome === "accepted") {
      setOpen(false)
      setDeferred(null)
    } else {
      dismiss()
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-label="Install TutorKit"
      className={cn(
        "fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-border/60 bg-card/95 p-3.5 backdrop-blur-md sm:right-5 sm:left-auto sm:bottom-24"
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <DeviceMobile weight="duotone" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm font-semibold">Install TutorKit</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {iosHint
            ? "Tap Share, then 'Add to Home Screen' to install."
            : "Add it to your home screen for offline access and a faster launch."}
        </p>
        {!iosHint ? (
          <div className="mt-2.5 flex items-center gap-2">
            <Button size="xs" onClick={install} disabled={!deferred}>
              <DownloadSimple data-icon="inline-start" />
              Install
            </Button>
            <Button size="xs" variant="ghost" onClick={dismiss}>
              Not now
            </Button>
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="tactile -mr-1 -mt-1 grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="size-3.5" weight="bold" />
      </button>
    </div>
  )
}
