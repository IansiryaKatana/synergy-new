import { useEffect, useMemo, useState } from 'react'

type NoiseProps = {
  patternSize?: number
  patternScaleX?: number
  patternScaleY?: number
  patternRefreshInterval?: number
  patternAlpha?: number
  className?: string
}

function createNoiseDataUrl(size: number, alpha: number) {
  if (typeof document === 'undefined') return ''
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) return ''

  const image = context.createImageData(size, size)
  for (let index = 0; index < image.data.length; index += 4) {
    const value = Math.floor(Math.random() * 255)
    image.data[index] = value
    image.data[index + 1] = value
    image.data[index + 2] = value
    image.data[index + 3] = alpha
  }
  context.putImageData(image, 0, 0)
  return canvas.toDataURL('image/png')
}

export default function Noise({
  patternSize = 250,
  patternScaleX = 2,
  patternScaleY = 2,
  patternRefreshInterval = 2,
  patternAlpha = 15,
  className = '',
}: NoiseProps) {
  const alpha = Math.max(0, Math.min(255, Math.round((patternAlpha / 100) * 255)))
  const [patternUrl, setPatternUrl] = useState('')
  const backgroundSize = useMemo(
    () => `${Math.max(1, patternSize / Math.max(0.1, patternScaleX))}px ${Math.max(1, patternSize / Math.max(0.1, patternScaleY))}px`,
    [patternScaleX, patternScaleY, patternSize],
  )

  useEffect(() => {
    setPatternUrl(createNoiseDataUrl(patternSize, alpha))
    const refreshMs = Math.max(250, Math.round(patternRefreshInterval * 1000))
    const timer = window.setInterval(() => {
      setPatternUrl(createNoiseDataUrl(patternSize, alpha))
    }, refreshMs)
    return () => window.clearInterval(timer)
  }, [alpha, patternRefreshInterval, patternSize])

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        backgroundImage: patternUrl ? `url("${patternUrl}")` : undefined,
        backgroundSize,
      }}
    />
  )
}
