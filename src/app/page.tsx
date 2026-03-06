import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-white">Anchor<span className="text-action">Pack</span></h1>
      <p className="text-pewter-pale">Backpacking gear outfit builder.</p>
      <div className="flex gap-4">
        <Link
          href="/gear"
          className="rounded border border-action bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-light transition-colors"
        >
          Gear Inventory
        </Link>
        <Link
          href="/outfits"
          className="rounded border border-action bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-light transition-colors"
        >
          Outfits
        </Link>
        <Link
          href="/trips"
          className="rounded border border-action bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-light transition-colors"
        >
          Trips
        </Link>
      </div>

      <div className="mt-8 max-w-xl space-y-6 border-t border-pewter-mid pt-8">
        <h2 className="font-display text-lg text-white">How it works</h2>
        <div className="space-y-5">
          <div className="flex gap-4">
            <span className="font-data mt-0.5 shrink-0 text-xs font-medium text-action">01</span>
            <div>
              <p className="text-sm font-medium text-white">Browse your Gear Inventory</p>
              <p className="mt-0.5 text-sm text-pewter-pale">Your full gear list is organized by category. Each item shows its weight, tier, and whether it needs to be charged before a trip.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="font-data mt-0.5 shrink-0 text-xs font-medium text-action">02</span>
            <div>
              <p className="text-sm font-medium text-white">Build an Outfit</p>
              <p className="mt-0.5 text-sm text-pewter-pale">An outfit is a saved gear loadout for a specific trip type. Browse by category, toggle items in or out, and use quick-select shortcuts like "All Tier 1" to build your kit fast. The running weight updates as you go.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="font-data mt-0.5 shrink-0 text-xs font-medium text-action">03</span>
            <div>
              <p className="text-sm font-medium text-white">Plan a Trip</p>
              <p className="mt-0.5 text-sm text-pewter-pale">Create a trip, attach an outfit, and get a packing checklist. Check off each item as you pack. Items that need charging get a separate charged checkbox so nothing leaves the house dead.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
