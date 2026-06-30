import { MATCHUP_TYPE_ORDER, getSingleTypeMultiplier, typeNames } from './typeMatchups'

export interface RecommendationMoveCandidate {
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

export interface RecommendationPokemonProfile {
  type1: string | null
  type2: string | null
  baseHp: number
  baseAtk: number
  baseDef: number
  baseSpatk: number
  baseSpdef: number
  baseSpd: number
  baseTotal: number
}

export interface RecommendedMove extends RecommendationMoveCandidate {
  slotLabel: string
  slotKind: 'stab' | 'coverage' | 'setup' | 'recovery' | 'control' | 'fallback'
  reason: string
  coverageSummary: string
}

export interface MoveRecommendationResult {
  roleLabel: string
  tags: string[]
  summary: string
  notes: string
  moves: RecommendedMove[]
}

type BattleRole = 'physical' | 'special' | 'mixed'
type UtilityKind = 'setup' | 'recovery' | 'control' | 'pivot'

export const PHYSICAL_SETUP_MOVES = new Set([
  'SWORDS_DANCE',
  'DRAGON_DANCE',
  'BULK_UP',
  'COIL',
  'HONE_CLAWS',
  'SHIFT_GEAR',
  'CURSE',
  'VICTORY_DANCE',
  'HOWL',
])

export const SPECIAL_SETUP_MOVES = new Set([
  'NASTY_PLOT',
  'CALM_MIND',
  'QUIVER_DANCE',
  'TAIL_GLOW',
  'CHARGE_BEAM',
  'TORCH_SONG',
])

export const SPEED_SETUP_MOVES = new Set([
  'AGILITY',
  'AUTOTOMIZE',
  'ROCK_POLISH',
  'SHIFT_GEAR',
  'QUIVER_DANCE',
  'DRAGON_DANCE',
  'FLAME_CHARGE',
  'TRAILBLAZE',
])

export const RECOVERY_MOVES = new Set([
  'RECOVER',
  'ROOST',
  'SOFT_BOILED',
  'MOONLIGHT',
  'MORNING_SUN',
  'SYNTHESIS',
  'SLACK_OFF',
  'SHORE_UP',
  'WISH',
  'HEAL_ORDER',
  'JUNGLE_HEALING',
  'OBLIVION_WING',
])

export const CONTROL_MOVES = new Set([
  'THUNDER_WAVE',
  'WILL_O_WISP',
  'TOXIC',
  'STEALTH_ROCK',
  'SPIKES',
  'TOXIC_SPIKES',
  'TAUNT',
  'ENCORE',
  'KNOCK_OFF',
  'LEECH_SEED',
  'RAPID_SPIN',
  'DEFOG',
  'AURORA_VEIL',
  'REFLECT',
  'LIGHT_SCREEN',
  'TRICK_ROOM',
  'SPORE',
  'YAWN',
])

export const PIVOT_MOVES = new Set([
  'U_TURN',
  'VOLT_SWITCH',
  'FLIP_TURN',
  'PARTING_SHOT',
  'CHILLY_RECEPTION',
])

function resolveBattleRole(pokemon: RecommendationPokemonProfile): BattleRole {
  const delta = pokemon.baseAtk - pokemon.baseSpatk
  if (delta >= 20) return 'physical'
  if (delta <= -20) return 'special'
  return 'mixed'
}

function getRoleLabel(role: BattleRole) {
  if (role === 'physical') return '物攻主核'
  if (role === 'special') return '特攻主核'
  return '双攻混合'
}

function getSpeedLabel(baseSpd: number) {
  if (baseSpd >= 120) return '高速压制'
  if (baseSpd >= 95) return '中高速推进'
  if (baseSpd >= 70) return '中速站场'
  return '低速重炮'
}

function getBulkLabel(pokemon: RecommendationPokemonProfile) {
  const bulk = pokemon.baseHp + pokemon.baseDef + pokemon.baseSpdef
  if (bulk >= 320) return '耐久扎实'
  if (bulk >= 250) return '耐久均衡'
  return '偏脆输出'
}

function getPreferredCategory(role: BattleRole): 'PHYSICAL' | 'SPECIAL' | null {
  if (role === 'physical') return 'PHYSICAL'
  if (role === 'special') return 'SPECIAL'
  return null
}

function getCoverageScore(type: string | null) {
  if (!type) return 0
  return MATCHUP_TYPE_ORDER.filter(defendType => getSingleTypeMultiplier(type, defendType) > 1).length
}

function getAccuracyBonus(accuracy: number | null) {
  if (accuracy == null) return 7
  if (accuracy >= 100) return 6
  if (accuracy >= 90) return 3
  if (accuracy >= 80) return 0
  return -6
}

function getMoveSourcePriority(move: RecommendationMoveCandidate) {
  let score = 0
  if (move.category) score += 3
  if (move.source === 'level') score += 2
  if (typeof move.level === 'number') score += Math.max(0, 100 - move.level) / 100
  return score
}

function normalizeMoves(moves: RecommendationMoveCandidate[]) {
  const deduped = new Map<string, RecommendationMoveCandidate>()

  for (const move of moves) {
    const existing = deduped.get(move.moveId)
    if (!existing || getMoveSourcePriority(move) > getMoveSourcePriority(existing)) {
      deduped.set(move.moveId, move)
    }
  }

  return Array.from(deduped.values())
}

function getUtilityKind(move: RecommendationMoveCandidate, role: BattleRole): UtilityKind | null {
  if (PHYSICAL_SETUP_MOVES.has(move.moveId) || SPECIAL_SETUP_MOVES.has(move.moveId) || SPEED_SETUP_MOVES.has(move.moveId)) {
    if (role === 'physical' && PHYSICAL_SETUP_MOVES.has(move.moveId)) return 'setup'
    if (role === 'special' && SPECIAL_SETUP_MOVES.has(move.moveId)) return 'setup'
    if (role === 'mixed') return 'setup'
    if (SPEED_SETUP_MOVES.has(move.moveId)) return 'setup'
  }
  if (RECOVERY_MOVES.has(move.moveId)) return 'recovery'
  if (CONTROL_MOVES.has(move.moveId)) return 'control'
  if (PIVOT_MOVES.has(move.moveId)) return 'pivot'
  return null
}

function scoreAttackMove(
  move: RecommendationMoveCandidate,
  pokemon: RecommendationPokemonProfile,
  role: BattleRole,
  chosenTypes: string[] = [],
) {
  if (!move.category || !move.type || move.power == null || move.power < 55) return -Infinity

  const preferredCategory = getPreferredCategory(role)
  const stabTypes = [pokemon.type1, pokemon.type2].filter(Boolean)
  const isStab = stabTypes.includes(move.type)
  const duplicateTypePenalty = chosenTypes.includes(move.type) ? 8 : 0

  let score = 18
  score += Math.min(move.power, 140) * 0.42
  score += getAccuracyBonus(move.accuracy)
  score += getCoverageScore(move.type) * (isStab ? 1.1 : 1.6)

  if (preferredCategory) {
    if (move.category === preferredCategory) score += 22
    else score -= 8
  } else {
    score += 12
  }

  if (isStab) score += 18
  if (move.power >= 120 && move.accuracy != null && move.accuracy < 85) score -= 10
  if (move.moveId === 'HYPER_BEAM' || move.moveId === 'GIGA_IMPACT') score -= 12

  return score - duplicateTypePenalty
}

function scoreUtilityMove(move: RecommendationMoveCandidate, pokemon: RecommendationPokemonProfile, role: BattleRole) {
  const utilityKind = getUtilityKind(move, role)
  if (!utilityKind) return -Infinity

  if (utilityKind === 'setup') {
    let score = 76
    if (role === 'physical' && PHYSICAL_SETUP_MOVES.has(move.moveId)) score += 18
    if (role === 'special' && SPECIAL_SETUP_MOVES.has(move.moveId)) score += 18
    if (SPEED_SETUP_MOVES.has(move.moveId) && pokemon.baseSpd < 105) score += 8
    if (pokemon.baseTotal >= 560) score += 6
    return score
  }

  if (utilityKind === 'recovery') {
    const bulk = pokemon.baseHp + pokemon.baseDef + pokemon.baseSpdef
    return 60 + Math.min(20, Math.round((bulk - 220) / 8))
  }

  if (utilityKind === 'control') {
    return 58 + (pokemon.baseSpd >= 95 ? 8 : 0)
  }

  return 56 + (pokemon.baseSpd >= 100 ? 6 : 0)
}

function getCoverageSummary(move: RecommendationMoveCandidate) {
  if (!move.type) return '打击面：属性未知，暂不统计。'

  const targets = MATCHUP_TYPE_ORDER
    .filter(defendType => getSingleTypeMultiplier(move.type as typeof MATCHUP_TYPE_ORDER[number], defendType) > 1)
    .map(defendType => typeNames[defendType])

  if (targets.length === 0) {
    return '打击面：无明显克制属性。'
  }

  const preview = targets.slice(0, 5).join('、')
  const suffix = targets.length > 5 ? ` 等 ${targets.length} 种属性` : `（共 ${targets.length} 种属性）`
  return `打击面：克制 ${preview}${suffix}`
}

function buildReason(
  move: RecommendationMoveCandidate,
  slotKind: RecommendedMove['slotKind'],
  pokemon: RecommendationPokemonProfile,
  role: BattleRole,
  stabTypes: string[],
) {
  const typeLabel = move.type ? (typeNames[move.type as keyof typeof typeNames] || move.type) : '该招式'
  const stabLabel = stabTypes
    .map(type => typeNames[type as keyof typeof typeNames] || type)
    .join(' / ')

  if (slotKind === 'stab') {
    return `${typeLabel}本系高分输出，优先承担主攻位。`
  }

  if (slotKind === 'coverage') {
    return stabLabel ? `补足 ${stabLabel} 之外的打点，提升补盲范围。` : '用于补足不同属性打点，避免输出面过窄。'
  }

  if (slotKind === 'setup') {
    if (role === 'physical') return '适合先手强化物攻/速度，再滚雪球推进。'
    if (role === 'special') return '适合作为强化启动点，放大特攻端压制力。'
    return '可在合适回合完成强化，提升整套招式上限。'
  }

  if (slotKind === 'recovery') {
    const bulkLabel = getBulkLabel(pokemon)
    return `补足续航能力，更适合 ${bulkLabel} 的站场节奏。`
  }

  if (slotKind === 'control') {
    return '补充状态、撒钉、清场或转场等功能性价值。'
  }

  return '在当前可学招式里综合分数较高，适合作为稳定补位。'
}

function pushMove(
  selected: RecommendedMove[],
  selectedIds: Set<string>,
  move: RecommendationMoveCandidate | undefined,
  slotLabel: string,
  slotKind: RecommendedMove['slotKind'],
  pokemon: RecommendationPokemonProfile,
  role: BattleRole,
  stabTypes: string[],
) {
  if (!move || selectedIds.has(move.moveId)) return

  selected.push({
    ...move,
    slotLabel,
    slotKind,
    reason: buildReason(move, slotKind, pokemon, role, stabTypes),
    coverageSummary: getCoverageSummary(move),
  })
  selectedIds.add(move.moveId)
}

export function buildMoveRecommendation(
  pokemon: RecommendationPokemonProfile,
  moves: RecommendationMoveCandidate[],
): MoveRecommendationResult {
  const role = resolveBattleRole(pokemon)
  const roleLabel = getRoleLabel(role)
  const speedLabel = getSpeedLabel(pokemon.baseSpd)
  const bulkLabel = getBulkLabel(pokemon)
  const stabTypes = [pokemon.type1, pokemon.type2].filter(Boolean) as string[]
  const normalizedMoves = normalizeMoves(moves)
  const chosenTypes: string[] = []
  const selected: RecommendedMove[] = []
  const selectedIds = new Set<string>()

  const offensiveMoves = normalizedMoves
    .filter(move => move.type && move.category && move.power != null)
    .sort((a, b) => scoreAttackMove(b, pokemon, role, chosenTypes) - scoreAttackMove(a, pokemon, role, chosenTypes))

  const utilityMoves = normalizedMoves
    .filter(move => getUtilityKind(move, role))
    .sort((a, b) => scoreUtilityMove(b, pokemon, role) - scoreUtilityMove(a, pokemon, role))

  const primaryStab = offensiveMoves
    .filter(move => move.type && stabTypes.includes(move.type))
    .sort((a, b) => scoreAttackMove(b, pokemon, role, chosenTypes) - scoreAttackMove(a, pokemon, role, chosenTypes))[0]
  pushMove(selected, selectedIds, primaryStab, '本系主攻', 'stab', pokemon, role, stabTypes)
  if (primaryStab?.type) chosenTypes.push(primaryStab.type)

  const secondaryStab = offensiveMoves
    .filter(move => !selectedIds.has(move.moveId) && move.type && stabTypes.includes(move.type) && move.type !== primaryStab?.type)
    .sort((a, b) => scoreAttackMove(b, pokemon, role, chosenTypes) - scoreAttackMove(a, pokemon, role, chosenTypes))[0]
  pushMove(selected, selectedIds, secondaryStab, '副本系', 'stab', pokemon, role, stabTypes)
  if (secondaryStab?.type) chosenTypes.push(secondaryStab.type)

  const bestUtility = utilityMoves[0]
  if (bestUtility && scoreUtilityMove(bestUtility, pokemon, role) >= 66) {
    const utilityKind = getUtilityKind(bestUtility, role)
    const slotKind = utilityKind === 'recovery'
      ? 'recovery'
      : utilityKind === 'control' || utilityKind === 'pivot'
        ? 'control'
        : 'setup'
    const slotLabel = slotKind === 'setup'
      ? '强化启动'
      : slotKind === 'recovery'
        ? '续航回复'
        : '功能补位'
    pushMove(selected, selectedIds, bestUtility, slotLabel, slotKind, pokemon, role, stabTypes)
  }

  const bestCoverage = offensiveMoves
    .filter(move => !selectedIds.has(move.moveId) && move.type && !stabTypes.includes(move.type))
    .sort((a, b) => scoreAttackMove(b, pokemon, role, chosenTypes) - scoreAttackMove(a, pokemon, role, chosenTypes))[0]
  pushMove(selected, selectedIds, bestCoverage, '补盲输出', 'coverage', pokemon, role, stabTypes)
  if (bestCoverage?.type) chosenTypes.push(bestCoverage.type)

  const fillers = [...offensiveMoves, ...utilityMoves].filter(move => !selectedIds.has(move.moveId))
  while (selected.length < 4 && fillers.length > 0) {
    const nextMove = fillers
      .sort((a, b) => {
        const aUtility = getUtilityKind(a, role)
        const bUtility = getUtilityKind(b, role)
        const aScore = aUtility ? scoreUtilityMove(a, pokemon, role) : scoreAttackMove(a, pokemon, role, chosenTypes)
        const bScore = bUtility ? scoreUtilityMove(b, pokemon, role) : scoreAttackMove(b, pokemon, role, chosenTypes)
        return bScore - aScore
      })[0]

    if (!nextMove) break

    const utilityKind = getUtilityKind(nextMove, role)
    const slotKind = utilityKind
      ? utilityKind === 'recovery'
        ? 'recovery'
        : utilityKind === 'control' || utilityKind === 'pivot'
          ? 'control'
          : 'setup'
      : 'fallback'
    const slotLabel = slotKind === 'fallback'
      ? '高分补位'
      : slotKind === 'setup'
        ? '强化启动'
        : slotKind === 'recovery'
          ? '续航回复'
          : '功能补位'

    pushMove(selected, selectedIds, nextMove, slotLabel, slotKind, pokemon, role, stabTypes)
    if (nextMove.type) chosenTypes.push(nextMove.type)
    fillers.splice(fillers.findIndex(move => move.moveId === nextMove.moveId), 1)
  }

  const preferredTypes = selected
    .filter(move => move.slotKind === 'stab')
    .map(move => move.type ? (typeNames[move.type as keyof typeof typeNames] || move.type) : '')
    .filter(Boolean)

  const summaryParts = [roleLabel, speedLabel, bulkLabel]
  const summary = preferredTypes.length > 0
    ? `推荐优先围绕 ${preferredTypes.join(' / ')} 本系推进，再用补盲或功能招式补全对局覆盖。`
    : '推荐优先围绕高分输出招式推进，再用功能位补强对局节奏。'

  return {
    roleLabel,
    tags: summaryParts,
    summary,
    notes: '基于本地 learnset / 蛋招、种族值、属性本系与基础补盲关系的启发式推荐，仅作快速参考。',
    moves: selected.slice(0, 4),
  }
}
