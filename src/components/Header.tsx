import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function Header() {
  const session = await getServerSession(authOptions)

  return (
    <header className="sticky top-0 z-50 bg-[#141414]/95 backdrop-blur-md border-b border-neutral-800/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-2xl">🎞️</span>
          <span className="text-xl text-white tracking-tight" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
            Film Gallery
          </span>
        </Link>
        <nav className="flex items-center gap-8">
          <Link href="/films" className="text-sm text-neutral-400 hover:text-white transition-colors">
            Film Stocks
          </Link>
          <Link href="/cameras" className="text-sm text-neutral-400 hover:text-white transition-colors">
            Cameras
          </Link>
          {session ? (
            <>
              <Link
                href="/upload"
                className="text-sm bg-emerald-600 text-white px-5 py-2 rounded-full hover:bg-emerald-500 transition-colors"
              >
                Upload
              </Link>
              <Link href="/api/auth/signout" className="text-sm text-neutral-400 hover:text-white transition-colors">
                Sign Out
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-neutral-400 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm bg-white text-neutral-900 px-5 py-2 rounded-full hover:bg-neutral-100 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
