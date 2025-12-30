import { prisma } from '@/lib/db'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LeaderboardCard from '@/components/LeaderboardCard'

function daysSince(date: Date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = 'trending' } = await searchParams

  const [photos, users, popularTags] = await Promise.all([
    prisma.photo.findMany({
      include: { user: true, filmStock: true, camera: true, _count: { select: { likes: true } } }
    }),
    prisma.user.findMany({
      include: {
        photos: { include: { _count: { select: { likes: true } } } },
        _count: { select: { photos: true, followers: true } }
      }
    }),
    prisma.tag.findMany({
      include: { _count: { select: { photos: true } } },
      orderBy: { photos: { _count: 'desc' } },
      take: 12
    })
  ])

  // Calculate leaderboard
  const leaderboard = users
    .map(user => ({
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      photoCount: user._count.photos,
      followerCount: user._count.followers,
      totalLikes: user.photos.reduce((sum, p) => sum + p._count.likes, 0)
    }))
    .filter(u => u.photoCount > 0)
    .sort((a, b) => b.totalLikes - a.totalLikes)
    .slice(0, 5)

  let sortedPhotos = [...photos]

  if (tab === 'trending') {
    sortedPhotos = photos.map(p => ({
      ...p,
      score: p._count.likes + Math.max(0, 7 - daysSince(p.createdAt))
    })).sort((a, b) => b.score - a.score)
  } else if (tab === 'recent') {
    sortedPhotos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (tab === 'random') {
    sortedPhotos.sort(() => Math.random() - 0.5)
  }

  const tabs = [
    { id: 'trending', label: 'Trending' },
    { id: 'recent', label: 'Recent' },
    { id: 'random', label: 'Random' }
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Explore</h1>
          <p className="text-neutral-500 mb-8">Discover film photography</p>

          <div className="flex gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {/* Tabs */}
              <div className="flex gap-4 border-b border-neutral-800 mb-8">
                {tabs.map(t => (
                  <Link
                    key={t.id}
                    href={`/explore?tab=${t.id}`}
                    className={`py-3 text-sm font-medium transition-colors ${tab === t.id ? 'text-white border-b-2 border-[#D32F2F]' : 'text-neutral-500 hover:text-white'}`}
                  >
                    {t.label}
                  </Link>
                ))}
              </div>

              {/* Photos Grid */}
              {sortedPhotos.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-neutral-800">
                  <p className="text-neutral-500">No photos yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                  {sortedPhotos.map(photo => (
                    <Link key={photo.id} href={`/photos/${photo.id}`} className="relative aspect-square bg-neutral-900 group overflow-hidden">
                      <Image
                        src={photo.thumbnailPath}
                        alt={photo.caption || ''}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-sm font-medium truncate">@{photo.user.username}</p>
                          {photo.filmStock && <p className="text-neutral-300 text-xs truncate">{photo.filmStock.name}</p>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block w-72 space-y-6">
              {/* Leaderboard */}
              <LeaderboardCard users={leaderboard} />

              {/* Popular Tags */}
              {popularTags.length > 0 && (
                <div className="bg-neutral-900 p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-400 mb-4">Popular Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map(tag => (
                      <Link
                        key={tag.id}
                        href={`/tags/${tag.name}`}
                        className="text-sm text-neutral-400 hover:text-white transition-colors"
                      >
                        #{tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
