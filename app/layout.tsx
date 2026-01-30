import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Footer } from "@/components/footer"
import { ClarityScript } from "@/components/clarity-script"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "India's Number 1 Job Portal for Right Jobs and Candidates",
  description:
    "Find the right job or candidate on Job-Karle, India's leading job portal connecting employers with talented candidates.",
  generator: "v0.app",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.ico", type: "image/x-icon" }],
    apple: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <ClarityScript />
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
