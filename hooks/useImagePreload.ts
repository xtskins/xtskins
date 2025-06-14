import { useEffect } from 'react'

export function useImagePreload(src: string | undefined) {
  useEffect(() => {
    if (!src) return

    // Criar elemento de imagem para preload
    const img = new Image()
    img.src = src

    // Opcional: adicionar no head como preload
    const preloadLink = document.createElement('link')
    preloadLink.rel = 'preload'
    preloadLink.as = 'image'
    preloadLink.href = src

    document.head.appendChild(preloadLink)

    // Cleanup
    return () => {
      try {
        document.head.removeChild(preloadLink)
      } catch {
        // Elemento já foi removido
      }
    }
  }, [src])
}
