import { useEffect, useRef, useState, type CSSProperties } from 'react'

export interface SelectOption {
  value: string
  label: string
  meta?: string
}

export interface SelectFilterProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  label: string
  emptyLabel?: string
  minWidth?: number
}

export interface BiomeGroup {
  step: number
  label: string
  items: Array<[string, string]>
}

export interface BiomeFilterProps {
  value: string
  groups: BiomeGroup[]
  allBiomes: Array<[string, string]>
  onChange: (value: string) => void
  label?: string
  emptyLabel?: string
}

function useDropdownOpenState() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      if (!rootRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return { open, setOpen, rootRef }
}

export function SelectFilter({ value, options, onChange, label, emptyLabel, minWidth = 136 }: SelectFilterProps) {
  const { open, setOpen, rootRef } = useDropdownOpenState()
  const style = { '--filter-trigger-min-width': `${minWidth}px` } as CSSProperties
  const selectedOption = options.find(option => option.value === value) || null
  const triggerLabel = selectedOption?.label || emptyLabel || options[0]?.label || label

  return (
    <div className="filter-dropdown" ref={rootRef} style={style}>
      <button
        type="button"
        className={`filter-trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(current => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
      >
        <span>{triggerLabel}</span>
        <span className="filter-trigger-arrow">▾</span>
      </button>
      {open && (
        <div className="filter-menu" role="listbox" aria-label={label}>
          {options.map(option => (
            <button
              key={option.value || '__empty__'}
              type="button"
              className={`filter-option ${value === option.value ? 'is-selected' : ''}`}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              <span>{option.label}</span>
              {option.meta ? <span className="filter-option-meta">{option.meta}</span> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function BiomeFilter({ value, groups, allBiomes, onChange, label = '地区筛选', emptyLabel = '全部地区' }: BiomeFilterProps) {
  const { open, setOpen, rootRef } = useDropdownOpenState()
  const currentLabel = value ? (allBiomes.find(([id]) => id === value)?.[1] || value) : emptyLabel

  return (
    <div className="biome-filter-dropdown filter-dropdown" ref={rootRef}>
      <button
        type="button"
        className={`filter-trigger biome-filter-trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(current => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
      >
        <span>{currentLabel}</span>
        <span className="filter-trigger-arrow biome-filter-trigger-arrow">▾</span>
      </button>
      {open && (
        <div className="biome-filter-menu" role="listbox" aria-label={label}>
          <div className="biome-filter-menu-sticky">
            <button
              type="button"
              className={`biome-filter-option biome-filter-option-clear ${!value ? 'is-selected' : ''}`}
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
            >
              {emptyLabel}
            </button>
          </div>
          {groups.map(group => (
            <div key={group.label} className="biome-filter-group">
              <div className="biome-filter-group-title">{group.label}</div>
              <div className="biome-filter-group-grid">
                {group.items.map(([id, nameZh]) => (
                  <button
                    key={id}
                    type="button"
                    className={`biome-filter-option ${value === id ? 'is-selected' : ''}`}
                    onClick={() => {
                      onChange(id)
                      setOpen(false)
                    }}
                  >
                    {nameZh}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
