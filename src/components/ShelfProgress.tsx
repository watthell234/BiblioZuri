type Props = {
  read: number
  total: number
  accent: string
}

/** The canopy lamp hanging over each tree, glowing brighter as books get read. */
export default function ShelfProgress({ read, total, accent }: Props) {
  const ratio = total === 0 ? 0 : read / total
  const complete = total > 0 && read === total

  return (
    <div className={`lamp ${complete ? 'lamp--complete' : ''}`} style={{ ['--accent' as string]: accent }}>
      <span className="lamp__cord" aria-hidden="true" />
      <div className="lamp__shade">
        <span className="lamp__glow" style={{ opacity: 0.25 + ratio * 0.75 }} aria-hidden="true" />
        <span className="lamp__count">
          {total === 0 ? 'Empty shelf' : `${read} of ${total} read`}
        </span>
      </div>
      <div className="lamp__meter" aria-hidden="true">
        <span className="lamp__meter-fill" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  )
}
