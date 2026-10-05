import { useEffect, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

interface HelmetProps {
  children?: ReactNode
}

export function Helmet({ children }: HelmetProps) {
  useEffect(() => {
    if (!children) return

    const container = document.createElement('div')
    container.innerHTML = renderToStaticMarkup(<>{children}</>)
    const elements = Array.from(container.children)

    const applied: HTMLElement[] = []
    elements.forEach(el => {
      const tag = el.tagName.toLowerCase()
      if (tag === 'title') {
        document.title = el.textContent || document.title
        return
      }
      const cloned = document.createElement(tag)
      Array.from(el.attributes).forEach(attr => {
        cloned.setAttribute(attr.name, attr.value)
      })
      cloned.textContent = el.textContent
      document.head.appendChild(cloned)
      applied.push(cloned)
    })

    return () => {
      applied.forEach(el => el.remove())
    }
  }, [children])

  return null
}

export function HelmetProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
