import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

import { AuthProvider, ClerkSetupBanner } from "@/components/auth/auth-provider"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <ThemeProvider>
          <AuthProvider>
            <ClerkSetupBanner />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
