import { prisma } from '@/lib/db'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default async function ChallengesPage() {
  const now = new Date()

  const challenges = await prisma.challenge.findMany({
    where: { active: true },
    orderBy: { endDate: 'asc' }
  })

  // Get photo counts and preview photos for each challenge
  const challengesWithData = await Promise.all(
    challenges.map(async challenge => {
      const tag = await prisma.tag.findUnique({
        where: { name: challenge.tagName },
        include: {
          photos: {
            include: { photo: true },
            take: 4,
            orderBy: { photo: { createdAt: 'desc' } }
          },
          _count: { select: { photos: true } }
        }
      })
      const isActive = new Date(challenge.endDate) >= now
      const daysLeft = Math.ceil((new Date(challenge.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return {
        ...challenge,
        photoCount: tag?._count.photos || 0,
        previewPhotos: tag?.photos.map(pt => pt.photo) || [],
        isActive,
        daysLeft: isActive ? daysLeft : 0
      }
    })
  )

  const activeChallenges = challengesWithData.filter(c => c.isActive)
  const pastChallenges = challengesWithData.filter(c => !c.isActive)

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Challenges</h1>
          <p className="text-neutral-500 mb-8">Join photo challenges and showcase your work</p>

          {/* Active Challenges */}
          {activeChallenges.length > 0 && (
            <section className="mb-12">
              <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400 mb-4">Active Challenges</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeChallenges.map(challenge => (
                  <div key={challenge.id} className="bg-neutral-900 overflow-hidden">
                    {/* Preview Grid */}
                    <div className="grid grid-cols-4 gap-0.5">
                      {challenge.previewPhotos.slice(0, 4).map((photo, i) => (
                        <div key={i} className="aspect-square relative">
                          <Image src={photo.thumbnailPath} alt="" fill className="object-cover" sizes="12vw" />
                        </div>
                      ))}
                      {Array.from({ length: Math.max(0, 4 - challenge.previewPhotos.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square bg-neutral-800" />
                      ))}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-bold text-lg">{challenge.title}</h3>
                        <span className="text-xs bg-[#D32F2F] text-white px-2 py-1 font-bold">
                          {challenge.daysLeft} days left
                        </span>
                      </div>
                      <p className="text-neutral-400 text-sm mb-3">{challenge.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 text-sm">{challenge.photoCount} entries</span>
                        <Link
                          href={`/tags/${challenge.tagName}`}
                          className="text-sm text-[#D32F2F] hover:text-white transition-colors font-medium"
                        >
                          View entries →
                        </Link>
                      </div>
                      <p className="text-neutral-600 text-xs mt-3">
                        Tag your photos with <span className="text-neutral-400">#{challenge.tagName}</span> to enter
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Past Challenges */}
          {pastChallenges.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-400 mb-4">Past Challenges</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pastChallenges.map(challenge => (
                  <Link
                    key={challenge.id}
                    href={`/tags/${challenge.tagName}`}
                    className="bg-neutral-900 p-4 hover:bg-neutral-800 transition-colors"
                  >
                    <h3 className="text-white font-medium">{challenge.title}</h3>
                    <p className="text-neutral-500 text-sm">{challenge.photoCount} entries</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {challenges.length === 0 && (
            <div className="text-center py-20 border border-dashed border-neutral-800">
              <p className="text-neutral-500">No challenges yet</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
