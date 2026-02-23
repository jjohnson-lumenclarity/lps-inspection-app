import type { Metadata } from 'next'
import './globals.css'  // ✅ Required for Tailwind

export const metadata: Metadata = {
  title: 'LPS Inspection App',
  description: 'Commercial lighting inspections',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-['Inter'] antialiased bg-gradient-to-br from-slate-50 to-blue-50">
        {children}
      </body>
    </html>
  )
}
