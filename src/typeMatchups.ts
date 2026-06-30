import pokemonInfoZh from './data/pokemon-info-zh.json'

export const MATCHUP_TYPE_ORDER = [
  'NORMAL',
  'FIGHTING',
  'FLYING',
  'POISON',
  'GROUND',
  'ROCK',
  'BUG',
  'GHOST',
  'STEEL',
  'FIRE',
  'WATER',
  'GRASS',
  'ELECTRIC',
  'PSYCHIC',
  'ICE',
  'DRAGON',
  'DARK',
  'FAIRY',
] as const

export type MatchupTypeKey = typeof MATCHUP_TYPE_ORDER[number]
export type BadgeTypeKey = MatchupTypeKey | 'STELLAR' | 'UNKNOWN'

const typeLocaleKeyMap: Record<BadgeTypeKey, keyof typeof pokemonInfoZh.type> = {
  NORMAL: 'normal',
  FIGHTING: 'fighting',
  FLYING: 'flying',
  POISON: 'poison',
  GROUND: 'ground',
  ROCK: 'rock',
  BUG: 'bug',
  GHOST: 'ghost',
  STEEL: 'steel',
  FIRE: 'fire',
  WATER: 'water',
  GRASS: 'grass',
  ELECTRIC: 'electric',
  PSYCHIC: 'psychic',
  ICE: 'ice',
  DRAGON: 'dragon',
  DARK: 'dark',
  FAIRY: 'fairy',
  STELLAR: 'stellar',
  UNKNOWN: 'unknown',
}

export const typeNames: Record<BadgeTypeKey, string> = Object.fromEntries(
  Object.entries(typeLocaleKeyMap).map(([typeKey, localeKey]) => [typeKey, pokemonInfoZh.type[localeKey]]),
) as Record<BadgeTypeKey, string>

export const typeColors: Record<BadgeTypeKey, string> = {
  NORMAL: '#A8A878',
  FIGHTING: '#C03028',
  FLYING: '#A890F0',
  POISON: '#A040A0',
  GROUND: '#E0C068',
  ROCK: '#B8A038',
  BUG: '#A8B820',
  GHOST: '#705898',
  STEEL: '#B8B8D0',
  FIRE: '#F08030',
  WATER: '#6890F0',
  GRASS: '#78C850',
  ELECTRIC: '#F8D030',
  PSYCHIC: '#F85888',
  ICE: '#98D8D8',
  DRAGON: '#7038F8',
  DARK: '#705848',
  FAIRY: '#EE99AC',
  STELLAR: '#6C5CE7',
  UNKNOWN: '#999999',
}

// 基于 `source/pokerogue/src/data/type.ts` 中的基础属性克制表整理
const singleTypeChart: Record<BadgeTypeKey, Partial<Record<BadgeTypeKey, number>>> = {
  NORMAL: { ROCK: 0.5, GHOST: 0, STEEL: 0.5 },
  FIGHTING: { NORMAL: 2, FLYING: 0.5, POISON: 0.5, ROCK: 2, BUG: 0.5, GHOST: 0, STEEL: 2, PSYCHIC: 0.5, ICE: 2, DARK: 2, FAIRY: 0.5 },
  FLYING: { FIGHTING: 2, ROCK: 0.5, BUG: 2, STEEL: 0.5, GRASS: 2, ELECTRIC: 0.5 },
  POISON: { POISON: 0.5, GROUND: 0.5, ROCK: 0.5, GHOST: 0.5, STEEL: 0, GRASS: 2, FAIRY: 2 },
  GROUND: { FLYING: 0, POISON: 2, ROCK: 2, BUG: 0.5, STEEL: 2, FIRE: 2, GRASS: 0.5, ELECTRIC: 2 },
  ROCK: { FIGHTING: 0.5, FLYING: 2, GROUND: 0.5, BUG: 2, STEEL: 0.5, FIRE: 2, ICE: 2 },
  BUG: { FIGHTING: 0.5, FLYING: 0.5, POISON: 0.5, GHOST: 0.5, STEEL: 0.5, FIRE: 0.5, GRASS: 2, PSYCHIC: 2, DARK: 2, FAIRY: 0.5 },
  GHOST: { NORMAL: 0, GHOST: 2, PSYCHIC: 2, DARK: 0.5 },
  STEEL: { ROCK: 2, STEEL: 0.5, FIRE: 0.5, WATER: 0.5, ELECTRIC: 0.5, ICE: 2, FAIRY: 2 },
  FIRE: { ROCK: 0.5, BUG: 2, STEEL: 2, FIRE: 0.5, WATER: 0.5, GRASS: 2, ICE: 2, DRAGON: 0.5 },
  WATER: { GROUND: 2, ROCK: 2, FIRE: 2, WATER: 0.5, GRASS: 0.5, DRAGON: 0.5 },
  GRASS: { FLYING: 0.5, POISON: 0.5, GROUND: 2, ROCK: 2, BUG: 0.5, STEEL: 0.5, FIRE: 0.5, WATER: 2, GRASS: 0.5, DRAGON: 0.5 },
  ELECTRIC: { FLYING: 2, GROUND: 0, WATER: 2, GRASS: 0.5, ELECTRIC: 0.5, DRAGON: 0.5 },
  PSYCHIC: { FIGHTING: 2, POISON: 2, STEEL: 0.5, PSYCHIC: 0.5, DARK: 0 },
  ICE: { FLYING: 2, GROUND: 2, STEEL: 0.5, FIRE: 0.5, WATER: 0.5, GRASS: 2, ICE: 0.5, DRAGON: 2 },
  DRAGON: { STEEL: 0.5, DRAGON: 2, FAIRY: 0 },
  DARK: { FIGHTING: 0.5, GHOST: 2, PSYCHIC: 2, DARK: 0.5, FAIRY: 0.5 },
  FAIRY: { FIGHTING: 2, POISON: 0.5, STEEL: 0.5, FIRE: 0.5, DRAGON: 2, DARK: 2 },
  STELLAR: {},
  UNKNOWN: {},
}

