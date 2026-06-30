// IntersectionObserver-based lazy image loading hook
import { useEffect, useRef, useState } from 'react'

export function useLazyImage() {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    observerRef.current = new IntersectionObserver(
      (entries) => {
        setVisibleIds(prev => {
          const next = new Set(prev)
          for (const entry of entries) {
            const id = entry.target.getAttribute('data-lazy-id')
            if (id && entry.isIntersecting) {
              next.add(id)
            }
          }
          return next
        })
      },
      { root: containerRef.current, rootMargin: '100px', threshold: 0 },
    )
    return () => observerRef.current?.disconnect()
  }, [])

  const register = (el: HTMLElement | null, id: string) => {
    if (el && observerRef.current) {
      el.setAttribute('data-lazy-id', id)
      observerRef.current.observe(el)
    }
  }

  return { containerRef, register, visibleIds }
}
