import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

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

export interface AbilityFilterProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  label?: string
  emptyLabel?: string
}

export interface MoveFilterProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  label?: string
  emptyLabel?: string
  placeholder?: string
  kindLabel?: string
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

export function AbilityFilter({ value, options, onChange, label = '特性/被动筛选', emptyLabel = '全部特性/被动' }: AbilityFilterProps) {
  return (
    <SearchableFilter
      value={value}
      options={options}
      onChange={onChange}
      label={label}
      emptyLabel={emptyLabel}
      placeholder="输入特性或被动名称..."
      emptyText="未找到匹配的特性/被动"
      dropdownClassName="ability-filter-dropdown"
      triggerClassName="ability-filter-trigger"
      menuClassName="ability-filter-menu"
      inputClassName="ability-filter-input"
    />
  )
}

export function MoveFilter({ value, options, onChange, label = '技能筛选', emptyLabel = '全部技能', placeholder = '输入技能名称...', kindLabel = '技能' }: MoveFilterProps) {
  return (
    <SearchableFilter
      value={value}
      options={options}
      onChange={onChange}
      label={label}
      emptyLabel={emptyLabel}
      placeholder={placeholder}
      emptyText={`未找到匹配的${kindLabel}`}
      dropdownClassName="move-filter-dropdown"
      triggerClassName="move-filter-trigger"
      menuClassName="move-filter-menu"
      inputClassName="move-filter-input"
    />
  )
}

interface SearchableFilterProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  label: string
  emptyLabel: string
  placeholder: string
  emptyText: string
  dropdownClassName: string
  triggerClassName: string
  menuClassName: string
  inputClassName: string
}

function SearchableFilter({
  value,
  options,
  onChange,
  label,
  emptyLabel,
  placeholder,
  emptyText,
  dropdownClassName,
  triggerClassName,
  menuClassName,
  inputClassName,
}: SearchableFilterProps) {
  const { open, setOpen, rootRef } = useDropdownOpenState()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedLabel = useMemo(() => {
    if (!value) return ''
    return options.find(o => o.value === value)?.label || value
  }, [value, options])

  const filteredOptions = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return options
    return options.filter(o => o.label.toLowerCase().includes(keyword) || o.value.toLowerCase().includes(keyword))
  }, [options, query])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  function handleSelect(nextValue: string) {
    onChange(nextValue)
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    onChange('')
    setQuery('')
  }

  return (
    <div className={`${dropdownClassName} filter-dropdown`} ref={rootRef}>
      <button
        type="button"
        className={`filter-trigger ${triggerClassName} ${open ? 'is-open' : ''} ${value ? 'has-value' : ''}`}
        onClick={() => setOpen(current => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
      >
        <span className="searchable-filter-trigger-text">
          {selectedLabel || emptyLabel}
        </span>
        {value ? (
          <span
            className="searchable-filter-trigger-clear"
            onClick={e => {
              e.stopPropagation()
              handleClear()
            }}
            role="button"
            aria-label="清除"
          >
            ×
          </span>
        ) : (
          <span className="filter-trigger-arrow">▾</span>
        )}
      </button>
      {open && (
        <div className={`${menuClassName} searchable-filter-menu`} role="listbox" aria-label={label}>
          <div className="searchable-filter-search">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={placeholder}
              className={`${inputClassName} searchable-filter-input`}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setOpen(false)
                } else if (e.key === 'Enter' && filteredOptions.length > 0) {
                  handleSelect(filteredOptions[0].value)
                }
              }}
            />
          </div>
          <div className="searchable-filter-options">
            <button
              type="button"
              className={`filter-option ${!value ? 'is-selected' : ''}`}
              onClick={() => handleSelect('')}
            >
              <span>{emptyLabel}</span>
            </button>
            {filteredOptions.map(option => (
              <button
                key={option.value}
                type="button"
                className={`filter-option ${value === option.value ? 'is-selected' : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                <span>{option.label}</span>
                {option.meta ? <span className="filter-option-meta">{option.meta}</span> : null}
              </button>
            ))}
            {filteredOptions.length === 0 && query && (
              <div className="searchable-filter-empty">{emptyText}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
