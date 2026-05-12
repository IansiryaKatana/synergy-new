import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Production build: split vendor chunks so the initial JS payload is smaller
// and frequently changing app code does not invalidate big vendor caches.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssTarget: 'chrome87',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1200,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'vendor-react'
          if (id.includes('gsap')) return 'vendor-gsap'
          if (id.includes('@tiptap') || id.includes('prosemirror')) return 'vendor-tiptap'
          if (id.includes('react-phone-input-2') || id.includes('country-state-city') || id.includes('react-select-country-list') || id.includes('react-select')) {
            return 'vendor-forms'
          }
          if (id.includes('lucide-react')) return 'vendor-icons'
          if (id.includes('noisejs')) return 'vendor-noise'
          if (id.includes('framer-motion')) return 'vendor-motion'
          return 'vendor'
        },
      },
    },
  },
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
})
