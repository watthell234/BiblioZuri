import { useEffect, useState } from 'react'
import { backend } from './library'

/** Resolves a stored photo path to a displayable URL (public URL or local blob URL). */
export function usePhotoUrl(path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (!path) {
      setUrl(null)
      return
    }
    void backend.urlFor(path).then((resolved) => {
      if (active) setUrl(resolved || null)
    })
    return () => {
      active = false
    }
  }, [path])

  return url
}
