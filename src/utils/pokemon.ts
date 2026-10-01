// Pokemon data utilities: evolution chain, filtering

import type { EvolutionEntry } from '../types'

export interface ChainNode {
  id: string
  nameZh: string
  nameEn: string
  evolution?: EvolutionEntry
}

export interface EvolutionRelation {
  evolvesTo: Map<string, string[]>
  evolvesFrom: Map<string, string[]>
  evolutionsByFrom: Map<string, EvolutionEntry[]>
}

/** From a flat pokemon list, build forward/backward evolution maps */
export function normalizeChainMap(pokemons: Array<{ id: string; evolutions?: EvolutionEntry[] }>): EvolutionRelation {
  const evolvesTo = new Map<string, string[]>()
  const evolvesFrom = new Map<string, string[]>()
  const evolutionsByFrom = new Map<string, EvolutionEntry[]>()

  for (const p of pokemons) {
    const evolutions = p.evolutions || []
    const uniqueEvolutions = evolutions.filter((evo, index, all) => all.findIndex(candidate => (
      candidate.toSpeciesId === evo.toSpeciesId && candidate.descriptionZh === evo.descriptionZh
    )) === index)
    evolutionsByFrom.set(p.id, uniqueEvolutions)
    evolvesTo.set(p.id, uniqueEvolutions.map(e => e.toSpeciesId))
    for (const evo of uniqueEvolutions) {
      const list = evolvesFrom.get(evo.toSpeciesId) || []
      if (!list.includes(p.id)) list.push(p.id)
      evolvesFrom.set(evo.toSpeciesId, list)
    }
  }

  return { evolvesTo, evolvesFrom, evolutionsByFrom }
}

/** BFS-based evolution path builder */
export function buildEvolutionPaths(
  currentId: string,
  pokemonMap: Map<string, { nameZh: string; nameEn: string }>,
  evolvesTo: Map<string, string[]>,
  evolvesFrom: Map<string, string[]>,
  evolutionsByFrom: Map<string, EvolutionEntry[]> = new Map(),
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
    const parentId = path[path.indexOf(id) - 1]
    const evolution = parentId
      ? evolutionsByFrom.get(parentId)?.find(entry => entry.toSpeciesId === id)
      : undefined
    return { id, nameZh: pokemon?.nameZh || id, nameEn: pokemon?.nameEn || id, evolution }
  }))
}

/** Convert the raw evolution entry into short labels that fit beside a path. */
export function getEvolutionConditionLabels(evolution?: EvolutionEntry): string[] {
  if (!evolution) return []

  const labels: string[] = []
  if (evolution.level > 1) labels.push(`等级 ${evolution.level}`)
  if (evolution.itemZh) labels.push(`使用 ${evolution.itemZh}`)
  if (evolution.conditions.length > 0) {
    if (evolution.level <= 1 && !evolution.itemZh) labels.push('升级')
    labels.push(...evolution.conditions)
  }
  if (labels.length === 0 && evolution.descriptionZh) labels.push(evolution.descriptionZh)
  return labels
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
