import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default async function CameraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const camera = await prisma.camera.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { createdAt: 'desc' }, include: { filmStock: true, user: true } }
    }
  })

  if (!camera) notFound()

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full py-12 px-6">
        <Link href="/cameras" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white text-sm mb-8 transition-colors">
          ← All Cameras
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl text-white mb-3">
            {camera.brand ? `${camera.brand} ${camera.name}` : camera.name}
          </h1>
          <p className="text-neutral-400">{camera.photos.length} photo{camera.photos.length !== 1 ? 's' : ''}</p>
        </div>

        {camera.photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-400">No photos with this camera yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {camera.photos.map(photo => (
              <Link
                key={photo.id}
                href={`/photos/${photo.id}`}
                className="group relative aspect-[3/2] bg-[#1a1a1a] rounded-lg overflow-hidden"
              >
                <Image src={photo.thumbnailPath} alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-sm truncate">{photo.user.name || photo.user.username}</p>
                    {photo.filmStock && <p className="text-neutral-400 text-xs truncate">{photo.filmStock.name}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
