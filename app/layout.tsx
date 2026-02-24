import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/app/components/Sidebar';


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
      <body className="font-['Inter'] antialiased">
        {children}
      </body>
    </html>
  )
}
