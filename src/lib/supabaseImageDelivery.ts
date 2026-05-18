/**
 * Supabase Storage image delivery helpers.
 *
 * Responsive WebP variants use the Storage Image Transformation API
 * (`/storage/v1/render/image/public/...`). Enable only when your project
 * has image transformations available (Supabase Pro and above), by setting:
 *   VITE_SUPABASE_IMAGE_TRANSFORM=true
 */

const OBJECT_PUBLIC = '/storage/v1/object/public/'
const RENDER_IMAGE_PUBLIC = '/storage/v1/render/image/public/'

export function isSupabaseStoragePublicObjectUrl(url: string): boolean {
  const u = url.trim()
  return u.length > 0 && u.includes('.supabase.co') && u.includes(OBJECT_PUBLIC)
}

export function supabaseRenderedImageUrl(
  publicObjectUrl: string,
  options: { width: number; quality?: number; format?: 'webp' | 'origin' },
): string {
  const trimmed = publicObjectUrl.trim()
  const [base] = trimmed.split(/[?#]/, 1)
  if (!base.includes(OBJECT_PUBLIC)) return trimmed
  const renderBase = base.replace(OBJECT_PUBLIC, RENDER_IMAGE_PUBLIC)
  const q = new URLSearchParams()
  q.set('width', String(options.width))
  if (options.quality != null) q.set('quality', String(options.quality))
  if (options.format) q.set('format', options.format)
  return `${renderBase}?${q.toString()}`
}

export type HeroImageDelivery = {
  src: string
  srcSet?: string
  sizes: string
}

export function buildSupabaseHeroResponsiveImage(originalUrl: string): HeroImageDelivery {
  const sizes = '100vw'
  const trimmed = originalUrl.trim()
  const useTransform = import.meta.env.VITE_SUPABASE_IMAGE_TRANSFORM === 'true'
  if (!useTransform || !isSupabaseStoragePublicObjectUrl(trimmed)) {
    return { src: trimmed, sizes }
  }
  const widths = [640, 960, 1280, 1920] as const
  const quality = 78
  const srcSet = widths
    .map((w) => `${supabaseRenderedImageUrl(trimmed, { width: w, quality, format: 'webp' })} ${w}w`)
    .join(', ')
  const src = supabaseRenderedImageUrl(trimmed, { width: 1920, quality, format: 'webp' })
  return { src, srcSet, sizes }
}
