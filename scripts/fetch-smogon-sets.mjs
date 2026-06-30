import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SMOGON_SETS_URL = 'https://data.pkmn.cc/sets/gen9.json'
const OUTPUT_DIR = path.join(__dirname, '../public/data')

async function fetchSmogonSets() {
  console.log('Fetching Smogon sets from', SMOGON_SETS_URL)
  const response = await fetch(SMOGON_SETS_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'smogon-sets-raw.json'),
    JSON.stringify(data, null, 2)
  )

  console.log(`Downloaded ${Object.keys(data).length} Pokemon sets`)
  return data
}

fetchSmogonSets().catch(err => {
  console.error('Error fetching Smogon sets:', err)
  process.exit(1)
})
