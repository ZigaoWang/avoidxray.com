import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default async function TagPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params

  const tag = await prisma.tag.findUnique({
    where: { name },
    include: {
      photos: {
        include: {
          photo: {
            include: {
              user: { select: { username: true, name: true, avatar: true } },
              _count: { select: { likes: true } }
            }
          }
        },
        orderBy: { photo: { createdAt: 'desc' } }
      },
      _count: { select: { photos: true } }
    }
  })

  if (!tag) notFound()

  const photos = tag.photos.map(pt => pt.photo)

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">#{tag.name}</h1>
            <p className="text-neutral-500">{tag._count.photos} {tag._count.photos === 1 ? 'photo' : 'photos'}</p>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-neutral-800">
              <p className="text-neutral-500">No photos with this tag yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {photos.map(photo => (
                <Link
                  key={photo.id}
                  href={`/photos/${photo.id}`}
                  className="relative aspect-square bg-neutral-900 group overflow-hidden"
                >
                  <Image
                    src={photo.thumbnailPath}
                    alt={photo.caption || ''}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="25vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-sm font-medium">♥ {photo._count.likes}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
