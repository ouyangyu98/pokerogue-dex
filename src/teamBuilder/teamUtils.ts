import {
  MATCHUP_TYPE_ORDER,
  getSingleTypeMultiplier,
  typeNames,
} from '../typeMatchups'
import {
  PHYSICAL_SETUP_MOVES,
  SPECIAL_SETUP_MOVES,
  RECOVERY_MOVES,
  CONTROL_MOVES,
  PIVOT_MOVES,
} from '../moveRecommendations'
import type {
  CoverageResult,
  DefenseResult,
  DefenseStat,
  RoleResult,
  PokemonRole,
  TeamPokemonDetail,
} from './types'
import type { Pokemon, PokemonFormEntry } from '../types'

// ========== 属性覆盖分析 ==========

export function getTeamCoverage(team: TeamPokemonDetail[]): CoverageResult {
  const stabTypes = new Set<string>()
  const moveTypes = new Set<string>()
  const typeCounts: Record<string, number> = {}
  const moveTypeCounts: Record<string, number> = {}

  for (const { form } of team) {
    const types = [form.type1, form.type2].filter(Boolean) as string[]
    for (const t of types) {
      stabTypes.add(t)
      typeCounts[t] = (typeCounts[t] || 0) + 1
    }
  }

  for (const { pokemon } of team) {
    const allMoves = getAllMovesForPokemon(pokemon)
    const seen = new Set<string>()
    for (const move of allMoves) {
      if (move.type && !seen.has(move.type)) {
        seen.add(move.type)
        moveTypes.add(move.type)
        moveTypeCounts[move.type] = (moveTypeCounts[move.type] || 0) + 1
      }
    }
  }

  const uncoveredTypes = MATCHUP_TYPE_ORDER.filter(
    t => !moveTypes.has(t),
  ).map(t => typeNames[t])

  return {
    stabTypes,
    moveTypes,
    uncoveredTypes,
    typeCounts,
    moveTypeCounts,
  }
}

// ========== 抗性总览 ==========

export function getTeamDefenseMatrix(team: TeamPokemonDetail[]): DefenseResult {
  const stats: DefenseStat[] = []

  for (const attackType of MATCHUP_TYPE_ORDER) {
    let weakCount = 0
    let resistCount = 0
    let immuneCount = 0
    let neutralCount = 0

    for (const { form } of team) {
      const types = [form.type1, form.type2].filter(Boolean) as string[]
      const multiplier = types.reduce(
        (acc, defendType) => acc * getSingleTypeMultiplier(attackType, defendType),
        1,
      )

      if (multiplier === 0) immuneCount++
      else if (multiplier > 1) weakCount++
      else if (multiplier < 1) resistCount++
      else neutralCount++
    }

    stats.push({
      type: attackType,
      nameZh: typeNames[attackType],
      weakCount,
      resistCount,
      immuneCount,
      neutralCount,
    })
  }

  const dangerousTypes = stats.filter(s => s.weakCount >= 3)

  return { stats, dangerousTypes }
}

// ========== 职能分布 ==========

export function getPokemonRoles(
  pokemon: Pokemon,
  form: PokemonFormEntry,
): PokemonRole[] {
  const roles: PokemonRole[] = []
  const allMoves = getAllMovesForPokemon(pokemon)
  const moveIds = new Set(allMoves.map(m => m.moveId))

  // 输出手判定（需要同时有数值 + 对应类别技能）
  const hasPhysicalMove = allMoves.some(
    m => m.category === 'PHYSICAL' && m.power != null && m.power >= 55,
  )
  const hasSpecialMove = allMoves.some(
    m => m.category === 'SPECIAL' && m.power != null && m.power >= 55,
  )

  if (form.baseAtk >= 100 && hasPhysicalMove) {
    roles.push('physical_attacker')
  }
  if (form.baseSpatk >= 100 && hasSpecialMove) {
    roles.push('special_attacker')
  }
  if (form.baseSpd >= 100) {
    roles.push('fast')
  }
  if (form.baseHp + form.baseDef + form.baseSpdef >= 280) {
    roles.push('bulky')
  }

  // 功能型判定
  const hasSetup = [...PHYSICAL_SETUP_MOVES, ...SPECIAL_SETUP_MOVES].some(id =>
    moveIds.has(id),
  )
  if (hasSetup) roles.push('setup')

  const hasRecovery = [...RECOVERY_MOVES].some(id => moveIds.has(id))
  if (hasRecovery) roles.push('recovery')

  const hasControl = [...CONTROL_MOVES].some(id => moveIds.has(id))
  if (hasControl) roles.push('control')

  const hasPivot = [...PIVOT_MOVES].some(id => moveIds.has(id))
  if (hasPivot) roles.push('pivot')

  return roles
}

