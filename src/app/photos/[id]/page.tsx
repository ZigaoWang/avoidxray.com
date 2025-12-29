import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import DeleteButton from './DeleteButton'
import LikeButton from '@/components/LikeButton'

export default async function PhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const userId = session?.user ? (session.user as { id: string }).id : null

  const photo = await prisma.photo.findUnique({
    where: { id },
    include: { camera: true, filmStock: true, user: true, _count: { select: { likes: true } } }
  })

  const userLiked = userId ? await prisma.like.findUnique({
    where: { userId_photoId: { userId, photoId: id } }
  }) : null

  if (!photo) notFound()

  const isOwner = userId === photo.userId

  const relatedPhotos = await prisma.photo.findMany({
    where: {
      id: { not: photo.id },
      OR: [
        { filmStockId: photo.filmStockId },
        { cameraId: photo.cameraId }
      ].filter(c => Object.values(c)[0] !== null)
    },
    take: 4,
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <Link href="/" className="text-neutral-500 hover:text-white text-sm mb-6 inline-block">
            &larr; Back
          </Link>

          {/* Photo */}
          <div className="relative aspect-[3/2] w-full bg-black mb-8">
            <Image src={photo.mediumPath} alt={photo.caption || ''} fill className="object-contain" priority />
          </div>

          {/* Info */}
          <div className="flex items-start justify-between gap-8 border-t border-neutral-800 pt-8">
            <div className="flex-1">
              {/* Author */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-neutral-800 flex items-center justify-center text-white font-bold">
                  {(photo.user.name || photo.user.username).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-medium">{photo.user.name || photo.user.username}</p>
                  <p className="text-neutral-500 text-sm">@{photo.user.username}</p>
                </div>
              </div>

              {photo.caption && <p className="text-neutral-300 mb-6">{photo.caption}</p>}

              <div className="flex flex-wrap gap-4 text-sm">
                {photo.camera && (
                  <Link href={`/cameras/${photo.camera.id}`} className="text-neutral-500 hover:text-[#D32F2F]">
                    {photo.camera.name}
                  </Link>
                )}
                {photo.filmStock && (
                  <Link href={`/films/${photo.filmStock.id}`} className="text-neutral-500 hover:text-[#D32F2F]">
                    {photo.filmStock.name}
                  </Link>
                )}
                <span className="text-neutral-600">{photo.createdAt.toLocaleDateString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <LikeButton photoId={photo.id} initialLiked={!!userLiked} initialCount={photo._count.likes} />
              {isOwner && (
                <>
                  <Link href={`/photos/${photo.id}/edit`} className="text-neutral-500 hover:text-white text-sm uppercase tracking-wider">
                    Edit
                  </Link>
                  <DeleteButton photoId={photo.id} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Related */}
        {relatedPhotos.length > 0 && (
          <section className="border-t border-neutral-800 mt-8">
            <div className="max-w-7xl mx-auto px-6 py-12">
              <h2 className="text-sm text-neutral-500 uppercase tracking-wider mb-6">More like this</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {relatedPhotos.map(p => (
                  <Link key={p.id} href={`/photos/${p.id}`} className="relative aspect-[3/2] bg-neutral-900">
                    <Image src={p.thumbnailPath} alt="" fill className="object-cover" sizes="25vw" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
