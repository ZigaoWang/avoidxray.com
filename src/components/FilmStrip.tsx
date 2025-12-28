import Image from 'next/image'
import Link from 'next/link'

type Photo = {
  id: string
  thumbnailPath: string
  width: number
  height: number
}

export default function FilmStrip({ photos }: { photos: Photo[] }) {
  if (!photos.length) return null

  return (
    <div className="w-full">
      <div className="bg-[#2d2926] flex items-stretch w-full shadow-xl">
        {/* Left sprocket column */}
        <div className="w-7 bg-[#1f1c1a] flex flex-col shrink-0">
          {photos.map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-evenly py-1">
              <div className="w-4 h-2.5 rounded-sm bg-[#2d2926]" />
              <div className="w-4 h-2.5 rounded-sm bg-[#2d2926]" />
            </div>
          ))}
        </div>

        {/* Photos */}
        <div className="flex flex-1 py-2 gap-0.5">
          {photos.map(photo => (
            <Link
              key={photo.id}
              href={`/photos/${photo.id}`}
              className="relative flex-1 min-w-0 bg-[#1f1c1a] group"
              style={{ aspectRatio: '3/2' }}
            >
              <div className="absolute inset-1 overflow-hidden rounded-[1px]">
                <Image
                  src={photo.thumbnailPath}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 20vw"
                />
              </div>
            </Link>
          ))}
        </div>

        {/* Right sprocket column */}
        <div className="w-7 bg-[#1f1c1a] flex flex-col shrink-0">
          {photos.map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-evenly py-1">
              <div className="w-4 h-2.5 rounded-sm bg-[#2d2926]" />
              <div className="w-4 h-2.5 rounded-sm bg-[#2d2926]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
