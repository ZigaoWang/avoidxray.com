import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-[#141414]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎞️</span>
              <span className="text-lg font-semibold text-white">Film Gallery</span>
            </Link>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-md">
              A community platform for analog photography enthusiasts to share, discover, and celebrate the art of film photography.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-neutral-500 hover:text-white transition-colors">Gallery</Link></li>
              <li><Link href="/films" className="text-neutral-500 hover:text-white transition-colors">Film Stocks</Link></li>
              <li><Link href="/cameras" className="text-neutral-500 hover:text-white transition-colors">Cameras</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-medium text-white mb-4">Account</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/login" className="text-neutral-500 hover:text-white transition-colors">Sign In</Link></li>
              <li><Link href="/register" className="text-neutral-500 hover:text-white transition-colors">Create Account</Link></li>
              <li><Link href="/upload" className="text-neutral-500 hover:text-white transition-colors">Upload Photos</Link></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="border-t border-neutral-800 pt-8 mb-8">
          <p className="text-neutral-600 text-xs leading-relaxed">
            <strong className="text-neutral-500">Disclaimer:</strong> All photographs and content uploaded to Film Gallery remain the intellectual property of their respective authors.
            Film Gallery serves solely as a hosting platform and does not claim ownership over any user-submitted content.
            The platform assumes no responsibility or liability for the accuracy, copyright compliance, or legality of user-uploaded materials.
            Users are solely responsible for ensuring they have the right to share any content they upload.
          </p>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-600">
          <p>© {new Date().getFullYear()} Film Gallery. All rights reserved.</p>
          <p>
            Designed & built by{' '}
            <a
              href="https://zigao.wang"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              Zigao Wang
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
