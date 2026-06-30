import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = path.join(__dirname, '../source/pokerogue-locales/zh-Hans')
const EN_LOCALES_DIR = path.join(__dirname, '../source/pokerogue-locales/en')

function loadJson(filename, baseDir = LOCALES_DIR) {
  return JSON.parse(fs.readFileSync(path.join(baseDir, filename), 'utf-8'))
}

function camelToUpperSnake(key) {
  return key.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '')
}

/**
 * 清洗技能效果描述：
 * 1. 换行符 → 空格（适配表格单行展示）
 * 2. 移除"对Boss无效"及后续游戏内机制注释
 * 3. 全角字母数字 → 半角（ＨＰ→HP、１→1）
 * 4. 压缩多余空白
 */
function cleanMoveEffect(raw) {
  if (!raw || !raw.trim()) return ''
  let s = raw
  // 移除 "对Boss无效" 及其后的注释内容（到段落末尾或下一个句子之前）
  s = s.replace(/\s*[，,]?\s*对Boss无效[^。]*[。]?/g, '')
  s = s.replace(/\s*对Boss无效[^。]*[。]?/g, '')
  // 换行符 → 空格
  s = s.replace(/\n/g, ' ')
  // 全角字母数字 → 半角
  s = s.replace(/[Ａ-Ｚａ-ｚ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
  s = s.replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
  // 压缩多余空白（保留单个空格）
  s = s.replace(/[ \t]+/g, ' ').trim()
  return s
}

const pokemonMap = loadJson('pokemon.json')
const abilityMap = loadJson('ability.json')
const moveMap = loadJson('move.json')
const enMoveMap = loadJson('move.json', EN_LOCALES_DIR)
const biomeMap = loadJson('biomes.json')
const pokemonInfoMap = loadJson('pokemon-info.json')
const pokemonEvolutionMap = loadJson('pokemon-evolutions.json')
const modifierTypeMap = loadJson('modifier-type.json')

const abilityNameMap = {}
const abilityDescriptionMap = {}
for (const [key, value] of Object.entries(abilityMap)) {
  const abilityId = camelToUpperSnake(key)
  abilityNameMap[abilityId] = value.name
  abilityDescriptionMap[abilityId] = value.description || ''
}
abilityNameMap.NONE = '无'
abilityDescriptionMap.NONE = ''

const moveNameMap = {}
const moveEffectMap = {}

// 加载中文效果补充翻译（覆盖 zh-Hans/move.json 中缺失 effect 的条目）
let moveEffectSupplement = {}
try {
  const supPath = path.join(__dirname, '../data/move-effect-supplement.json')
  moveEffectSupplement = JSON.parse(fs.readFileSync(supPath, 'utf-8'))
  console.log(`Loaded ${Object.keys(moveEffectSupplement).length} supplemental move effect translations`)
} catch (e) {
  console.log('No supplemental move effect file found, skipping.')
}

for (const [key, value] of Object.entries(moveMap)) {
  const moveId = camelToUpperSnake(key)
  moveNameMap[moveId] = value.name
  // 优先级：中文 locale > 中文补充翻译 > 英文 locale > 空
  let effect = value.effect || ''
  if (!effect.trim()) {
    effect = moveEffectSupplement[moveId] || ''
  }
  if (!effect.trim() && enMoveMap[key]?.effect) {
    effect = enMoveMap[key].effect
  }
  moveEffectMap[moveId] = cleanMoveEffect(effect)
}
// 处理仅在英文中存在而中文中没有的条目
for (const [key, value] of Object.entries(enMoveMap)) {
  const moveId = camelToUpperSnake(key)
  if (!(moveId in moveEffectMap) && value.effect) {
    const supEffect = moveEffectSupplement[moveId] || ''
    moveEffectMap[moveId] = cleanMoveEffect(supEffect || value.effect)
    if (!(moveId in moveNameMap)) {
      moveNameMap[moveId] = value.name || key
    }
  }
}
moveNameMap.NONE = '无'
moveEffectMap.NONE = ''

const biomeNameMap = {}
for (const [key, value] of Object.entries(biomeMap)) {
  if (typeof value === 'string' && !['common', 'uncommon', 'rare', 'superRare', 'ultraRare', 'boss', 'bossRare', 'bossSuperRare', 'bossUltraRare'].includes(key)) {
    biomeNameMap[camelToUpperSnake(key)] = value
  }
}

const typeNameMap = {}
for (const [key, value] of Object.entries(pokemonInfoMap.type || {})) {
  typeNameMap[key.toUpperCase()] = value
}

const evolutionItemMap = modifierTypeMap.EvolutionItem || {}

const nameMaps = {
  pokemon: pokemonMap,
  ability: abilityNameMap,
  abilityDescription: abilityDescriptionMap,
  move: moveNameMap,
  moveEffect: moveEffectMap,
  biome: biomeNameMap,
  type: typeNameMap,
  evolutionItem: evolutionItemMap,
  evolutionText: pokemonEvolutionMap,
}

const outputPath = path.join(__dirname, '../public/data/name-maps.json')
fs.writeFileSync(outputPath, JSON.stringify(nameMaps, null, 2))

console.log('Pokemon names: ' + Object.keys(pokemonMap).length)
console.log('Ability names: ' + Object.keys(abilityNameMap).length)
console.log('Move names: ' + Object.keys(moveNameMap).length)
console.log('Move effects: ' + Object.keys(moveEffectMap).length)
const effectCount = Object.values(moveEffectMap).filter(v => v.trim()).length
console.log('Move effects (non-empty): ' + effectCount)
console.log('Biome names: ' + Object.keys(biomeNameMap).length)
console.log('Sample ability: OVERGROW=' + abilityNameMap.OVERGROW)
console.log('Sample move: TACKLE=' + moveNameMap.TACKLE)
console.log('Sample moveEffect: WATER_SPOUT=' + (moveEffectMap.WATER_SPOUT || '(empty)'))
console.log('Sample item: THUNDER_STONE=' + evolutionItemMap.THUNDER_STONE)
