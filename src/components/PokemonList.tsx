import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BiomeFilter, SelectFilter, type SelectOption } from './filterControls'
import { ActiveFilterTags } from './ActiveFilterTags'
import { typeNames } from '../typeMatchups'
import { buildTextureAtlas, getPokemonIconFrame, type TextureAtlas } from '../utils/atlas'
import { useLazyImage } from '../hooks/useLazyImage'
import { usePokemonList } from '../hooks/usePokemonList'
import PokemonTable from './PokemonTable'
import type { Pokemon } from '../types'
import '../styles/pokemon.css'

interface RawTextureAtlas {
  textures?: Array<{
    image: string
    size: { w: number; h: number }
    frames: Array<{
      filename: string
      frame: { x: number; y: number; w: number; h: number }
      sourceSize: { w: number; h: number }
      spriteSourceSize: { x: number; y: number; w: number; h: number }
    }>
  }>
}

const REMOTE_ASSET_BASE = 'https://raw.githubusercontent.com/pagefaultgames/pokerogue-assets/beta'

export default function PokemonList() {
  const navigate = useNavigate()
  const {
    pokemons,
    loading,
    filtered,
    filters,
    setters,
    sortBy,
    sortDesc,
    handleSort,
    resetFilters,
    allTypes,
    allGens,
    allBiomes,
    groupedBiomes,
    allRarities,
  } = usePokemonList()

  const [iconAtlases, setIconAtlases] = useState<Record<string, TextureAtlas>>({})
  const [fallbackIconAtlases, setFallbackIconAtlases] = useState<Record<string, TextureAtlas>>({})

  function handleRowClick(pokemon: Pokemon) {
    navigate(`/pokemon/${pokemon.id}`)
  }

  useEffect(() => {
    fetch('/data/name-maps.json')
      .then(r => r.json())
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (pokemons.length === 0) return
    const generations = Array.from(new Set(pokemons.map(p => p.generation))).sort((a, b) => a - b)
    if (generations.length === 0) return

    let cancelled = false
    Promise.all(
      generations.map(async generation => {
        const atlasKey = `pokemon_icons_${generation}`
        const response = await fetch(`${REMOTE_ASSET_BASE}/images/${atlasKey}.json`)
        if (!response.ok) return null
        const raw = await response.json() as RawTextureAtlas
        const atlas = buildTextureAtlas(raw, `${REMOTE_ASSET_BASE}/images`)
        return atlas ? [atlasKey, atlas] as const : null
      })
    )
      .then(entries => {
        if (cancelled) return
        const next = Object.fromEntries(entries.filter(Boolean) as Array<readonly [string, TextureAtlas]>)
        setIconAtlases(next)
      })
      .catch(err => console.error('Failed to load remote icon atlases:', err))

    return () => { cancelled = true }
  }, [pokemons])

  useEffect(() => {
    if (Object.keys(iconAtlases).length === 0 || pokemons.length === 0) return

    const missing = pokemons.filter(p => {
      const result = getPokemonIconFrame(p.numericId, p.generation, iconAtlases)
      return !result.frame
    })

    if (missing.length === 0) return

    let cancelled = false
    Promise.all(
      missing.map(async p => {
        try {
          const response = await fetch(`${REMOTE_ASSET_BASE}/images/pokemon/${p.numericId}.json`)
          if (!response.ok) return null
          const raw = await response.json() as RawTextureAtlas
          const atlas = buildTextureAtlas(raw, `${REMOTE_ASSET_BASE}/images/pokemon`)
          return atlas ? [String(p.numericId), atlas] as const : null
        } catch {
          return null
        }
      })
    )
      .then(entries => {
        if (cancelled) return
        const fb = Object.fromEntries(entries.filter(Boolean) as Array<readonly [string, TextureAtlas]>)
        if (Object.keys(fb).length > 0) {
          setFallbackIconAtlases(prev => ({ ...prev, ...fb }))
        }
      })

    return () => { cancelled = true }
  }, [iconAtlases, pokemons])

  const { containerRef, register } = useLazyImage()

  const typeFilterOptions = useMemo<SelectOption[]>(() => [
    { value: '', label: '全部属性' },
    ...allTypes.map(type => ({ value: type, label: typeNames[type as keyof typeof typeNames] || type })),
  ], [allTypes])

  const genFilterOptions = useMemo<SelectOption[]>(() => [
    { value: '', label: '全部世代' },
    ...allGens.map(gen => ({ value: String(gen), label: `第 ${gen} 世代` })),
  ], [allGens])

  const rarityFilterOptions = useMemo<SelectOption[]>(() => [
    { value: '', label: '全部稀有度' },
    ...allRarities.map(rarity => ({ value: rarity, label: rarity })),
  ], [allRarities])

  const passiveFilterOptions = useMemo<SelectOption[]>(() => [
    { value: '', label: '被动不限' }, { value: 'yes', label: '有被动' }, { value: 'no', label: '无被动' },
  ], [])

  const eggMoveFilterOptions = useMemo<SelectOption[]>(() => [
    { value: '', label: '蛋招不限' }, { value: 'yes', label: '有蛋招' }, { value: 'no', label: '无蛋招' },
  ], [])

  const hiddenAbilityFilterOptions = useMemo<SelectOption[]>(() => [
    { value: '', label: '隐藏特性不限' }, { value: 'yes', label: '有隐藏特性' }, { value: 'no', label: '无隐藏特性' },
  ], [])

  const finalEvolutionFilterOptions = useMemo<SelectOption[]>(() => [
    { value: '', label: '最终形态不限' }, { value: 'yes', label: '仅最终形态' }, { value: 'no', label: '排除最终形态' },
  ], [])

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div className="pokemon-list" ref={containerRef}>
      <div className="filters advanced-filters">
        <input
          type="text"
          placeholder="搜索中文名、英文名、枚举ID或数字ID..."
          value={filters.search}
          onChange={e => setters.setSearch(e.target.value)}
          className="search-input"
        />
        <SelectFilter value={filters.typeFilter} options={typeFilterOptions} onChange={setters.setTypeFilter} label="属性筛选" emptyLabel="全部属性" />
        <SelectFilter value={filters.genFilter} options={genFilterOptions} onChange={setters.setGenFilter} label="世代筛选" emptyLabel="全部世代" />
        <BiomeFilter value={filters.biomeFilter} groups={groupedBiomes} allBiomes={allBiomes} onChange={setters.setBiomeFilter} label="地区筛选" emptyLabel="全部地区" />
        <SelectFilter value={filters.rarityFilter} options={rarityFilterOptions} onChange={setters.setRarityFilter} label="地区稀有度筛选" emptyLabel="全部稀有度" />
        <SelectFilter value={filters.hasPassiveFilter} options={passiveFilterOptions} onChange={setters.setHasPassiveFilter} label="被动筛选" emptyLabel="被动不限" />
        <SelectFilter value={filters.hasEggMoveFilter} options={eggMoveFilterOptions} onChange={setters.setHasEggMoveFilter} label="蛋招筛选" emptyLabel="蛋招不限" />
        <SelectFilter value={filters.hasHiddenAbilityFilter} options={hiddenAbilityFilterOptions} onChange={setters.setHasHiddenAbilityFilter} label="隐藏特性筛选" emptyLabel="隐藏特性不限" />
        <SelectFilter value={filters.finalEvolutionFilter} options={finalEvolutionFilterOptions} onChange={setters.setFinalEvolutionFilter} label="最终形态筛选" emptyLabel="最终形态不限" />
        <input className="range-input" type="number" min="0" placeholder="费用≥" value={filters.costMin} onChange={e => setters.setCostMin(e.target.value)} />
        <input className="range-input" type="number" min="0" placeholder="费用≤" value={filters.costMax} onChange={e => setters.setCostMax(e.target.value)} />
        <input className="range-input" type="number" min="0" placeholder="总和≥" value={filters.totalMin} onChange={e => setters.setTotalMin(e.target.value)} />
        <input className="range-input" type="number" min="0" placeholder="总和≤" value={filters.totalMax} onChange={e => setters.setTotalMax(e.target.value)} />
        <button className="reset-btn" onClick={resetFilters}>重置筛选</button>
        <ActiveFilterTags
          filters={[
            { key: 'type', label: '属性', value: filters.typeFilter, display: filters.typeFilter ? (typeNames[filters.typeFilter as keyof typeof typeNames] || filters.typeFilter) : '', onClear: () => setters.setTypeFilter('') },
            { key: 'gen', label: '世代', value: filters.genFilter, display: filters.genFilter ? `第 ${filters.genFilter} 世代` : '', onClear: () => setters.setGenFilter('') },
            { key: 'biome', label: '地区', value: filters.biomeFilter, display: filters.biomeFilter ? (allBiomes.find(b => b[0] === filters.biomeFilter)?.[1] || filters.biomeFilter) : '', onClear: () => setters.setBiomeFilter('') },
            { key: 'rarity', label: '稀有度', value: filters.rarityFilter, display: filters.rarityFilter || '', onClear: () => setters.setRarityFilter('') },
            { key: 'passive', label: '被动', value: filters.hasPassiveFilter, display: filters.hasPassiveFilter === 'yes' ? '有被动' : filters.hasPassiveFilter === 'no' ? '无被动' : '', onClear: () => setters.setHasPassiveFilter('') },
            { key: 'egg', label: '蛋招', value: filters.hasEggMoveFilter, display: filters.hasEggMoveFilter === 'yes' ? '有蛋招' : filters.hasEggMoveFilter === 'no' ? '无蛋招' : '', onClear: () => setters.setHasEggMoveFilter('') },
            { key: 'hidden', label: '隐藏特性', value: filters.hasHiddenAbilityFilter, display: filters.hasHiddenAbilityFilter === 'yes' ? '有隐藏特性' : filters.hasHiddenAbilityFilter === 'no' ? '无隐藏特性' : '', onClear: () => setters.setHasHiddenAbilityFilter('') },
            { key: 'final', label: '最终形态', value: filters.finalEvolutionFilter, display: filters.finalEvolutionFilter === 'yes' ? '仅最终形态' : filters.finalEvolutionFilter === 'no' ? '排除最终形态' : '', onClear: () => setters.setFinalEvolutionFilter('') },
            { key: 'cost', label: '费用', value: filters.costMin || filters.costMax, display: (filters.costMin || filters.costMax) ? `费用 ${filters.costMin || '0'}~${filters.costMax || '∞'}` : '', onClear: () => { setters.setCostMin(''); setters.setCostMax('') } },
            { key: 'total', label: '总和', value: filters.totalMin || filters.totalMax, display: (filters.totalMin || filters.totalMax) ? `总和 ${filters.totalMin || '0'}~${filters.totalMax || '∞'}` : '', onClear: () => { setters.setTotalMin(''); setters.setTotalMax('') } },
          ]}
        />
        <span className="result-count">共 {filtered.length} 只</span>
      </div>

      <PokemonTable
        pokemons={filtered}
        iconAtlases={iconAtlases}
        fallbackIconAtlases={fallbackIconAtlases}
        sortBy={sortBy}
        sortDesc={sortDesc}
        onSort={handleSort}
        onRowClick={handleRowClick}
        registerLazyImage={register}
      />
    </div>
  )
}
