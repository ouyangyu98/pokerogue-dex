// Render helpers shared across Pokemon detail views
import { typeColors, typeNames } from '../typeMatchups'

export function formatLevel(level: number | string | null) {
  if (level == null) return '-'
  if (level === 'EVOLVE_MOVE') return '进化'
  if (level === 'RELEARN_MOVE') return '回忆'
  return `Lv.${level}`
}

export function renderTypeBadge(type: string | null) {
  if (!type) return null
  const badgeType = type as keyof typeof typeNames
  return (
    <span className="type-badge" style={{ backgroundColor: typeColors[badgeType] || '#888' }}>
      {typeNames[badgeType] || type}
    </span>
  )
}

export function formatMoveCategory(category: string | null) {
  if (category === 'PHYSICAL') return '物理'
  if (category === 'SPECIAL') return '特殊'
  return '—'
}

export function renderMoveCategoryBadge(category: string | null) {
  const label = formatMoveCategory(category)
  let className = 'move-category-badge '
  if (category === 'PHYSICAL') className += 'move-category-physical'
  else if (category === 'SPECIAL') className += 'move-category-special'
  else className += 'move-category-status'
  return <span className={className}>{label}</span>
}

export function renderStatBar(label: string, value: number, color: string, max = 255) {
  return (
    <div className="stat-bar">
      <label>{label}</label>
      <div className="bar">
        <div className="fill" style={{ width: `${Math.min((value / max) * 100, 100)}%`, backgroundColor: color }} />
      </div>
      <span>{value}</span>
    </div>
  )
}
