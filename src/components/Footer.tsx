import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-neutral-900 py-8">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/">
          <Image src="/logo.svg" alt="AVOID X RAY" width={80} height={16} />
        </Link>
        <p className="text-neutral-600 text-xs">
          &copy; {new Date().getFullYear()} &middot; Built by <a href="https://zigao.wang" className="hover:text-white transition-colors">Zigao Wang</a>
        </p>
      </div>
    </footer>
  )
}