export function getTeamRoleDistribution(team: TeamPokemonDetail[]): RoleResult {
  const rolesByPokemon: Record<number, PokemonRole[]> = {}
  const roleCounts: Record<PokemonRole, number> = {
    physical_attacker: 0,
    special_attacker: 0,
    fast: 0,
    bulky: 0,
    setup: 0,
    recovery: 0,
    control: 0,
    pivot: 0,
  }

  for (const detail of team) {
    const roles = getPokemonRoles(detail.pokemon, detail.form)
    rolesByPokemon[detail.slotIndex] = roles
    for (const r of roles) {
      roleCounts[r]++
    }
  }

  return { rolesByPokemon, roleCounts }
}

// ========== 缺口建议 ==========

export function generateGapSuggestions(
  team: TeamPokemonDetail[],
  coverage: CoverageResult,
  defense: DefenseResult,
  roles: RoleResult,
): string[] {
  const suggestions: string[] = []

  // 1. 共同弱点预警
  if (defense.dangerousTypes.length > 0) {
    const types = defense.dangerousTypes.map(t => t.nameZh).join('、')
    suggestions.push(`危险：队伍中有 3 只以上精灵共同弱 ${types}，建议补充对应抗性。`)
  }

  // 2. 属性盲区
  if (coverage.uncoveredTypes.length > 0) {
    const preview = coverage.uncoveredTypes.slice(0, 4).join('、')
    const suffix = coverage.uncoveredTypes.length > 4 ? ` 等 ${coverage.uncoveredTypes.length} 种` : ''
    suggestions.push(`属性盲区：队伍技能池无法覆盖 ${preview}${suffix} 属性输出。`)
  }

  // 3. 职能缺口
  const rc = roles.roleCounts
  if (rc.physical_attacker === 0 && rc.special_attacker === 0) {
    suggestions.push('队伍缺少核心输出手，建议补充物攻或特攻主力。')
  }
  if (rc.recovery === 0) {
    suggestions.push('队伍没有回复手段，持久战续航能力可能不足。')
  }
  if (rc.control === 0) {
    suggestions.push('队伍缺少控场手段（电磁波、鬼火、岩钉等），建议补充。')
  }
  if (rc.setup === 0) {
    suggestions.push('队伍没有强化手，缺少滚雪球推进能力。')
  }
  if (rc.fast === 0) {
    const maxSpd = Math.max(...team.map(t => t.form.baseSpd), 0)
    suggestions.push(`队伍整体速度偏慢（最快 ${maxSpd}），容易被先手压制。`)
  }
  if (rc.bulky === 0) {
    suggestions.push('队伍缺少耐久型精灵，整体偏脆，建议补充站场能力。')
  }

  // 4. 输出类型过于集中
  if (rc.physical_attacker >= 4) {
    suggestions.push('物攻手过多，输出类型过于集中，容易被高物防精灵压制。')
  }
  if (rc.special_attacker >= 4) {
    suggestions.push('特攻手过多，输出类型过于集中，容易被高特防精灵压制。')
  }

  // 5. 本系重复
  const repeatedStab = Object.entries(coverage.typeCounts)
    .filter(([, count]) => count >= 3)
    .map(([type]) => typeNames[type as keyof typeof typeNames] || type)
  if (repeatedStab.length > 0) {
    suggestions.push(`本系属性过于集中：${repeatedStab.join('、')} 被多只精灵共享。`)
  }

  return suggestions
}

// ========== 辅助函数 ==========

function getAllMovesForPokemon(
  pokemon: Pokemon,
): Array<{ moveId: string; type: string | null; category: string | null; power: number | null }> {
  const moves: Array<{ moveId: string; type: string | null; category: string | null; power: number | null }> = []

  // 等级技能
  for (const m of pokemon.levelMoves) {
    moves.push({
      moveId: m.moveId,
      type: m.type,
      category: m.category,
      power: m.power,
    })
  }

  // 蛋招
  for (const m of pokemon.eggMoves) {
    moves.push({
      moveId: m.moveId,
      type: m.type,
      category: m.category,
      power: m.power,
    })
  }

  return moves
}
