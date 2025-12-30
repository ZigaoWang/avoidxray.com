export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-skeleton rounded ${className}`} />
}

export function PhotoSkeleton() {
  return (
    <div className="aspect-[3/2] animate-skeleton rounded" />
  )
}

export function PhotoGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PhotoSkeleton key={i} />
      ))}
    </div>
  )
}

export function FilmStripSkeleton() {
  return (
    <div className="bg-[#1a1816] p-3 rounded">
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-1 aspect-[3/2] animate-skeleton" />
        ))}
      </div>
    </div>
  )
}

export function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full animate-skeleton" />
      <div className="flex-1">
        <div className="h-4 w-24 animate-skeleton rounded mb-2" />
        <div className="h-3 w-16 animate-skeleton rounded" />
      </div>
    </div>
  )
}
