import { Figtree, Geist, Geist_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AppShell } from "@/components/shell/app-shell"
import { cn } from "@workspace/ui/lib/utils"

const figtreeHeading = Figtree({
  subsets: ["latin"],
  variable: "--font-heading",
})

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: "Teach101",
  description: "Personal home tutor desk",
  manifest: "/manifest.webmanifest",
  applicationName: "Teach101",
  appleWebApp: {
    capable: true,
    title: "Teach101",
    statusBarStyle: "black-translucent" as const,
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
}

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "dark font-sans antialiased",
        fontMono.variable,
        geist.variable,
        figtreeHeading.variable
      )}
    >
      <body className="bg-background text-foreground">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
