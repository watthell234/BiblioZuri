import { useEffect, useState } from 'react'

const LEAVES = ['🍃', '🌿', '⭐️', '✨', '📗', '🍀']

/** A short burst of leaves and stars when a book is marked read. */
export default function Celebration({ token }: { token: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (token === 0) return
    setVisible(true)
    const timer = window.setTimeout(() => setVisible(false), 1800)
    return () => window.clearTimeout(timer)
  }, [token])

  if (!visible) return null

  return (
    <div className="celebration" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => (
        <span
          key={`${token}-${index}`}
          className="celebration__bit"
          style={{
            ['--angle' as string]: `${(index / 18) * 360}deg`,
            ['--distance' as string]: `${90 + (index % 5) * 34}px`,
            ['--delay' as string]: `${(index % 6) * 40}ms`,
          }}
        >
          {LEAVES[index % LEAVES.length]}
        </span>
      ))}
      <span className="celebration__word">Another one read!</span>
    </div>
  )
}
