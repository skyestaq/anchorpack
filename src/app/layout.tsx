import type { Metadata } from 'next'
import { Krona_One, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import { Nav } from '@/components/nav'

const kronaOne = Krona_One({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-krona-one',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
})

export const metadata: Metadata = {
  title: 'AnchorPack',
  description: 'Backpacking gear outfit builder',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${kronaOne.variable} ${dmSans.variable} ${dmMono.variable} font-body bg-pewter text-pewter-pale`}>
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          {children}
        </main>
      </body>
    </html>
  )
}
