import { useState, useMemo, useEffect } from 'react'
import type { Pokemon } from '../types'
import { renderTypeBadge } from '../utils/render'
import {
  getPokemonIconFrame,
  getAtlasSpriteStyle,
  DEFAULT_ICON_SOURCE_SIZE,
  type TextureAtlas,
} from '../utils/atlas'
import { typeNames } from '../typeMatchups'
import Modal from '../components/Modal'

interface PokemonPickerModalProps {
  open: boolean
  pokemons: Pokemon[]
  iconAtlases: Record<string, TextureAtlas>
  onSelect: (speciesId: string) => void
  onClose: () => void
}

export default function PokemonPickerModal({
  open,
  pokemons,
  iconAtlases,
  onSelect,
  onClose,
}: PokemonPickerModalProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    if (open) {
      setSearch('')
      setTypeFilter('')
    }
  }, [open])

  const allTypes = useMemo(() => {
    const types = new Set<string>()
    pokemons.forEach((p) => {
      if (p.type1) types.add(p.type1)
      if (p.type2) types.add(p.type2)
    })
    return Array.from(types).sort()
  }, [pokemons])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return pokemons.filter((p) => {
      const matchSearch =
        !keyword ||
        p.nameZh.toLowerCase().includes(keyword) ||
        p.nameEn.toLowerCase().includes(keyword) ||
        p.id.toLowerCase().includes(keyword) ||
        String(p.numericId).includes(keyword)
      const matchType =
        !typeFilter || p.type1 === typeFilter || p.type2 === typeFilter
      return matchSearch && matchType
    })
  }, [pokemons, search, typeFilter])

  return (
    <Modal open={open} onClose={onClose} title="选择精灵" size="picker">
      <div className="picker-filters">
        <input
          type="text"
          placeholder="搜索精灵名称、ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="picker-search"
          autoFocus
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="picker-type-select"
        >
          <option value="">全部属性</option>
          {allTypes.map((type) => (
            <option key={type} value={type}>
              {typeNames[type as keyof typeof typeNames] || type}
            </option>
          ))}
        </select>
      </div>

      <div className="picker-results">
        <div className="picker-count">共 {filtered.length} 只精灵</div>
        <div className="picker-grid">
          {filtered.map((pokemon) => {
            const { atlas, frame } = getPokemonIconFrame(
              pokemon.numericId,
              pokemon.generation,
              iconAtlases
            )
            const iconStyle =
              atlas && frame
                ? getAtlasSpriteStyle(
                    atlas,
                    frame,
                    DEFAULT_ICON_SOURCE_SIZE,
                    40
                  )
                : null

            return (
              <div
                key={pokemon.id}
                className="picker-card"
                onClick={() => onSelect(pokemon.id)}
              >
                <div className="picker-icon">
                  {iconStyle ? (
                    <div style={iconStyle} />
                  ) : (
                    <div className="picker-icon-placeholder">
                      {pokemon.nameZh[0]}
                    </div>
                  )}
                </div>
                <div className="picker-info">
                  <div className="picker-name">{pokemon.nameZh}</div>
                  <div className="picker-types">
                    {renderTypeBadge(pokemon.type1)}
                    {renderTypeBadge(pokemon.type2)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
