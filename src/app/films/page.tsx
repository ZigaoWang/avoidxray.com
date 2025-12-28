import { prisma } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default async function FilmsPage() {
  const filmStocks = await prisma.filmStock.findMany({
    include: {
      photos: {
        take: 6,
        orderBy: { createdAt: 'desc' }
      },
      _count: { select: { photos: true } }
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="min-h-screen bg-[#141414] flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full py-12 px-6">
        <div className="mb-12">
          <h1 className="text-4xl text-white mb-3">Film Stocks</h1>
          <p className="text-neutral-400 text-lg">Explore photos shot on different film stocks. Find your next favorite film.</p>
        </div>

        {filmStocks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎞️</div>
            <p className="text-neutral-400">No film stocks yet. Upload photos with film stock info to see them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filmStocks.map(film => (
              <Link
                key={film.id}
                href={`/films/${film.id}`}
                className="group bg-[#1a1a1a] rounded-xl overflow-hidden border border-neutral-800/50 hover:border-emerald-500/30 transition-all"
              >
                <div className="grid grid-cols-3 gap-px aspect-[3/1.2] bg-neutral-800">
                  {film.photos.slice(0, 6).map(photo => (
                    <div key={photo.id} className="relative bg-[#1a1a1a]">
                      <Image src={photo.thumbnailPath} alt="" fill className="object-cover" sizes="200px" />
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 6 - film.photos.length) }).map((_, i) => (
                    <div key={i} className="bg-[#1a1a1a]" />
                  ))}
                </div>
                <div className="p-5">
                  <h3 className="text-lg text-white group-hover:text-emerald-400 transition-colors">
                    {film.name}
                  </h3>
                  <div className="flex items-center justify-between mt-2">
                    {film.brand && <p className="text-neutral-500 text-sm">{film.brand}</p>}
                    <span className="text-neutral-600 text-sm">{film._count.photos} photos</span>
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