export interface TypeMultiplierItem {
  type: MatchupTypeKey
  multiplier: number
}

export interface CombinedDefenseBuckets {
  quadWeak: TypeMultiplierItem[]
  weak: TypeMultiplierItem[]
  resist: TypeMultiplierItem[]
  doubleResist: TypeMultiplierItem[]
  immune: TypeMultiplierItem[]
}

export interface TypeMatchupRow {
  type: MatchupTypeKey
  nameZh: string
  attack: {
    strongAgainst: MatchupTypeKey[]
    resistedBy: MatchupTypeKey[]
    noEffectAgainst: MatchupTypeKey[]
  }
  defense: {
    weakTo: MatchupTypeKey[]
    resistantTo: MatchupTypeKey[]
    immuneTo: MatchupTypeKey[]
  }
}

function isMatchupTypeKey(value: string | null | undefined): value is MatchupTypeKey {
  return Boolean(value && MATCHUP_TYPE_ORDER.includes(value as MatchupTypeKey))
}

export function getSingleTypeMultiplier(attackType: string, defendType: string) {
  if (attackType === 'UNKNOWN' || defendType === 'UNKNOWN') return 1
  return singleTypeChart[attackType as BadgeTypeKey]?.[defendType as BadgeTypeKey] ?? 1
}

export function formatMultiplier(multiplier: number) {
  if (multiplier === 0) return '无效'
  if (multiplier === 0.25) return '1/4'
  if (multiplier === 0.5) return '1/2'
  if (multiplier === 2) return '2倍'
  if (multiplier === 4) return '4倍'
  return `${multiplier}倍`
}

function sortTypeMultiplierItems(items: TypeMultiplierItem[]) {
  return items.sort((a, b) => {
    if (a.multiplier !== b.multiplier) return b.multiplier - a.multiplier
    return typeNames[a.type].localeCompare(typeNames[b.type], 'zh-Hans-CN')
  })
}

export function getCombinedDefenseMatchups(type1: string | null, type2: string | null) {
  const defenseTypes = [type1, type2].filter(isMatchupTypeKey)
  const effective: TypeMultiplierItem[] = []
  const weak: TypeMultiplierItem[] = []

  for (const attackType of MATCHUP_TYPE_ORDER) {
    const multiplier = defenseTypes.reduce((acc, defendType) => acc * getSingleTypeMultiplier(attackType, defendType), 1)

    if (multiplier < 1) {
      effective.push({ type: attackType, multiplier })
    } else if (multiplier > 1) {
      weak.push({ type: attackType, multiplier })
    }
  }

  return {
    effective: sortTypeMultiplierItems(effective),
    weak: sortTypeMultiplierItems(weak),
  }
}

export function getCombinedDefenseBuckets(type1: string | null, type2: string | null): CombinedDefenseBuckets {
  const defenseTypes = [type1, type2].filter(isMatchupTypeKey)
  const buckets: CombinedDefenseBuckets = {
    quadWeak: [],
    weak: [],
    resist: [],
    doubleResist: [],
    immune: [],
  }

  if (defenseTypes.length === 0) {
    return buckets
  }

  for (const attackType of MATCHUP_TYPE_ORDER) {
    const multiplier = defenseTypes.reduce((acc, defendType) => acc * getSingleTypeMultiplier(attackType, defendType), 1)
    const item = { type: attackType, multiplier }

    if (multiplier === 4) buckets.quadWeak.push(item)
    else if (multiplier === 2) buckets.weak.push(item)
    else if (multiplier === 0.5) buckets.resist.push(item)
    else if (multiplier === 0.25) buckets.doubleResist.push(item)
    else if (multiplier === 0) buckets.immune.push(item)
  }

  return {
    quadWeak: sortTypeMultiplierItems(buckets.quadWeak),
    weak: sortTypeMultiplierItems(buckets.weak),
    resist: sortTypeMultiplierItems(buckets.resist),
    doubleResist: sortTypeMultiplierItems(buckets.doubleResist),
    immune: sortTypeMultiplierItems(buckets.immune),
  }
}

export function buildSingleTypeMatchupRows(): TypeMatchupRow[] {
  return MATCHUP_TYPE_ORDER.map(type => ({
    type,
    nameZh: typeNames[type],
    attack: {
      strongAgainst: MATCHUP_TYPE_ORDER.filter(defendType => getSingleTypeMultiplier(type, defendType) === 2),
      resistedBy: MATCHUP_TYPE_ORDER.filter(defendType => getSingleTypeMultiplier(type, defendType) === 0.5),
      noEffectAgainst: MATCHUP_TYPE_ORDER.filter(defendType => getSingleTypeMultiplier(type, defendType) === 0),
    },
    defense: {
      weakTo: MATCHUP_TYPE_ORDER.filter(attackType => getSingleTypeMultiplier(attackType, type) === 2),
      resistantTo: MATCHUP_TYPE_ORDER.filter(attackType => getSingleTypeMultiplier(attackType, type) === 0.5),
      immuneTo: MATCHUP_TYPE_ORDER.filter(attackType => getSingleTypeMultiplier(attackType, type) === 0),
    },
  }))
}
