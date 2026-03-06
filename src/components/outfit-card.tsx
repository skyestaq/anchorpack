import Link from 'next/link'

interface OutfitCardProps {
  id: string
  name: string
  description: string | null
  itemCount: number
  totalWeightOz: number
}

export function OutfitCard({ id, name, description, itemCount, totalWeightOz }: OutfitCardProps) {
  const lbs = (totalWeightOz / 16).toFixed(1)
  return (
    <Link
      href={`/outfits/${id}`}
      className="block rounded-lg border border-pewter-mid bg-pewter-light p-4 transition-colors hover:border-action"
    >
      <h3 className="font-display text-sm text-white">{name}</h3>
      {description && <p className="mt-1 text-sm text-pewter-pale">{description}</p>}
      <div className="mt-3 flex gap-4 font-data text-xs text-pewter-pale">
        <span>{itemCount} items</span>
        <span className="text-action">{lbs} lbs</span>
      </div>
    </Link>
  )
}
