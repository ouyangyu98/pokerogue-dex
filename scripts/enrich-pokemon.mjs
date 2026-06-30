import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

const rarityLabelMap = {
  COMMON: '普通',
  UNCOMMON: '罕见',
  RARE: '稀有',
  SUPER_RARE: '非常稀有',
  ULTRA_RARE: '极其稀有',
  BOSS: 'Boss',
  BOSS_RARE: 'Boss：稀有',
  BOSS_SUPER_RARE: 'Boss：非常稀有',
  BOSS_ULTRA_RARE: 'Boss：极其稀有',
}

console.log('=== Enriching pokemon with numeric IDs, biome locations, and derived fields ===')

const speciesIds = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/data/species-ids.json'), 'utf-8'))
const biomes = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/data/biomes.json'), 'utf-8'))
const pokemons = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/data/pokemon.json'), 'utf-8'))

for (const p of pokemons) {
  p.numericId = speciesIds[p.id] || 0

  const foundBiomes = []
  const rarityMap = new Map()
  for (const biome of biomes) {
    const biomeEncounters = biome.encounters.filter(e => e.speciesId === p.id)
    if (biomeEncounters.length > 0) {
      const rarityLabels = Array.from(new Set(biomeEncounters.map(e => rarityLabelMap[e.poolTier] || e.rarity))).filter(Boolean)
      foundBiomes.push({
        id: biome.id,
        nameZh: biome.nameZh,
        rarities: rarityLabels,
      })
      rarityLabels.forEach(rarity => {
        const current = rarityMap.get(rarity) || 0
        rarityMap.set(rarity, current + 1)
      })
    }
  }
  p.biomes = foundBiomes
  p.biomeRarities = Array.from(rarityMap.keys())
  p.primaryBiomeRarity = Array.from(rarityMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  p.isFinalEvolution = (p.evolutions?.length || 0) === 0
}

fs.writeFileSync(path.join(rootDir, 'public/data/pokemon.json'), JSON.stringify(pokemons, null, 2))
console.log('Enriched ' + pokemons.length + ' pokemons with numericId, biomes, biomeRarities, primaryBiomeRarity, isFinalEvolution')
