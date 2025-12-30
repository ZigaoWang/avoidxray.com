import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      photos: {
        orderBy: { createdAt: 'desc' },
        include: { filmStock: true, camera: true, _count: { select: { likes: true } } }
      },
      _count: { select: { photos: true } }
    }
  })

  if (!user) notFound()

  const totalLikes = user.photos.reduce((sum, p) => sum + p._count.likes, 0)
  const joinDate = user.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Profile Header */}
        <div className="border-b border-neutral-900">
          <div className="max-w-5xl mx-auto px-6 py-12">
            <div className="flex items-center gap-8">
              {/* Avatar */}
              <div className="w-24 h-24 md:w-32 md:h-32 bg-neutral-800 flex items-center justify-center text-white text-4xl md:text-5xl font-black shrink-0 overflow-hidden">
                {user.avatar ? (
                  <Image src={user.avatar} alt="" width={128} height={128} className="w-full h-full object-cover" />
                ) : (
                  (user.name || user.username).charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight truncate">
                  {user.name || user.username}
                </h1>
                <p className="text-neutral-500 text-sm mb-4">@{user.username}</p>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-white font-bold">{user._count.photos}</span>
                    <span className="text-neutral-500 text-sm ml-1">{user._count.photos === 1 ? 'photo' : 'photos'}</span>
                  </div>
                  <div>
                    <span className="text-white font-bold">{totalLikes}</span>
                    <span className="text-neutral-500 text-sm ml-1">{totalLikes === 1 ? 'like' : 'likes'}</span>
                  </div>
                </div>

                <p className="text-neutral-600 text-xs mt-4">Joined {joinDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        <div className="max-w-5xl mx-auto px-6 py-10">
          {user.photos.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-neutral-800">
              <p className="text-neutral-500">No photos yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-1">
              {user.photos.map(photo => (
                <Link
                  key={photo.id}
                  href={`/photos/${photo.id}`}
                  className="relative aspect-square bg-neutral-900 group overflow-hidden"
                >
                  <Image
                    src={photo.thumbnailPath}
                    alt={photo.caption || ''}
                    fill
                    className="object-cover group-hover:opacity-80 transition-opacity"
                    sizes="25vw"
                  />
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
