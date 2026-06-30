import type { Pokemon, PokemonFormEntry } from '../types'

export interface TeamSlot {
  speciesId: string
  formIndex: number
}

export interface SavedTeam {
  id: string
  name: string
  slots: (TeamSlot | null)[]
  createdAt: number
}

export interface TeamPokemonDetail {
  pokemon: Pokemon
  form: PokemonFormEntry
  slotIndex: number
}

// 属性覆盖分析
export interface CoverageResult {
  stabTypes: Set<string>           // 队伍本系属性集合
  moveTypes: Set<string>           // 队伍全技能池属性集合
  uncoveredTypes: string[]         // 18 属性中没有任何技能能打的属性
  typeCounts: Record<string, number> // 每种属性被多少只精灵的本系覆盖
  moveTypeCounts: Record<string, number> // 每种属性被多少只精灵的技能池覆盖
}

// 抗性总览
export interface DefenseStat {
  type: string
  nameZh: string
  weakCount: number      // 多少只精灵弱这个属性
  resistCount: number    // 多少只精灵抗这个属性
  immuneCount: number    // 多少只精灵免疫这个属性
  neutralCount: number   // 多少只精灵无修正
}

export interface DefenseResult {
  stats: DefenseStat[]
  dangerousTypes: DefenseStat[]  // 超过 3 只弱点的属性
}

// 职能分布
export type PokemonRole =
  | 'physical_attacker'
  | 'special_attacker'
  | 'fast'
  | 'bulky'
  | 'setup'
  | 'recovery'
  | 'control'
  | 'pivot'

export interface RoleResult {
  rolesByPokemon: Record<number, PokemonRole[]>  // slotIndex -> roles
  roleCounts: Record<PokemonRole, number>
}

export const ROLE_LABELS: Record<PokemonRole, string> = {
  physical_attacker: '物攻手',
  special_attacker: '特攻手',
  fast: '高速',
  bulky: '耐久型',
  setup: '强化手',
  recovery: '回复手',
  control: '控场手',
  pivot: '转场手',
}

export interface TeamAnalysisResult {
  coverage: CoverageResult
  defense: DefenseResult
  roles: RoleResult
  gaps: string[]
  pokemonDetails: TeamPokemonDetail[]
}
