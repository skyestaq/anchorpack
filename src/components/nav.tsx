'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/gear', label: 'Gear' },
  { href: '/outfits', label: 'Outfits' },
  { href: '/trips', label: 'Trips' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="border-b-[3px] border-action bg-forest-dark">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group font-display text-lg text-white transition-opacity hover:opacity-90">
            Welcome to your next{' '}
            <span className="text-action transition-opacity group-hover:opacity-80">adventure...</span>
          </Link>
          <div className="flex gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-data text-xs font-medium uppercase tracking-widest transition-colors ${
                  pathname.startsWith(link.href)
                    ? 'border-b-2 border-action pb-0.5 text-action'
                    : 'text-pewter-pale hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}
