import { useState, useMemo, useEffect } from 'react'
import type { Pokemon } from '../types'
import { renderTypeBadge } from '../utils/render'
import {
  getPokemonIconFrame,
  getAtlasSpriteStyle,
  DEFAULT_ICON_SOURCE_SIZE,
  type TextureAtlas,
} from '../utils/atlas'
import { MATCHUP_TYPE_ORDER, typeNames } from '../typeMatchups'
import Modal from '../components/Modal'

const MAX_VISIBLE_RESULTS = 72

interface PokemonPickerModalProps {
  open: boolean
  pokemons: Pokemon[]
  iconAtlases: Record<string, TextureAtlas>
  selectedSpeciesIds: string[]
  slotIndex: number | null
  onSelect: (speciesId: string) => void
  onClose: () => void
}

export default function PokemonPickerModal({
  open,
  pokemons,
  iconAtlases,
  selectedSpeciesIds,
  slotIndex,
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
    return MATCHUP_TYPE_ORDER.filter(type => types.has(type))
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

  const visiblePokemon = filtered.slice(0, MAX_VISIBLE_RESULTS)
  const selectedSpecies = new Set(selectedSpeciesIds)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={slotIndex === null ? '选择精灵' : `选择第 ${slotIndex + 1} 位精灵`}
      size="picker"
    >
      <div className="picker-filters">
        <input
          type="text"
          placeholder="搜索名称、英文名或图鉴编号"
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
        <div className="picker-result-summary">
          <span>匹配 {filtered.length} 只精灵</span>
          {filtered.length > MAX_VISIBLE_RESULTS && (
            <span>当前仅显示前 {MAX_VISIBLE_RESULTS} 只，请继续搜索或筛选</span>
          )}
        </div>
        <div className="picker-grid">
          {visiblePokemon.map((pokemon) => {
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
              <button
                key={pokemon.id}
                type="button"
                className="picker-card"
                onClick={() => onSelect(pokemon.id)}
                aria-label={`选择${pokemon.nameZh}${selectedSpecies.has(pokemon.id) ? '，该精灵已在队中' : ''}`}
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
                  <div className="picker-name-row">
                    <div className="picker-name">{pokemon.nameZh}</div>
                    {selectedSpecies.has(pokemon.id) && <span className="picker-in-team">已在队中</span>}
                  </div>
                  <div className="picker-types">
                    {renderTypeBadge(pokemon.type1)}
                    {renderTypeBadge(pokemon.type2)}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        {filtered.length === 0 && (
          <div className="picker-empty">没有匹配的精灵，试试更短的关键词或切换属性筛选。</div>
        )}
      </div>
    </Modal>
  )
}
