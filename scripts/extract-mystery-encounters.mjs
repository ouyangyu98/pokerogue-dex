import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { mysteryEncounterLogicDetails } from './mystery-encounter-logic.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const sourceRoot = process.env.POKEROGUE_SOURCE_DIR
  ? path.resolve(process.env.POKEROGUE_SOURCE_DIR)
  : path.join(rootDir, 'source/pokerogue')
const localeRoot = process.env.POKEROGUE_LOCALES_DIR
  ? path.resolve(process.env.POKEROGUE_LOCALES_DIR)
  : path.join(rootDir, 'source/pokerogue-locales')

const encountersDir = path.join(sourceRoot, 'src/data/mystery-encounters/encounters')
const registryPath = path.join(sourceRoot, 'src/data/mystery-encounters/mystery-encounters.ts')
const biomeLocalePath = path.join(localeRoot, 'zh-Hans/biomes.json')
const eventLocaleDir = path.join(localeRoot, 'zh-Hans/mystery-encounters')
const outputPath = path.join(rootDir, 'public/data/mystery-encounters.json')

const tierLabels = {
  COMMON: '普通',
  GREAT: '高级',
  ULTRA: '超级',
  ROGUE: '肉鸽',
  MASTER: '大师',
}

const typeLabels = {
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
}

