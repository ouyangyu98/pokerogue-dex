import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BIOMES_DIR = path.join(__dirname, '../source/pokerogue/src/data/balance/biomes')
const LOCALES_DIR = path.join(__dirname, '../source/pokerogue-locales/zh-Hans')

const NON_BOSS_TIER_PROB = {
  COMMON: 356 / 512,
  UNCOMMON: 124 / 512,
  RARE: 26 / 512,
  SUPER_RARE: 5 / 512,
  ULTRA_RARE: 1 / 512,
}

const BOSS_TIER_PROB = {
  BOSS: 44 / 64,
  BOSS_RARE: 14 / 64,
  BOSS_SUPER_RARE: 5 / 64,
  BOSS_ULTRA_RARE: 1 / 64,
}

function loadBiomeMap() {
  return JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'biomes.json'), 'utf-8'))
}

function toCamelCase(str) {
  const words = str.toLowerCase().split(/[\s_]+/)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0]
  return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

function extractBiomeData(fileContent, biomeMap) {
  const biomeIdMatch = fileContent.match(/biomeId:\s*BiomeId\.([A-Z_]+)/)
  if (!biomeIdMatch) return null
  
  const biomeId = biomeIdMatch[1]
  const camelName = toCamelCase(biomeId)
  
  const linksMatch = fileContent.match(/biomeLinks:\s*\[([^\]]*)\]/)
  const biomeLinks = []
  if (linksMatch) {
    const linkIds = linksMatch[1].match(/BiomeId\.([A-Z_]+)/g)
    if (linkIds) {
      linkIds.forEach(id => {
        const name = id.replace('BiomeId.', '')
        biomeLinks.push(name)
      })
    }
  }
  
  const encounters = []
  const tierRegex = /\[BiomePoolTier\.([A-Z_]+)\]:\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs
  let tierMatch
  
  while ((tierMatch = tierRegex.exec(fileContent)) !== null) {
    const tier = tierMatch[1]
    const tierBlock = tierMatch[2]
    const isBoss = tier.startsWith('BOSS')
    const tierProb = isBoss ? BOSS_TIER_PROB[tier] : NON_BOSS_TIER_PROB[tier]
    
    const timeRegex = /\[TimeOfDay\.([A-Z]+)\]:\s*\[([^\]]*)\]/gs
    let timeMatch
    
    while ((timeMatch = timeRegex.exec(tierBlock)) !== null) {
      const timeOfDay = timeMatch[1]
      const speciesBlock = timeMatch[2]
      const speciesMatches = speciesBlock.match(/SpeciesId\.([A-Z_0-9]+)/g)
      if (!speciesMatches) continue
      
      const speciesList = speciesMatches.map(s => s.replace('SpeciesId.', ''))
      const individualProb = tierProb / speciesList.length
      
      speciesList.forEach(speciesId => {
        encounters.push({
          speciesId,
          poolTier: tier,
          timeOfDay,
          isBoss,
          rarity: biomeMap[tier.toLowerCase()] || tier,
          tierProbability: Math.round(tierProb * 10000) / 100,
          individualProbability: Math.round(individualProb * 10000) / 100,
        })
      })
    }
  }
  
  return {
    id: biomeId,
    nameEn: biomeId.toLowerCase(),
    nameZh: biomeMap[camelName] || biomeId,
    biomeLinks,
    encounters,
  }
}

function main() {
  const biomeMap = loadBiomeMap()
  const files = fs.readdirSync(BIOMES_DIR).filter(f => f.endsWith('.ts'))
  
  const allBiomes = []
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(BIOMES_DIR, file), 'utf-8')
    const biome = extractBiomeData(content, biomeMap)
    if (biome) allBiomes.push(biome)
  }
  
  const totalEncounters = allBiomes.reduce((sum, b) => sum + b.encounters.length, 0)
  const outputPath = path.join(__dirname, '../public/data/biomes.json')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(allBiomes, null, 2))
  
  console.log('Extracted ' + allBiomes.length + ' biomes with ' + totalEncounters + ' encounters')
}

main()
