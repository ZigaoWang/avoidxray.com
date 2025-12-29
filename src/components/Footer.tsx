import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-neutral-900 py-8">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1">
          <span className="bg-[#D32F2F] text-white font-black text-xs px-2 py-1 tracking-tight">AVOID</span>
          <span className="bg-white text-black font-black text-xs px-2 py-1 tracking-tight">X-RAY</span>
        </Link>
        <p className="text-neutral-600 text-xs">
          &copy; {new Date().getFullYear()} &middot; Built by <a href="https://zigao.wang" className="hover:text-white transition-colors">Zigao Wang</a>
        </p>
      </div>
    </footer>
  )
}
