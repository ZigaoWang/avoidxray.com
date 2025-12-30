'use client'
import { useState } from 'react'

export default function ColorPalette({ colors }: { colors: { color: string }[] }) {
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = async (hex: string) => {
    await navigator.clipboard.writeText(hex)
    setCopied(hex)
    setTimeout(() => setCopied(null), 1000)
  }

  return (
    <div className="mt-6">
      <p className="text-neutral-500 text-xs uppercase tracking-wider mb-3">Color Palette</p>
      <div className="flex gap-2">
        {colors.map((c, i) => (
          <button
            key={i}
            onClick={() => handleCopy(c.color)}
            className="group relative w-10 h-10 transition-transform hover:scale-110"
            style={{ backgroundColor: c.color }}
          >
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {copied === c.color ? 'Copied!' : c.color}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
