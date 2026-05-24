"use client"

import { useEffect, useLayoutEffect, useState, type CSSProperties } from "react"
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { useTour } from "@/components/tour/tour-provider"
import { tourSteps } from "@/components/tour/tour-steps"

type Rect = { top: number; left: number; width: number; height: number }

const CARD_MAX_WIDTH = 420
const CARD_HEIGHT_GUESS = 320
const GUTTER = 14

function getCardWidth(vw: number) {
  return Math.min(CARD_MAX_WIDTH, Math.max(300, vw - GUTTER * 2))
}

function readRect(selector: string): Rect | null {
  if (typeof document === "undefined") return null
  const el = document.querySelector(selector) as HTMLElement | null
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return null
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

function computeCardPosition(
  rect: Rect,
  preferred: "right" | "bottom" | "top" | "left" | undefined
): CSSProperties {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const cardWidth = getCardWidth(vw)
  const safeBottom = Math.max(GUTTER, vh - CARD_HEIGHT_GUESS - GUTTER)

  const placements: Array<"right" | "bottom" | "top" | "left"> = preferred
    ? [preferred, "right", "bottom", "top", "left"]
    : ["right", "bottom", "top", "left"]

  for (const placement of placements) {
    if (placement === "right") {
      const left = rect.left + rect.width + GUTTER
      if (left + cardWidth + GUTTER <= vw) {
        const top = clamp(
          rect.top + rect.height / 2 - CARD_HEIGHT_GUESS / 2,
          GUTTER,
          safeBottom
        )
        return { top, left, position: "absolute" }
      }
    } else if (placement === "left") {
      const left = rect.left - cardWidth - GUTTER
      if (left >= GUTTER) {
        const top = clamp(
          rect.top + rect.height / 2 - CARD_HEIGHT_GUESS / 2,
          GUTTER,
          safeBottom
        )
        return { top, left, position: "absolute" }
      }
    } else if (placement === "bottom") {
      const top = rect.top + rect.height + GUTTER
      if (top + CARD_HEIGHT_GUESS + GUTTER <= vh) {
        const left = clamp(
          rect.left + rect.width / 2 - cardWidth / 2,
          GUTTER,
          Math.max(GUTTER, vw - cardWidth - GUTTER)
        )
        return { top, left, position: "absolute" }
      }
    } else if (placement === "top") {
      const top = rect.top - CARD_HEIGHT_GUESS - GUTTER
      if (top >= GUTTER) {
        const left = clamp(
          rect.left + rect.width / 2 - cardWidth / 2,
          GUTTER,
          Math.max(GUTTER, vw - cardWidth - GUTTER)
        )
        return { top, left, position: "absolute" }
      }
    }
  }

  return {
    top: clamp(rect.top + rect.height + GUTTER, GUTTER, safeBottom),
    left: clamp(rect.left, GUTTER, Math.max(GUTTER, vw - cardWidth - GUTTER)),
    position: "absolute",
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function TourOverlay() {
  const { active, step, totalSteps, next, prev, finish, goTo } = useTour()
  const current = tourSteps[step]
  const [rect, setRect] = useState<Rect | null>(null)

  useLayoutEffect(() => {
    if (!active) {
      setRect(null)
      return
    }
    if (!current?.target) {
      setRect(null)
      return
    }

    const el = document.querySelector(current.target) as HTMLElement | null
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
    }

    let raf = 0
    const refresh = () => {
      const next = readRect(current.target!)
      if (next) setRect(next)
      raf = requestAnimationFrame(refresh)
    }
    raf = requestAnimationFrame(refresh)
    const onResize = () => {
      const r = readRect(current.target!)
      if (r) setRect(r)
    }
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onResize, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onResize, true)
    }
  }, [active, step, current?.target])

  useEffect(() => {
    if (!active) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") finish()
      else if (event.key === "ArrowRight" || event.key === "Enter") next()
      else if (event.key === "ArrowLeft") prev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active, next, prev, finish])

  if (!active || !current) return null

  const isCentered = !current.target || !rect
  const isLast = step === totalSteps - 1
  const Icon = current.icon

  const cardStyle: CSSProperties | undefined =
    !isCentered && rect ? computeCardPosition(rect, current.preferredSide) : undefined

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-label="Product tour">
      {/*
        Click-catcher under everything else. Bare transparent layer — no blur,
        no tint — so the spotlight below can paint the dimming on its own.
        Click anywhere outside the tooltip to skip the tour.
      */}
      <button
        type="button"
        aria-label="Skip tour"
        onClick={finish}
        className="absolute inset-0 cursor-default focus:outline-none"
      />

      {/* For steps with no target we still need a uniformly dim full-screen
          backdrop (it's the spotlight that would normally provide it). */}
      {isCentered ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-background/88 backdrop-blur-[3px]"
        />
      ) : null}

      {/* Spotlight: a ring sized to the target, with a huge solid box-shadow
          that dims everything outside the rect. The inside of the ring is
          fully untouched — no blur, no overlay — so the highlighted element
          is crystal clear. */}
      {!isCentered && rect ? (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-xl ring-2 ring-primary"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow:
              "0 0 0 9999px oklch(0.04 0.003 280 / 0.86), 0 0 28px 6px oklch(0.66 0.18 280 / 0.6)",
            transition:
              "top 220ms cubic-bezier(0.23, 1, 0.32, 1), left 220ms cubic-bezier(0.23, 1, 0.32, 1), width 220ms cubic-bezier(0.23, 1, 0.32, 1), height 220ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        />
      ) : null}

      <div
        className={cn(
          "z-10 max-h-[calc(100svh-28px)] w-[min(420px,calc(100vw-28px))] overflow-y-auto rounded-2xl bg-card p-5 ring-1 ring-border",
          isCentered ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" : "absolute"
        )}
        style={cardStyle}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary">
              <Icon weight="duotone" className="size-4.5" />
            </span>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tour · Step {step + 1} of {totalSteps}
              </p>
              <h3 className="mt-0.5 font-heading text-base font-semibold">
                {current.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={finish}
            className="tactile -mr-1 -mt-1 grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close tour"
          >
            <X className="size-3.5" weight="bold" />
          </button>
        </div>

        <p className="mt-3 text-sm text-foreground/85 leading-relaxed">
          {current.body}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={prev}
            disabled={step === 0}
          >
            <CaretLeft data-icon="inline-start" />
            Back
          </Button>

          <div className="mx-1 flex flex-1 items-center justify-center gap-1.5">
            {tourSteps.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Go to step ${index + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === step
                    ? "w-6 bg-primary"
                    : "w-1.5 bg-muted hover:bg-muted-foreground/40"
                )}
              />
            ))}
          </div>

          {isLast ? (
            <Button type="button" size="sm" onClick={finish}>
              Got it
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={next}>
              Next
              <CaretRight data-icon="inline-end" />
            </Button>
          )}
        </div>

        <button
          type="button"
          onClick={finish}
          className="mt-2 w-full text-center text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          Skip tour
        </button>
      </div>
    </div>
  )
}
