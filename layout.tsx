import type { Metadata } from 'next'
import './globals.css'  // ✅ Creates demand for globals.css

export const metadata: Metadata = {
  title: 'LPS Inspection App',
  description: 'Commercial lighting inspections'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind CDN */}
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3.4.10/dist/tailwind.min.css" rel="stylesheet" />
        {/* Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-['Inter'] antialiased">
        {children}
      </body>
    </html>
  )
}
