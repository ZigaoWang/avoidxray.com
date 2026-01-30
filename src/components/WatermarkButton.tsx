'use client'
import { useState } from 'react'
import WatermarkGenerator from './WatermarkGenerator'

interface WatermarkButtonProps {
  photoId: string
  camera?: string | null
  filmStock?: string | null
}

export default function WatermarkButton({ photoId, camera, filmStock }: WatermarkButtonProps) {
  const [showGenerator, setShowGenerator] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowGenerator(true)}
        className="w-full text-center py-2 border border-[#D32F2F] text-[#D32F2F] text-sm hover:bg-[#D32F2F] hover:text-white transition-colors"
      >
        Download with Watermark
      </button>

      {showGenerator && (
        <WatermarkGenerator
          photoId={photoId}
          camera={camera}
          filmStock={filmStock}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </>
  )
}
