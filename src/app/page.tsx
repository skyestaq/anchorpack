import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">GRC Gear</h1>
      <p className="text-gray-600">Backpacking gear outfit builder.</p>
      <div className="flex gap-4">
        <Link
          href="/gear"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Gear Inventory
        </Link>
        <Link
          href="/outfits"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
        >
          Outfits
        </Link>
        <Link
          href="/trips"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
        >
          Trips
        </Link>
      </div>
    </div>
  )
}
