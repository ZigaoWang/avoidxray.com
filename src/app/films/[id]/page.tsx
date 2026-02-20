import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SuggestEditButton from '@/components/SuggestEditButton'

export default async function FilmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const filmStock = await prisma.filmStock.findUnique({
    where: { id },
    include: {
      photos: { where: { published: true }, orderBy: { createdAt: 'desc' }, include: { camera: true, user: true } }
    }
  })

  if (!filmStock) notFound()

  // Only show approved images
  const displayImage = filmStock.imageStatus === 'approved' ? filmStock.imageUrl : null
  const displayDescription = filmStock.imageStatus === 'approved' ? filmStock.description : null

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full py-16 px-6">
        <Link href="/films" className="text-neutral-500 hover:text-white text-sm mb-6 inline-block">
          &larr; All Films
        </Link>

        <div className="flex gap-8 mb-12">
          {/* Left: Image */}
          {displayImage && (
            <div className="w-48 flex-shrink-0">
              <div className="relative aspect-square bg-neutral-900 mb-3">
                <Image
                  src={displayImage}
                  alt={filmStock.name}
                  fill
                  className="object-contain"
                />
              </div>
              <SuggestEditButton
                type="filmstock"
                id={filmStock.id}
                name={filmStock.name}
                brand={filmStock.brand}
                currentImage={displayImage}
                currentDescription={displayDescription}
              />
            </div>
          )}

          {/* Right: Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              {filmStock.brand ? `${filmStock.brand} ${filmStock.name}` : filmStock.name}
            </h1>
            <div className="flex items-center gap-3 text-neutral-500 mb-6">
              {filmStock.iso && (
                <span className="text-sm">ISO {filmStock.iso}</span>
              )}
              <span className="text-sm">{filmStock.photos.length} photos</span>
            </div>

            {displayDescription && (
              <div className="bg-neutral-900 border border-neutral-800 p-4 mb-4">
                <h2 className="text-sm font-bold text-white mb-2 uppercase tracking-wide">About</h2>
                <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {displayDescription}
                </p>
              </div>
            )}

            {!displayImage && (
              <div className="mb-4">
                <SuggestEditButton
                  type="filmstock"
                  id={filmStock.id}
                  name={filmStock.name}
                  brand={filmStock.brand}
                  currentImage={displayImage}
                  currentDescription={displayDescription}
                />
              </div>
            )}

            {!displayImage && !displayDescription && (
              <div className="bg-neutral-900 border border-dashed border-neutral-700 p-6 text-center">
                <p className="text-neutral-500 text-sm">
                  Help the community by adding an image and description for this film stock!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Photos Grid */}
        <div className="border-t border-neutral-800 pt-8">
          <h2 className="text-xl font-bold text-white mb-6">Photos Shot On This Film</h2>
          {filmStock.photos.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-neutral-800">
              <p className="text-neutral-500">No photos yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filmStock.photos.map(photo => (
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
        </div>
      </main>

      <Footer />
    </div>
  )
}
