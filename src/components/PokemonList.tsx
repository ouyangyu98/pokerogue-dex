import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BiomeFilter, SelectFilter, AbilityFilter, MoveFilter, type SelectOption } from './filterControls'
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
    allAbilities,
    allMoves,
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
        const response = await fetch(`${REMOTE_ASSET_BASE}/images/${atlasKey}.json`, { cache: 'no-cache' })
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
          const response = await fetch(`${REMOTE_ASSET_BASE}/images/pokemon/${p.numericId}.json`, { cache: 'no-cache' })
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
          placeholder="搜索中文名、英文名、形态名、枚举ID或数字ID..."
          value={filters.search}
          onChange={e => setters.setSearch(e.target.value)}
          className="search-input"
        />
        <SelectFilter value={filters.typeFilter} options={typeFilterOptions} onChange={setters.setTypeFilter} label="属性筛选" emptyLabel="全部属性" />
        <SelectFilter value={filters.genFilter} options={genFilterOptions} onChange={setters.setGenFilter} label="世代筛选" emptyLabel="全部世代" />
        <BiomeFilter value={filters.biomeFilter} groups={groupedBiomes} allBiomes={allBiomes} onChange={setters.setBiomeFilter} label="地区筛选" emptyLabel="全部地区" />
        <SelectFilter value={filters.rarityFilter} options={rarityFilterOptions} onChange={setters.setRarityFilter} label="地区稀有度筛选" emptyLabel="全部稀有度" />
        <AbilityFilter value={filters.abilityFilter} options={allAbilities} onChange={setters.setAbilityFilter} label="特性/被动筛选" emptyLabel="全部特性/被动" />
        <MoveFilter value={filters.moveFilter} options={allMoves} onChange={setters.setMoveFilter} label="技能筛选" emptyLabel="全部技能" placeholder="输入技能名称..." kindLabel="技能" />
        <SelectFilter value={filters.hasPassiveFilter} options={passiveFilterOptions} onChange={setters.setHasPassiveFilter} label="被动筛选" emptyLabel="被动不限" />
        <SelectFilter value={filters.hasEggMoveFilter} options={eggMoveFilterOptions} onChange={setters.setHasEggMoveFilter} label="蛋招筛选" emptyLabel="蛋招不限" />
        <SelectFilter value={filters.hasHiddenAbilityFilter} options={hiddenAbilityFilterOptions} onChange={setters.setHasHiddenAbilityFilter} label="隐藏特性筛选" emptyLabel="隐藏特性不限" />
        <SelectFilter value={filters.finalEvolutionFilter} options={finalEvolutionFilterOptions} onChange={setters.setFinalEvolutionFilter} label="最终形态筛选" emptyLabel="最终形态不限" />
        <input className="range-input" type="number" min="0" placeholder="费用≥" value={filters.costMin} onChange={e => setters.setCostMin(e.target.value)} />
        <input className="range-input" type="number" min="0" placeholder="费用≤" value={filters.costMax} onChange={e => setters.setCostMax(e.target.value)} />
        <input className="range-input" type="number" min="0" placeholder="总和≥" value={filters.totalMin} onChange={e => setters.setTotalMin(e.target.value)} />
        <input className="range-input" type="number" min="0" placeholder="总和≤" value={filters.totalMax} onChange={e => setters.setTotalMax(e.target.value)} />
        <div className="stat-filters-row">
          <input className="range-input" type="number" min="0" placeholder="HP≥" value={filters.hpMin} onChange={e => setters.setHpMin(e.target.value)} />
          <input className="range-input" type="number" min="0" placeholder="HP≤" value={filters.hpMax} onChange={e => setters.setHpMax(e.target.value)} />
          <input className="range-input" type="number" min="0" placeholder="攻击≥" value={filters.atkMin} onChange={e => setters.setAtkMin(e.target.value)} />
          <input className="range-input" type="number" min="0" placeholder="攻击≤" value={filters.atkMax} onChange={e => setters.setAtkMax(e.target.value)} />
          <input className="range-input" type="number" min="0" placeholder="防御≥" value={filters.defMin} onChange={e => setters.setDefMin(e.target.value)} />
          <input className="range-input" type="number" min="0" placeholder="防御≤" value={filters.defMax} onChange={e => setters.setDefMax(e.target.value)} />
          <input className="range-input" type="number" min="0" placeholder="特攻≥" value={filters.spatkMin} onChange={e => setters.setSpatkMin(e.target.value)} />
          <input className="range-input" type="number" min="0" placeholder="特攻≤" value={filters.spatkMax} onChange={e => setters.setSpatkMax(e.target.value)} />
          <input className="range-input" type="number" min="0" placeholder="特防≥" value={filters.spdefMin} onChange={e => setters.setSpdefMin(e.target.value)} />
          <input className="range-input" type="number" min="0" placeholder="特防≤" value={filters.spdefMax} onChange={e => setters.setSpdefMax(e.target.value)} />
          <input className="range-input" type="number" min="0" placeholder="速度≥" value={filters.spdMin} onChange={e => setters.setSpdMin(e.target.value)} />
          <input className="range-input" type="number" min="0" placeholder="速度≤" value={filters.spdMax} onChange={e => setters.setSpdMax(e.target.value)} />
        </div>
        <button className="reset-btn" onClick={resetFilters}>重置筛选</button>
        <ActiveFilterTags
          filters={[
            { key: 'type', label: '属性', value: filters.typeFilter, display: filters.typeFilter ? (typeNames[filters.typeFilter as keyof typeof typeNames] || filters.typeFilter) : '', onClear: () => setters.setTypeFilter('') },
            { key: 'gen', label: '世代', value: filters.genFilter, display: filters.genFilter ? `第 ${filters.genFilter} 世代` : '', onClear: () => setters.setGenFilter('') },
            { key: 'biome', label: '地区', value: filters.biomeFilter, display: filters.biomeFilter ? (allBiomes.find(b => b[0] === filters.biomeFilter)?.[1] || filters.biomeFilter) : '', onClear: () => setters.setBiomeFilter('') },
            { key: 'rarity', label: '稀有度', value: filters.rarityFilter, display: filters.rarityFilter || '', onClear: () => setters.setRarityFilter('') },
            { key: 'ability', label: '特性/被动', value: filters.abilityFilter, display: filters.abilityFilter ? (allAbilities.find(a => a.value === filters.abilityFilter)?.label || filters.abilityFilter) : '', onClear: () => setters.setAbilityFilter('') },
            { key: 'move', label: '技能', value: filters.moveFilter, display: filters.moveFilter ? (allMoves.find(m => m.value === filters.moveFilter)?.label || filters.moveFilter) : '', onClear: () => setters.setMoveFilter('') },
            { key: 'passive', label: '被动', value: filters.hasPassiveFilter, display: filters.hasPassiveFilter === 'yes' ? '有被动' : filters.hasPassiveFilter === 'no' ? '无被动' : '', onClear: () => setters.setHasPassiveFilter('') },
            { key: 'egg', label: '蛋招', value: filters.hasEggMoveFilter, display: filters.hasEggMoveFilter === 'yes' ? '有蛋招' : filters.hasEggMoveFilter === 'no' ? '无蛋招' : '', onClear: () => setters.setHasEggMoveFilter('') },
            { key: 'hidden', label: '隐藏特性', value: filters.hasHiddenAbilityFilter, display: filters.hasHiddenAbilityFilter === 'yes' ? '有隐藏特性' : filters.hasHiddenAbilityFilter === 'no' ? '无隐藏特性' : '', onClear: () => setters.setHasHiddenAbilityFilter('') },
            { key: 'final', label: '最终形态', value: filters.finalEvolutionFilter, display: filters.finalEvolutionFilter === 'yes' ? '仅最终形态' : filters.finalEvolutionFilter === 'no' ? '排除最终形态' : '', onClear: () => setters.setFinalEvolutionFilter('') },
            { key: 'cost', label: '费用', value: filters.costMin || filters.costMax, display: (filters.costMin || filters.costMax) ? `费用 ${filters.costMin || '0'}~${filters.costMax || '∞'}` : '', onClear: () => { setters.setCostMin(''); setters.setCostMax('') } },
            { key: 'total', label: '总和', value: filters.totalMin || filters.totalMax, display: (filters.totalMin || filters.totalMax) ? `总和 ${filters.totalMin || '0'}~${filters.totalMax || '∞'}` : '', onClear: () => { setters.setTotalMin(''); setters.setTotalMax('') } },
            { key: 'hp', label: 'HP', value: filters.hpMin || filters.hpMax, display: (filters.hpMin || filters.hpMax) ? `HP ${filters.hpMin || '0'}~${filters.hpMax || '∞'}` : '', onClear: () => { setters.setHpMin(''); setters.setHpMax('') } },
            { key: 'atk', label: '攻击', value: filters.atkMin || filters.atkMax, display: (filters.atkMin || filters.atkMax) ? `攻击 ${filters.atkMin || '0'}~${filters.atkMax || '∞'}` : '', onClear: () => { setters.setAtkMin(''); setters.setAtkMax('') } },
            { key: 'def', label: '防御', value: filters.defMin || filters.defMax, display: (filters.defMin || filters.defMax) ? `防御 ${filters.defMin || '0'}~${filters.defMax || '∞'}` : '', onClear: () => { setters.setDefMin(''); setters.setDefMax('') } },
            { key: 'spatk', label: '特攻', value: filters.spatkMin || filters.spatkMax, display: (filters.spatkMin || filters.spatkMax) ? `特攻 ${filters.spatkMin || '0'}~${filters.spatkMax || '∞'}` : '', onClear: () => { setters.setSpatkMin(''); setters.setSpatkMax('') } },
            { key: 'spdef', label: '特防', value: filters.spdefMin || filters.spdefMax, display: (filters.spdefMin || filters.spdefMax) ? `特防 ${filters.spdefMin || '0'}~${filters.spdefMax || '∞'}` : '', onClear: () => { setters.setSpdefMin(''); setters.setSpdefMax('') } },
            { key: 'spd', label: '速度', value: filters.spdMin || filters.spdMax, display: (filters.spdMin || filters.spdMax) ? `速度 ${filters.spdMin || '0'}~${filters.spdMax || '∞'}` : '', onClear: () => { setters.setSpdMin(''); setters.setSpdMax('') } },
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
