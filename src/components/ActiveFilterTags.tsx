export interface ActiveFilterItem {
  key: string
  label: string
  value: string
  display: string
  onClear: () => void
}

export function ActiveFilterTags({ filters }: { filters: ActiveFilterItem[] }) {
  const active = filters.filter(f => f.value)
  if (active.length === 0) return null
  return (
    <div className="active-filter-tags">
      {active.map(f => (
        <span
          key={f.key}
          className="active-filter-tag"
          title={`${f.label}: ${f.display}`}
        >
          <span className="active-filter-tag-label">{f.label}</span>
          <span className="active-filter-tag-value">{f.display}</span>
          <button
            className="active-filter-tag-clear"
            onClick={f.onClear}
            title="删除此筛选"
          >×</button>
        </span>
      ))}
    </div>
  )
}
