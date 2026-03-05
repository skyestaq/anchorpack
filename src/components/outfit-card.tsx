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
      className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition-shadow"
    >
      <h3 className="font-semibold text-gray-900">{name}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      <div className="mt-3 flex gap-4 text-xs text-gray-500">
        <span>{itemCount} items</span>
        <span>{lbs} lbs</span>
      </div>
    </Link>
  )
}