function camelToKebab(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

function snakeToCamel(value) {
  return value.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function cleanDialogue(value) {
  return String(value || '')
    .replace(/{{pokemon([1-3])Name}}/g, (_, index) => `随机宝可梦 ${index}`)
    .replace(/{{greedentName}}/g, '贪心栗鼠')
    .replace(/{{snorlaxName}}/g, '卡比兽')
    .replace(/{{(?:pokeName|chosenPokemon|option\d+PrimaryName)}}/g, '所选宝可梦')
    .replace(/{{pokemonName}}/g, '目标宝可梦')
    .replace(/{{(?:speciesName|move|foodReward|eggs|rarity)}}/g, '对应奖励')
    .replace(/{{[^}]+}}/g, '相关宝可梦')
    .replace(/\$@s{[^}]+}/g, '\n')
    .replace(/\$/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function arraySection(source, variableName) {
  const match = source.match(new RegExp(`(?:const|export const)\\s+${variableName}[^=]*=\\s*\\[([\\s\\S]*?)\\];`))
  return match?.[1] || ''
}

function eventIdsIn(source) {
  return unique([...source.matchAll(/MysteryEncounterType\.([A-Z_]+)/g)].map(match => match[1]))
}

function biomeIdsIn(source) {
  return unique([...source.matchAll(/BiomeId\.([A-Z_]+)/g)].map(match => match[1]))
}

function addEventsToBiomes(eventBiomes, eventIds, biomeIds) {
  for (const eventId of eventIds) {
    if (!eventBiomes.has(eventId)) eventBiomes.set(eventId, new Set())
    biomeIds.forEach(biomeId => eventBiomes.get(eventId).add(biomeId))
  }
}

function buildBiomeAvailability(registrySource) {
  const eventBiomes = new Map()
  const biomeGroups = {
    extremeBiomeEncounters: biomeIdsIn(arraySection(registrySource, 'EXTREME_ENCOUNTER_BIOMES')),
    nonExtremeBiomeEncounters: biomeIdsIn(arraySection(registrySource, 'NON_EXTREME_ENCOUNTER_BIOMES')),
    humanTransitableBiomeEncounters: biomeIdsIn(arraySection(registrySource, 'HUMAN_TRANSITABLE_BIOMES')),
    civilizationBiomeEncounters: biomeIdsIn(arraySection(registrySource, 'CIVILIZATION_ENCOUNTER_BIOMES')),
  }

  for (const [encounterGroup, biomeIds] of Object.entries(biomeGroups)) {
    addEventsToBiomes(eventBiomes, eventIdsIn(arraySection(registrySource, encounterGroup)), biomeIds)
  }

  const allBiomes = unique([...registrySource.matchAll(/\[BiomeId\.([A-Z_]+),/g)].map(match => match[1]))
  addEventsToBiomes(eventBiomes, eventIdsIn(arraySection(registrySource, 'anyBiomeEncounters')), allBiomes)

  for (const match of registrySource.matchAll(/\[BiomeId\.([A-Z_]+),\s*\[([\s\S]*?)\]\]/g)) {
    addEventsToBiomes(eventBiomes, eventIdsIn(match[2]), [match[1]])
  }

  return eventBiomes
}

function getBuilderHeader(source) {
  const start = source.indexOf('MysteryEncounterBuilder.withEncounterType')
  const optionStart = source.indexOf('.withOption(', start)
  return source.slice(start, optionStart === -1 ? source.length : optionStart)
}

function parseWaveRange(header) {
  const match = header.match(/\.withSceneWaveRangeRequirement\(([^)]*)\)/)
  if (!match) return {}
  const args = match[1]
  if (args.includes('...CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES')) {
    return { waveMin: 10, waveMax: 180 }
  }

  const normalized = args
    .replace(/CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES\[0\]/g, '10')
    .replace(/CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES\[1\]/g, '180')
  const values = normalized.match(/\d+/g)?.map(Number) || []
  if (values.length === 0) return {}
  return { waveMin: values[0], waveMax: values[1] ?? values[0] }
}

function rangeLabel(min, max, unit) {
  if (min === max) return `${unit}为 ${min}`
  return `${unit}为 ${min}-${max}`
}

function describeRequirements(block) {
  const conditions = []

  for (const match of block.matchAll(/(?:withScenePartySizeRequirement\(|new PartySizeRequirement\(\[)\s*(\d+)\s*,\s*(\d+)/g)) {
    conditions.push(rangeLabel(Number(match[1]), Number(match[2]), '队伍数量'))
  }

  for (const match of block.matchAll(/new PersistentModifierRequirement\(\s*"([^"]+)"(?:\s*,\s*(\d+))?/g)) {
    const itemName = match[1] === 'BerryModifier' ? '树果' : match[1].replace(/Modifier$/, '')
    conditions.push(`持有 ${itemName}至少 ${match[2] || 1} 个`)
  }

  for (const match of block.matchAll(/new MoneyRequirement\(\s*([^,)]+)(?:\s*,\s*([^)]+))?/g)) {
    const amount = Number(match[1])
    if (amount > 0) {
      conditions.push(`持有至少 ${amount} 金钱`)
    } else if (match[2]) {
      conditions.push('持有足够金钱（金额随当前波次变化）')
    }
  }

  for (const match of block.matchAll(/new WaveModulusRequirement\(\s*\[([^\]]+)\]\s*,\s*(\d+)/g)) {
    const values = match[1].match(/\d+/g)?.join('、')
    conditions.push(`波次尾数为 ${values}（每 ${match[2]} 波循环）`)
  }

  for (const match of block.matchAll(/new TypeRequirement\(\s*PokemonType\.([A-Z_]+)/g)) {
    conditions.push(`队伍中需有 ${typeLabels[match[1]] || match[1]}属性宝可梦`)
  }

  for (const match of block.matchAll(/new HealthRatioRequirement\(\s*\[([0-9.]+)\s*,\s*([0-9.]+)\]/g)) {
    conditions.push(`队伍中需有 HP 处于 ${Math.round(Number(match[1]) * 100)}%-${Math.round(Number(match[2]) * 100)}% 的宝可梦`)
  }

  if (/new (?:MoveRequirement|CanLearnMoveRequirement)\(/.test(block)) {
    conditions.push('队伍中需有满足指定招式条件的宝可梦')
  }
  if (/new HeldItemRequirement\(/.test(block)) {
    conditions.push('队伍中需有满足携带道具条件的宝可梦')
  }
  if (/new StatusEffectRequirement\(/.test(block)) {
    conditions.push('队伍中需有满足状态条件的宝可梦')
  }
  if (/new SpeciesRequirement\(/.test(block)) {
    conditions.push('队伍中需有满足物种条件的宝可梦')
  }

  return unique(conditions)
}

function optionBuilderBlock(source, markerPosition) {
  const regular = source.lastIndexOf('new MysteryEncounterOptionBuilder', markerPosition)
  const mode = source.lastIndexOf('MysteryEncounterOptionBuilder.newOptionWithMode', markerPosition)
  const start = Math.max(regular, mode)
  return start === -1 ? '' : source.slice(start, markerPosition)
}

function getOptionConditions(source, optionIndex) {
  const marker = new RegExp(`buttonLabel:\\s*\\x60\\$\\{namespace\\}:option\\.${optionIndex}\\.label\\x60`)
  const match = marker.exec(source)
  return match ? describeRequirements(optionBuilderBlock(source, match.index)) : []
}

function parseEvent(sourceFile, registryBiomes, biomeNames) {
  const source = fs.readFileSync(sourceFile, 'utf-8')
  const namespaceMatch = source.match(/const namespace = "mysteryEncounters\/([^"]+)"/)
  const idMatch = source.match(/withEncounterType\(\s*MysteryEncounterType\.([A-Z_]+)/)
  const tierMatch = source.match(/withEncounterTier\(MysteryEncounterTier\.([A-Z_]+)/)
  if (!namespaceMatch || !idMatch || !tierMatch) {
    throw new Error(`Unable to parse event metadata: ${path.basename(sourceFile)}`)
  }

  const localeName = `${camelToKebab(namespaceMatch[1])}-dialogue.json`
  const localePath = path.join(eventLocaleDir, localeName)
  if (!fs.existsSync(localePath)) {
    throw new Error(`Missing Chinese locale file: ${localeName}`)
  }
  const locale = JSON.parse(fs.readFileSync(localePath, 'utf-8'))
  const header = getBuilderHeader(source)
  const { waveMin, waveMax } = parseWaveRange(header)
  const options = Object.entries(locale.option || {})
    .filter(([index]) => /^\d+$/.test(index))
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([index, option]) => {
      const optionIndex = Number(index)
      const logicDetails = mysteryEncounterLogicDetails[idMatch[1]]?.[optionIndex]
      if (!logicDetails?.length) throw new Error(`Missing source logic summary: ${idMatch[1]}.${optionIndex}`)
      return {
        index: optionIndex,
        label: cleanDialogue(option.label),
        tooltip: cleanDialogue(option.tooltip || option.tooltipBase),
        disabledTooltip: cleanDialogue(option.disabledTooltip),
        selectedText: cleanDialogue(option.selected),
        conditions: getOptionConditions(source, index),
        effectSummary: cleanDialogue(option.tooltip || option.tooltipBase),
        logicDetails,
      }
    })

  if (!locale.title || !locale.description || options.length < 2 || options.some(option => !option.label)) {
    throw new Error(`Incomplete localized content: ${localeName}`)
  }

  const id = idMatch[1]
  const biomeIds = [...(registryBiomes.get(id) || [])].sort()
  return {
    id,
    sourceFile: path.relative(rootDir, sourceFile),
    nameZh: cleanDialogue(locale.title),
    description: cleanDialogue(locale.description),
    query: cleanDialogue(locale.query),
    tier: tierMatch[1],
    tierLabel: tierLabels[tierMatch[1]] || tierMatch[1],
    ...(waveMin !== undefined ? { waveMin, waveMax } : {}),
    biomes: biomeIds.map(biomeId => ({
      id: biomeId,
      nameZh: biomeNames[snakeToCamel(biomeId)] || biomeId,
    })),
    eventConditions: describeRequirements(header),
    catchAllowed: /\.withCatchAllowed\(true\)/.test(header),
    fleeAllowed: !/\.withFleeAllowed\(false\)/.test(header),
    options,
  }
}

function main() {
  const registrySource = fs.readFileSync(registryPath, 'utf-8')
  const registryBiomes = buildBiomeAvailability(registrySource)
  const biomeNames = JSON.parse(fs.readFileSync(biomeLocalePath, 'utf-8'))
  const sourceFiles = fs.readdirSync(encountersDir)
    .filter(name => name.endsWith('-encounter.ts'))
    .sort()
    .map(name => path.join(encountersDir, name))

  const events = sourceFiles
    .map(sourceFile => parseEvent(sourceFile, registryBiomes, biomeNames))
    .sort((a, b) => a.nameZh.localeCompare(b.nameZh, 'zh-CN'))

  if (events.length !== 31 || new Set(events.map(event => event.id)).size !== events.length) {
    throw new Error(`Expected 31 unique mystery encounters, received ${events.length}`)
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(events, null, 2)}\n`)
  console.log(`Generated ${events.length} mystery encounters at ${path.relative(rootDir, outputPath)}`)
}

main()
