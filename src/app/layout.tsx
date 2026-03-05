import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GRC Gear',
  description: 'Backpacking gear outfit builder',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  )
}
