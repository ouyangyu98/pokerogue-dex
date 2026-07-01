export type PokemonTypeKey =
  | 'NORMAL'
  | 'FIGHTING'
  | 'FLYING'
  | 'POISON'
  | 'GROUND'
  | 'ROCK'
  | 'BUG'
  | 'GHOST'
  | 'STEEL'
  | 'FIRE'
  | 'WATER'
  | 'GRASS'
  | 'ELECTRIC'
  | 'PSYCHIC'
  | 'ICE'
  | 'DRAGON'
  | 'DARK'
  | 'FAIRY'
  | 'STELLAR'
  | 'UNKNOWN'

export const PokemonTypeNames: Record<PokemonTypeKey, string> = {
  NORMAL: '一般',
  FIGHTING: '格斗',
  FLYING: '飞行',
  POISON: '毒',
  GROUND: '地面',
  ROCK: '岩石',
  BUG: '虫',
  GHOST: '幽灵',
  STEEL: '钢',
  FIRE: '火',
  WATER: '水',
  GRASS: '草',
  ELECTRIC: '电',
  PSYCHIC: '超能力',
  ICE: '冰',
  DRAGON: '龙',
  DARK: '恶',
  FAIRY: '妖精',
  STELLAR: '星晶',
  UNKNOWN: '未知',
}

export interface BiomeRef {
  id: string
  nameZh: string
  rarities?: string[]
}

export interface MoveEntry {
  level: number | string
  moveId: string
  moveZh: string
  type: string | null
  category: string | null
  power: number | null
  accuracy: number | null
}

export interface EggMoveEntry {
  moveId: string
  moveZh: string
  type: string | null
  category: string | null
  power: number | null
  accuracy: number | null
}

export interface CombinedMoveEntry {
  source: 'egg' | 'level'
  sourceLabel: string
  order: number
  level: number | string | null
  moveId: string
  moveZh: string
  type: string | null
  category: string | null
  power: number | null
  accuracy: number | null
}

export interface EvolutionEntry {
  kind: string
  toSpeciesId: string
  toSpeciesZh: string
  level: number
  item: string | null
  itemZh: string | null
  preFormKey: string | null
  evoFormKey: string | null
  conditions: string[]
  descriptionZh: string
}

export interface PokemonFormEntry {
  formIndex: number
  formKey: string
  formNameZh: string
  type1: PokemonTypeKey | null
  type2: PokemonTypeKey | null
  ability1: string | null
  ability2: string | null
  abilityHidden: string | null
  passive: string | null
  baseTotal: number
  baseHp: number
  baseAtk: number
  baseDef: number
  baseSpatk: number
  baseSpdef: number
  baseSpd: number
}

export interface Pokemon {
  id: string
  numericId: number
  nameEn: string
  nameZh: string
  generation: number
  type1: PokemonTypeKey | null
  type2: PokemonTypeKey | null
  baseTotal: number
  baseHp: number
  baseAtk: number
  baseDef: number
  baseSpatk: number
  baseSpdef: number
  baseSpd: number
  ability1: string | null
  ability1Zh: string
  ability2: string | null
  ability2Zh: string
  abilityHidden: string | null
  abilityHiddenZh: string
  starter: string | null
  starterCost: number | null
  passive: string | null
  passiveZh: string
  passiveByForm: Record<string, string>
  eggTier: string | null
  forms: PokemonFormEntry[]
  evolutions: EvolutionEntry[]
  levelMoves: MoveEntry[]
  eggMoves: EggMoveEntry[]
  hasEggMoves: boolean
  biomes: BiomeRef[]
  biomeRarities?: string[]
  primaryBiomeRarity?: string | null
  isFinalEvolution?: boolean
  catchRate: number
  catchProbability: number
  smogonSets?: SmogonSet[]
}

export interface SmogonSet {
  name: string
  description: string
  moves: string[]
}

export interface BiomeEncounter {
  speciesId: string
  poolTier: string
  timeOfDay: string
  isBoss: boolean
  rarity: string
  tierProbability: number
  individualProbability: number
}

export interface Biome {
  id: string
  nameEn: string
  nameZh: string
  biomeLinks: string[]
  encounters: BiomeEncounter[]
}

export interface CoverageItem {
  total: number
  mapped: number
  coverage: number
}

export interface TypeMatchupItem {
  id: string
  nameZh: string
  description: string
  tier: string
  tierLabel: string
  sortOrder: number
  tierIndex: number
  iconKey?: string | null
  fallbackIconKey?: string | null
}

export interface DataReport {
  sourceVersion: string
  generationTime: string
  pokemonCount: number
  biomeCount: number
  encounterCount: number
  normalEncounterCount: number
  bossEncounterCount: number
  levelMoveCount: number
  eggMovePokemonCount: number
  eggMoveCount: number
  evolutionCount: number
  costCount: number
  passiveCount: number
  formCount: number
  itemCount?: number
  moveCount: number
  abilityCount: number
  nameMapCoverage: Record<string, CoverageItem>
}
