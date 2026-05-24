/**
 * Allow only same-origin relative paths or http(s) absolute URLs.
 * Blocks javascript:, data:, blob:, and protocol-relative //evil.com links.
 */
export function resolveSafeHref(
  raw: string | undefined | null,
  base = "https://tutorkit.web.app"
): string | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed
  }

  try {
    const url = new URL(trimmed, base)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url.href
  } catch {
    return null
  }
}
