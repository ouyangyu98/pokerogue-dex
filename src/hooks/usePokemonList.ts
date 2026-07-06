import { useEffect, useMemo, useState } from 'react'
import type { Pokemon } from '../types'
import { rarityOrder, inRange } from '../utils/pokemon'

const FILTER_STORAGE_KEY = 'pokerogue-dex-filters'
const DATA_CACHE_KEY = 'pokerogue-dex-data-cache'
const DATA_CACHE_TTL_MS = 1000 * 60 * 60 * 24 // 24小时

export interface PokemonListFilters {
  search: string
  typeFilter: string
  genFilter: string
  biomeFilter: string
  rarityFilter: string
  abilityFilter: string
  levelMoveFilter: string
  eggMoveFilterValue: string
  hasPassiveFilter: string
  hasEggMoveFilter: string
  hasHiddenAbilityFilter: string
  finalEvolutionFilter: string
  costMin: string
  costMax: string
  totalMin: string
  totalMax: string
  hpMin: string
  hpMax: string
  atkMin: string
  atkMax: string
  defMin: string
  defMax: string
  spatkMin: string
  spatkMax: string
  spdefMin: string
  spdefMax: string
  spdMin: string
  spdMax: string
}

export interface UsePokemonListResult {
  pokemons: Pokemon[]
  loading: boolean
  filtered: Pokemon[]
  filters: PokemonListFilters
  setters: {
    setSearch: (v: string) => void
    setTypeFilter: (v: string) => void
    setGenFilter: (v: string) => void
    setBiomeFilter: (v: string) => void
    setRarityFilter: (v: string) => void
    setAbilityFilter: (v: string) => void
    setLevelMoveFilter: (v: string) => void
    setEggMoveFilterValue: (v: string) => void
    setHasPassiveFilter: (v: string) => void
    setHasEggMoveFilter: (v: string) => void
    setHasHiddenAbilityFilter: (v: string) => void
    setFinalEvolutionFilter: (v: string) => void
    setCostMin: (v: string) => void
    setCostMax: (v: string) => void
    setTotalMin: (v: string) => void
    setTotalMax: (v: string) => void
    setHpMin: (v: string) => void
    setHpMax: (v: string) => void
    setAtkMin: (v: string) => void
    setAtkMax: (v: string) => void
    setDefMin: (v: string) => void
    setDefMax: (v: string) => void
    setSpatkMin: (v: string) => void
    setSpatkMax: (v: string) => void
    setSpdefMin: (v: string) => void
    setSpdefMax: (v: string) => void
    setSpdMin: (v: string) => void
    setSpdMax: (v: string) => void
  }
  sortBy: string
  sortDesc: boolean
  handleSort: (field: string) => void
  resetFilters: () => void
  allTypes: string[]
  allGens: number[]
  allBiomes: Array<[string, string]>
  groupedBiomes: Array<{ step: number; label: string; items: Array<[string, string]> }>
  allRarities: string[]
  allAbilities: Array<{ value: string; label: string; meta?: string }>
  allLevelMoves: Array<{ value: string; label: string; meta?: string }>
  allEggMoves: Array<{ value: string; label: string; meta?: string }>
}

const biomeStepOrder: Record<string, number> = {
  'TOWN': 0,
  'PLAINS': 1,
  'GRASS': 2, 'LAKE': 2, 'METROPOLIS': 2,
  'BEACH': 3, 'CONSTRUCTION_SITE': 3, 'SLUM': 3, 'SWAMP': 3, 'TALL_GRASS': 3,
  'CAVE': 4, 'DOJO': 4, 'FOREST': 4, 'GRAVEYARD': 4, 'ISLAND': 4, 'POWER_PLANT': 4, 'SEA': 4,
  'ABYSS': 5, 'BADLANDS': 5, 'FACTORY': 5, 'ICE_CAVE': 5, 'JUNGLE': 5, 'LABORATORY': 5, 'MEADOW': 5, 'SEABED': 5, 'TEMPLE': 5,
  'DESERT': 6, 'FAIRY_CAVE': 6, 'MOUNTAIN': 6, 'RUINS': 6, 'SNOWY_FOREST': 6, 'SPACE': 6, 'VOLCANO': 6, 'WASTELAND': 6,
  'END': 99,
}

