import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

// Keep page selections within this tab, separate from shared saved data.
export function useSessionState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const storageKey = `pokerogue-page-v1:${key}`
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = sessionStorage.getItem(storageKey)
      if (raw !== null) {
        return JSON.parse(raw) as T
      }
    } catch {
      // Unavailable storage must not prevent the page from working.
    }
    return initialValue
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // Selection remains usable in memory when browser storage is blocked.
    }
  }, [storageKey, value])

  return [value, setValue]
}
