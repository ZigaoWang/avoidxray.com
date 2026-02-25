import { decode } from 'blurhash'

/**
 * Converts a blurhash string to a base64 data URL for use as a placeholder.
 * Uses a small canvas-like approach that works on both server and client.
 */
export function blurHashToDataURL(blurHash: string | null | undefined, width = 32, height = 32): string | undefined {
  if (!blurHash) return undefined

  try {
    const pixels = decode(blurHash, width, height)

    // Create BMP format (simpler than PNG, no compression needed)
    const bmp = createBmpDataUrl(pixels, width, height)
    return bmp
  } catch {
    return undefined
  }
}

function createBmpDataUrl(pixels: Uint8ClampedArray, width: number, height: number): string {
  const rowSize = Math.ceil((width * 3) / 4) * 4 // BMP rows are 4-byte aligned
  const pixelDataSize = rowSize * height
  const fileSize = 54 + pixelDataSize // Header (54 bytes) + pixel data

  const buffer = new Uint8Array(fileSize)
  const view = new DataView(buffer.buffer)

  // BMP Header
  buffer[0] = 0x42 // 'B'
  buffer[1] = 0x4D // 'M'
  view.setUint32(2, fileSize, true) // File size
  view.setUint32(10, 54, true) // Pixel data offset

  // DIB Header
  view.setUint32(14, 40, true) // DIB header size
  view.setInt32(18, width, true) // Width
  view.setInt32(22, -height, true) // Height (negative = top-down)
  view.setUint16(26, 1, true) // Color planes
  view.setUint16(28, 24, true) // Bits per pixel
  view.setUint32(30, 0, true) // No compression
  view.setUint32(34, pixelDataSize, true) // Image size

  // Pixel data (BGR format, top to bottom)
  let offset = 54
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      buffer[offset++] = pixels[idx + 2] // B
      buffer[offset++] = pixels[idx + 1] // G
      buffer[offset++] = pixels[idx]     // R
    }
    // Padding to 4-byte boundary
    while (offset % 4 !== 54 % 4 && offset < 54 + (y + 1) * rowSize) {
      buffer[offset++] = 0
    }
    offset = 54 + (y + 1) * rowSize
  }

  // Convert to base64
  let binary = ''
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i])
  }

  return `data:image/bmp;base64,${btoa(binary)}`
}
