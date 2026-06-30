import { useEffect, type ReactNode } from 'react'

interface HelmetProps {
  children?: ReactNode
}

export function Helmet({ children }: HelmetProps) {
  useEffect(() => {
    if (!children) return

    const container = document.createElement('div')
    container.innerHTML = `<head>${childrenToString(children)}</head>`
    const elements = Array.from(container.querySelectorAll('head > *'))

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

function childrenToString(children: ReactNode): string {
  if (children == null) return ''
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(childrenToString).join('')
  return ''
}

export function HelmetProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