export function usePokemonList(): UsePokemonListResult {
  const [pokemons, setPokemons] = useState<Pokemon[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [genFilter, setGenFilter] = useState('')
  const [biomeFilter, setBiomeFilter] = useState('')
  const [rarityFilter, setRarityFilter] = useState('')
  const [abilityFilter, setAbilityFilter] = useState('')
  const [levelMoveFilter, setLevelMoveFilter] = useState('')
  const [eggMoveFilterValue, setEggMoveFilterValue] = useState('')
  const [hasPassiveFilter, setHasPassiveFilter] = useState('')
  const [hasEggMoveFilter, setHasEggMoveFilter] = useState('')
  const [hasHiddenAbilityFilter, setHasHiddenAbilityFilter] = useState('')
  const [finalEvolutionFilter, setFinalEvolutionFilter] = useState('')
  const [costMin, setCostMin] = useState('')
  const [costMax, setCostMax] = useState('')
  const [totalMin, setTotalMin] = useState('')
  const [totalMax, setTotalMax] = useState('')
  const [hpMin, setHpMin] = useState('')
  const [hpMax, setHpMax] = useState('')
  const [atkMin, setAtkMin] = useState('')
  const [atkMax, setAtkMax] = useState('')
  const [defMin, setDefMin] = useState('')
  const [defMax, setDefMax] = useState('')
  const [spatkMin, setSpatkMin] = useState('')
  const [spatkMax, setSpatkMax] = useState('')
  const [spdefMin, setSpdefMin] = useState('')
  const [spdefMax, setSpdefMax] = useState('')
  const [spdMin, setSpdMin] = useState('')
  const [spdMax, setSpdMax] = useState('')
  const [sortBy, setSortBy] = useState('numericId')
  const [sortDesc, setSortDesc] = useState(false)

  // 筛选器状态持久化
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.search !== undefined) setSearch(parsed.search)
        if (parsed.typeFilter !== undefined) setTypeFilter(parsed.typeFilter)
        if (parsed.genFilter !== undefined) setGenFilter(parsed.genFilter)
        if (parsed.biomeFilter !== undefined) setBiomeFilter(parsed.biomeFilter)
        if (parsed.rarityFilter !== undefined) setRarityFilter(parsed.rarityFilter)
        if (parsed.abilityFilter !== undefined) setAbilityFilter(parsed.abilityFilter)
        if (parsed.levelMoveFilter !== undefined) setLevelMoveFilter(parsed.levelMoveFilter)
        if (parsed.eggMoveFilterValue !== undefined) setEggMoveFilterValue(parsed.eggMoveFilterValue)
        if (parsed.hasPassiveFilter !== undefined) setHasPassiveFilter(parsed.hasPassiveFilter)
        if (parsed.hasEggMoveFilter !== undefined) setHasEggMoveFilter(parsed.hasEggMoveFilter)
        if (parsed.hasHiddenAbilityFilter !== undefined) setHasHiddenAbilityFilter(parsed.hasHiddenAbilityFilter)
        if (parsed.finalEvolutionFilter !== undefined) setFinalEvolutionFilter(parsed.finalEvolutionFilter)
        if (parsed.costMin !== undefined) setCostMin(parsed.costMin)
        if (parsed.costMax !== undefined) setCostMax(parsed.costMax)
        if (parsed.totalMin !== undefined) setTotalMin(parsed.totalMin)
        if (parsed.totalMax !== undefined) setTotalMax(parsed.totalMax)
        if (parsed.hpMin !== undefined) setHpMin(parsed.hpMin)
        if (parsed.hpMax !== undefined) setHpMax(parsed.hpMax)
        if (parsed.atkMin !== undefined) setAtkMin(parsed.atkMin)
        if (parsed.atkMax !== undefined) setAtkMax(parsed.atkMax)
        if (parsed.defMin !== undefined) setDefMin(parsed.defMin)
        if (parsed.defMax !== undefined) setDefMax(parsed.defMax)
        if (parsed.spatkMin !== undefined) setSpatkMin(parsed.spatkMin)
        if (parsed.spatkMax !== undefined) setSpatkMax(parsed.spatkMax)
        if (parsed.spdefMin !== undefined) setSpdefMin(parsed.spdefMin)
        if (parsed.spdefMax !== undefined) setSpdefMax(parsed.spdefMax)
        if (parsed.spdMin !== undefined) setSpdMin(parsed.spdMin)
        if (parsed.spdMax !== undefined) setSpdMax(parsed.spdMax)
        if (parsed.sortBy !== undefined) setSortBy(parsed.sortBy)
        if (parsed.sortDesc !== undefined) setSortDesc(parsed.sortDesc)
      }
    } catch {
      // ignore parse error
    }
  }, [])

  useEffect(() => {
    const state = {
      search, typeFilter, genFilter, biomeFilter, rarityFilter, abilityFilter, levelMoveFilter, eggMoveFilterValue,
      hasPassiveFilter, hasEggMoveFilter, hasHiddenAbilityFilter, finalEvolutionFilter,
      costMin, costMax, totalMin, totalMax,
      hpMin, hpMax, atkMin, atkMax, defMin, defMax,
      spatkMin, spatkMax, spdefMin, spdefMax, spdMin, spdMax,
      sortBy, sortDesc,
    }
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(state))
  }, [search, typeFilter, genFilter, biomeFilter, rarityFilter, abilityFilter, levelMoveFilter, eggMoveFilterValue, hasPassiveFilter, hasEggMoveFilter, hasHiddenAbilityFilter, finalEvolutionFilter, costMin, costMax, totalMin, totalMax, hpMin, hpMax, atkMin, atkMax, defMin, defMax, spatkMin, spatkMax, spdefMin, spdefMax, spdMin, spdMax, sortBy, sortDesc])

  // 数据加载
  useEffect(() => {
    async function loadData() {
      try {
        const cachedRaw = localStorage.getItem(DATA_CACHE_KEY)
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw)
          if (cached.timestamp && Date.now() - cached.timestamp < DATA_CACHE_TTL_MS) {
            setPokemons(cached.pokemons)
            setLoading(false)
            fetch('/data/pokemon.json').then(r => r.json()).then((pokemonData: Pokemon[]) => {
              setPokemons(pokemonData)
              localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({
                pokemons: pokemonData,
                nameMaps: cached.nameMaps,
                timestamp: Date.now(),
              }))
            }).catch(() => {})
            return
          }
        }

        const pokemonData = await fetch('/data/pokemon.json').then(r => r.json())
        setPokemons(pokemonData)
        localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({
          pokemons: pokemonData,
          timestamp: Date.now(),
        }))
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const result = pokemons.filter(p => {
      const matchSearch = !keyword
        || p.nameZh.toLowerCase().includes(keyword)
        || p.nameEn.toLowerCase().includes(keyword)
        || p.id.toLowerCase().includes(keyword)
        || String(p.numericId).includes(keyword)
        || (p.forms || []).some(f => f.formNameZh.toLowerCase().includes(keyword))
      const matchType = !typeFilter || p.type1 === typeFilter || p.type2 === typeFilter
      const matchGen = !genFilter || p.generation === Number(genFilter)
      const matchBiome = !biomeFilter || (p.biomes || []).some(b => b.id === biomeFilter)
      const matchRarity = !rarityFilter || (p.biomeRarities || []).includes(rarityFilter)
      const matchAbility = !abilityFilter || [
        p.ability1,
        p.ability2,
        p.abilityHidden,
        p.passive,
        ...(p.forms || []).flatMap(f => [f.ability1, f.ability2, f.abilityHidden, f.passive]),
      ].some(id => id && id === abilityFilter)
      const matchLevelMove = !levelMoveFilter || (p.levelMoves || []).some(m => m.moveId === levelMoveFilter)
      const matchEggMove = !eggMoveFilterValue || (p.eggMoves || []).some(m => m.moveId === eggMoveFilterValue)
      const matchPassive = !hasPassiveFilter
        || (hasPassiveFilter === 'yes' ? Boolean(p.passive && p.passive !== 'NONE') : !(p.passive && p.passive !== 'NONE'))
      const matchEggMoves = !hasEggMoveFilter
        || (hasEggMoveFilter === 'yes' ? (p.eggMoves || []).length > 0 : (p.eggMoves || []).length === 0)
      const hasHiddenAbility = Boolean(p.abilityHidden && p.abilityHidden !== 'NONE')
      const matchHiddenAbility = !hasHiddenAbilityFilter
        || (hasHiddenAbilityFilter === 'yes' ? hasHiddenAbility : !hasHiddenAbility)
      const isFinalEvolution = p.isFinalEvolution ?? (p.evolutions || []).length === 0
      const matchFinalEvolution = !finalEvolutionFilter
        || (finalEvolutionFilter === 'yes' ? isFinalEvolution : !isFinalEvolution)
      const matchCost = inRange(p.starterCost ?? -1, costMin, costMax)
      const matchTotal = inRange(p.baseTotal, totalMin, totalMax)
      const matchHp = inRange(p.baseHp, hpMin, hpMax)
      const matchAtk = inRange(p.baseAtk, atkMin, atkMax)
      const matchDef = inRange(p.baseDef, defMin, defMax)
      const matchSpatk = inRange(p.baseSpatk, spatkMin, spatkMax)
      const matchSpdef = inRange(p.baseSpdef, spdefMin, spdefMax)
      const matchSpd = inRange(p.baseSpd, spdMin, spdMax)
      return matchSearch && matchType && matchGen && matchBiome && matchRarity
        && matchAbility && matchLevelMove && matchEggMove && matchPassive && matchEggMoves && matchHiddenAbility && matchFinalEvolution
        && matchCost && matchTotal && matchHp && matchAtk && matchDef
        && matchSpatk && matchSpdef && matchSpd
    })

    result.sort((a, b) => {
      if (sortBy === 'primaryBiomeRarity') {
        const va = rarityOrder[a.primaryBiomeRarity || ''] || 0
        const vb = rarityOrder[b.primaryBiomeRarity || ''] || 0
        return sortDesc ? vb - va : va - vb
      }
      const valueA = a[sortBy as keyof Pokemon]
      const valueB = b[sortBy as keyof Pokemon]
      let va: string | number = typeof valueA === 'number' ? valueA : String(valueA ?? '').toLowerCase()
      let vb: string | number = typeof valueB === 'number' ? valueB : String(valueB ?? '').toLowerCase()
      if (va < vb) return sortDesc ? 1 : -1
      if (va > vb) return sortDesc ? -1 : 1
      return 0
    })

    return result
  }, [pokemons, search, typeFilter, genFilter, biomeFilter, rarityFilter, abilityFilter, levelMoveFilter, eggMoveFilterValue, hasPassiveFilter, hasEggMoveFilter, hasHiddenAbilityFilter, finalEvolutionFilter, costMin, costMax, totalMin, totalMax, sortBy, sortDesc])

  const allTypes = useMemo(() => {
    const types = new Set<string>()
    pokemons.forEach(p => { if (p.type1) types.add(p.type1); if (p.type2) types.add(p.type2) })
    return Array.from(types).sort()
  }, [pokemons])

  const allGens = useMemo(() => {
    const gens = new Set<number>()
    pokemons.forEach(p => gens.add(p.generation))
    return Array.from(gens).sort((a, b) => a - b)
  }, [pokemons])

  const allBiomes = useMemo(() => {
    const biomeMap = new Map<string, string>()
    const getDisplayStep = (id: string) => {
      const step = biomeStepOrder[id] ?? 99
      return step === 99 ? -1 : step
    }
    pokemons.forEach(p => (p.biomes || []).forEach(b => biomeMap.set(b.id, b.nameZh)))
    return Array.from(biomeMap.entries()).sort((a, b) => {
      const stepA = getDisplayStep(a[0])
      const stepB = getDisplayStep(b[0])
      if (stepA !== stepB) return stepB - stepA
      return a[1].localeCompare(b[1], 'zh-CN')
    })
  }, [pokemons])

  const groupedBiomes = useMemo(() => {
    const groups = new Map<number, Array<[string, string]>>()
    const getDisplayStep = (step: number) => (step === 99 ? -1 : step)
    allBiomes.forEach(entry => {
      const step = biomeStepOrder[entry[0]] ?? 99
      const list = groups.get(step) || []
      list.push(entry)
      groups.set(step, list)
    })
    return Array.from(groups.entries())
      .sort((a, b) => getDisplayStep(b[0]) - getDisplayStep(a[0]))
      .map(([step, items]) => ({
        step,
        label: step === 99 ? '终点 / 特殊' : `${step}步`,
        items,
      }))
  }, [allBiomes])

  const allRarities = useMemo(() => {
    const rarities = new Set<string>()
    pokemons.forEach(p => (p.biomeRarities || []).forEach(r => rarities.add(r)))
    return Array.from(rarities).sort((a, b) => (rarityOrder[a] || 0) - (rarityOrder[b] || 0))
  }, [pokemons])

  const allAbilities = useMemo(() => {
    const map = new Map<string, { value: string; label: string; meta?: string }>()
    pokemons.forEach(p => {
      const entries: Array<[string | null, string, string?]> = [
        [p.ability1, p.ability1Zh, '特性'],
        [p.ability2, p.ability2Zh, '特性'],
        [p.abilityHidden, p.abilityHiddenZh, '隐藏'],
        [p.passive, p.passiveZh, '被动'],
      ]
      entries.forEach(([id, zh, kind]) => {
        if (id && id !== 'NONE' && !map.has(id)) {
          map.set(id, { value: id, label: zh || id, meta: kind })
        }
      })
    })
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
  }, [pokemons])

  const allLevelMoves = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>()
    pokemons.forEach(p => {
      (p.levelMoves || []).forEach(m => {
        if (m.moveId && !map.has(m.moveId)) {
          map.set(m.moveId, { value: m.moveId, label: m.moveZh || m.moveId })
        }
      })
    })
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
  }, [pokemons])

  const allEggMoves = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>()
    pokemons.forEach(p => {
      (p.eggMoves || []).forEach(m => {
        if (m.moveId && !map.has(m.moveId)) {
          map.set(m.moveId, { value: m.moveId, label: m.moveZh || m.moveId })
        }
      })
    })
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
  }, [pokemons])

  function handleSort(field: string) {
    if (sortBy === field) {
      setSortDesc(!sortDesc)
    } else {
      setSortBy(field)
      setSortDesc(false)
    }
  }

  function resetFilters() {
    setSearch('')
    setTypeFilter('')
    setGenFilter('')
    setBiomeFilter('')
    setRarityFilter('')
    setAbilityFilter('')
    setLevelMoveFilter('')
    setEggMoveFilterValue('')
    setHasPassiveFilter('')
    setHasEggMoveFilter('')
    setHasHiddenAbilityFilter('')
    setFinalEvolutionFilter('')
    setCostMin('')
    setCostMax('')
    setTotalMin('')
    setTotalMax('')
    setHpMin('')
    setHpMax('')
    setAtkMin('')
    setAtkMax('')
    setDefMin('')
    setDefMax('')
    setSpatkMin('')
    setSpatkMax('')
    setSpdefMin('')
    setSpdefMax('')
    setSpdMin('')
    setSpdMax('')
  }

  return {
    pokemons,
    loading,
    filtered,
    filters: {
      search, typeFilter, genFilter, biomeFilter, rarityFilter, abilityFilter, levelMoveFilter, eggMoveFilterValue,
      hasPassiveFilter, hasEggMoveFilter, hasHiddenAbilityFilter, finalEvolutionFilter,
      costMin, costMax, totalMin, totalMax,
      hpMin, hpMax, atkMin, atkMax, defMin, defMax,
      spatkMin, spatkMax, spdefMin, spdefMax, spdMin, spdMax,
    },
    setters: {
      setSearch, setTypeFilter, setGenFilter, setBiomeFilter, setRarityFilter, setAbilityFilter, setLevelMoveFilter, setEggMoveFilterValue,
      setHasPassiveFilter, setHasEggMoveFilter, setHasHiddenAbilityFilter, setFinalEvolutionFilter,
      setCostMin, setCostMax, setTotalMin, setTotalMax,
      setHpMin, setHpMax, setAtkMin, setAtkMax, setDefMin, setDefMax,
      setSpatkMin, setSpatkMax, setSpdefMin, setSpdefMax, setSpdMin, setSpdMax,
    },
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
    allLevelMoves,
    allEggMoves,
  }
}
