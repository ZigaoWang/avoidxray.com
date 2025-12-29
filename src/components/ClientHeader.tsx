'use client'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function ClientHeader() {
  const { data: session } = useSession()

  return (
    <header className="bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-1">
          <span className="bg-[#D32F2F] text-white font-black text-sm px-2 py-1 tracking-tight">AVOID</span>
          <span className="bg-white text-black font-black text-sm px-2 py-1 tracking-tight">X-RAY</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/films" className="text-xs text-neutral-400 hover:text-white transition-colors uppercase tracking-wide font-medium">
            Films
          </Link>
          <Link href="/cameras" className="text-xs text-neutral-400 hover:text-white transition-colors uppercase tracking-wide font-medium">
            Cameras
          </Link>
          {session ? (
            <>
              <Link href="/upload" className="text-xs text-neutral-400 hover:text-white transition-colors uppercase tracking-wide font-medium">
                Upload
              </Link>
              <Link href="/api/auth/signout" className="text-xs text-neutral-400 hover:text-white transition-colors uppercase tracking-wide font-medium">
                Sign Out
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs text-neutral-400 hover:text-white transition-colors uppercase tracking-wide font-medium">
                Sign In
              </Link>
              <Link href="/register" className="bg-[#D32F2F] text-white text-xs px-4 py-2 uppercase tracking-wide font-bold hover:bg-[#E53935] transition-colors">
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
