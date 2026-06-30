// Pokemon data utilities: evolution chain, filtering

export interface ChainNode {
  id: string
  nameZh: string
  nameEn: string
}

export interface EvolutionRelation {
  evolvesTo: Map<string, string[]>
  evolvesFrom: Map<string, string[]>
}

/** From a flat pokemon list, build forward/backward evolution maps */
export function normalizeChainMap(pokemons: Array<{ id: string; evolutions?: Array<{ toSpeciesId: string }> }>) {
  const evolvesTo = new Map<string, string[]>()
  const evolvesFrom = new Map<string, string[]>()

  for (const p of pokemons) {
    evolvesTo.set(p.id, (p.evolutions || []).map(e => e.toSpeciesId))
    for (const evo of p.evolutions || []) {
      const list = evolvesFrom.get(evo.toSpeciesId) || []
      list.push(p.id)
      evolvesFrom.set(evo.toSpeciesId, list)
    }
  }

  return { evolvesTo, evolvesFrom }
}

/** BFS-based evolution path builder */
export function buildEvolutionPaths(
  currentId: string,
  pokemonMap: Map<string, { nameZh: string; nameEn: string }>,
  evolvesTo: Map<string, string[]>,
  evolvesFrom: Map<string, string[]>,
): ChainNode[][] {
  function findRoots(id: string, visited = new Set<string>()): string[] {
    if (visited.has(id)) return [id]
    visited.add(id)
    const prev = evolvesFrom.get(id) || []
    if (prev.length === 0) return [id]
    return prev.flatMap(parent => findRoots(parent, new Set(visited)))
  }

  function walk(id: string, path: string[], visited = new Set<string>()): string[][] {
    if (visited.has(id)) return [path]
    const nextVisited = new Set(visited)
    nextVisited.add(id)
    const next = evolvesTo.get(id) || []
    if (next.length === 0) return [path]
    return next.flatMap(child => walk(child, [...path, child], nextVisited))
  }

  const roots = Array.from(new Set(findRoots(currentId)))
  const paths = roots.flatMap(root => walk(root, [root]))

  return paths.map(path => path.map(id => {
    const pokemon = pokemonMap.get(id)
    return { id, nameZh: pokemon?.nameZh || id, nameEn: pokemon?.nameEn || id }
  }))
}

export const eggTierNames: Record<string, string> = {
  COMMON: '普通',
  GREAT: '高级',
  ULTRA: '超级',
  RARE: '稀有',
}

export const rarityOrder: Record<string, number> = {
  '普通': 1,
  '罕见': 2,
  '稀有': 3,
  '非常稀有': 4,
  '极其稀有': 5,
  'Boss': 6,
  'Boss：稀有': 7,
  'Boss：非常稀有': 8,
  'Boss：极其稀有': 9,
}

export function inRange(value: number, minText: string, maxText: string) {
  const min = minText.trim() === '' ? null : Number(minText)
  const max = maxText.trim() === '' ? null : Number(maxText)
  if (min !== null && value < min) return false
  if (max !== null && value > max) return false
  return true
}
