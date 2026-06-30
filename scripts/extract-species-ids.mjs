import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SPECIES_ID_FILE = path.join(__dirname, '../source/pokerogue/src/enums/species-id.ts')

function extractSpeciesIds(content) {
  const speciesIds = {}
  const lines = content.split('\n')
  let currentId = 0
  
  for (const line of lines) {
    // 匹配格式: NAME = number, 或 NAME,
    const match = line.match(/^\s+([A-Z_][A-Z_0-9]*)\s*(?:=\s*(\d+))?\s*,?\s*$/)
    if (match) {
      const name = match[1]
      if (match[2]) {
        currentId = parseInt(match[2])
      } else {
        currentId++
      }
      speciesIds[name] = currentId
    }
  }
  
  return speciesIds
}

const content = fs.readFileSync(SPECIES_ID_FILE, 'utf-8')
const speciesIds = extractSpeciesIds(content)

const outputPath = path.join(__dirname, '../public/data/species-ids.json')
fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, JSON.stringify(speciesIds, null, 2))

console.log('Extracted ' + Object.keys(speciesIds).length + ' species IDs')
console.log('Sample: BULBASAUR=' + speciesIds.BULBASAUR + ', ALOLA_RATTATA=' + speciesIds.ALOLA_RATTATA)
