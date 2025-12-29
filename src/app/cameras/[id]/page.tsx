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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full py-16 px-6">
        <Link href="/cameras" className="text-neutral-500 hover:text-white text-sm mb-6 inline-block">
          &larr; All Cameras
        </Link>

        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
          {camera.brand ? `${camera.brand} ${camera.name}` : camera.name}
        </h1>
        <p className="text-neutral-500 mb-12">{camera.photos.length} photos</p>

        {camera.photos.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-neutral-800">
            <p className="text-neutral-500">No photos yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {camera.photos.map(photo => (
              <Link
                key={photo.id}
                href={`/photos/${photo.id}`}
                className="group relative aspect-[3/2] bg-neutral-900"
              >
                <Image src={photo.thumbnailPath} alt="" fill className="object-cover" sizes="25vw" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <span className="text-white text-sm">{photo.user.name || photo.user.username}</span>
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
