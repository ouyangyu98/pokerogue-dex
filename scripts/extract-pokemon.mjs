import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SOURCE_DIR = path.join(__dirname, '../source/pokerogue/src/data/balance/species')
const LOCALES_DIR = path.join(__dirname, '../source/pokerogue-locales/zh-Hans')
const EGG_MOVES_FILE = path.join(__dirname, '../source/pokerogue/src/data/balance/moves/egg-moves.ts')
const MOVES_FILE = path.join(__dirname, '../source/pokerogue/src/data/moves/move.ts')

function loadJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, filename), 'utf-8'))
}

function toCamelCase(str) {
  const words = str.toLowerCase().split(/[\s_]+/)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0]
  return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

function enumNameToEnglish(id) {
  return id
    .toLowerCase()
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function readSpeciesBlocks(fileContent) {
  const blocks = []
  const marker = 'SpeciesId.'
  let searchIndex = 0

  while (true) {
    const start = fileContent.indexOf(marker, searchIndex)
    if (start === -1) break
    const assignIndex = fileContent.indexOf('= {', start)
    if (assignIndex === -1) break

    const idMatch = fileContent.slice(start, assignIndex).match(/SpeciesId\.([A-Z_0-9]+)/)
    if (!idMatch) {
      searchIndex = start + marker.length
      continue
    }

    let braceDepth = 0
    let i = assignIndex + 2
    for (; i < fileContent.length; i++) {
      const ch = fileContent[i]
      if (ch === '{') braceDepth++
      else if (ch === '}') {
        braceDepth--
        if (braceDepth === 0) {
          if (fileContent.slice(i, i + 3) === '};;') {
            break
          }
          if (fileContent.slice(i, i + 2) === '};') {
            break
          }
        }
      }
    }

    const block = fileContent.slice(assignIndex + 3, i)
    blocks.push({ id: idMatch[1], block })
    searchIndex = i + 2
  }

  return blocks
}

function extractSection(block, key) {
  const keyIndex = block.indexOf(`${key}:`)
  if (keyIndex === -1) return null
  const afterKey = block.slice(keyIndex + key.length + 1).trimStart()
  if (!afterKey.startsWith('[')) return null

  let depth = 0
  let end = 0
  for (; end < afterKey.length; end++) {
    const ch = afterKey[end]
    if (ch === '[') depth++
    else if (ch === ']') {
      depth--
      if (depth === 0) {
        end++
        break
      }
    }
  }

  return afterKey.slice(0, end)
}

function extractObjectSection(block, key) {
  const keyIndex = block.indexOf(`${key}:`)
  if (keyIndex === -1) return null
  const afterKey = block.slice(keyIndex + key.length + 1).trimStart()
  if (!afterKey.startsWith('{')) return null

  let depth = 0
  let end = 0
  for (; end < afterKey.length; end++) {
    const ch = afterKey[end]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        end++
        break
      }
    }
  }

  return afterKey.slice(0, end)
}

function extractSpeciesObject(block) {
  const speciesKeyIndex = block.indexOf('species: new PokemonSpecies({')
  if (speciesKeyIndex === -1) return null
  const start = speciesKeyIndex + 'species: new PokemonSpecies('.length
  const after = block.slice(start).trimStart()
  if (!after.startsWith('{')) return null

  let depth = 0
  let end = 0
  for (; end < after.length; end++) {
    const ch = after[end]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        end++
        break
      }
    }
  }

  return after.slice(0, end)
}

function extractNumber(source, pattern, defaultValue = null) {
  const match = source.match(pattern)
  return match ? Number(match[1]) : defaultValue
}

function extractEnum(source, pattern, defaultValue = null) {
  const match = source.match(pattern)
  return match ? match[1] : defaultValue
}

function extractAbilityValue(block, key) {
  const objectSection = extractObjectSection(block, key)
  if (objectSection) {
    const values = {}
    const regex = /([0-9]+):\s*AbilityId\.([A-Z_0-9]+)/g
    let match
    while ((match = regex.exec(objectSection)) !== null) {
      values[match[1]] = match[2]
    }
    return {
      base: values['0'] || null,
      byForm: values,
    }
  }

  const enumValue = extractEnum(block, new RegExp(`${key}:\\s*AbilityId\\.([A-Z_0-9]+)`))
  return {
    base: enumValue,
    byForm: enumValue ? { '0': enumValue } : {},
  }
}

function loadMoveMeta(moveNameMap) {
  const content = fs.readFileSync(MOVES_FILE, 'utf-8')
  const moveMeta = {}
  const regex = /new\s+(?:AttackMove|StatusMove|SelfStatusMove|FixedDamageMove|VariablePowerMove|ChargingAttackMove|ChargingStatusMove|ChargingSelfStatusMove|ProtectMove|MultiHitMove|TrapMove|WeightPowerMove|RecoilAttackMove|PledgeMove|SacrificialAttackMove|CounterMove|AttackMoveWithTarget|HiddenPowerMove|WeatherMove|TypelessAttackMove|TypelessStatusMove)\(\s*MoveId\.([A-Z_0-9]+),[\s\S]*?\)/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const moveId = match[1]
    const expression = match[0]
    const normalized = expression.replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ')

    let power = null
    let accuracy = null

    let attackMatch = normalized.match(/new\s+(?:AttackMove|FixedDamageMove|VariablePowerMove|ChargingAttackMove|MultiHitMove|TrapMove|WeightPowerMove|RecoilAttackMove|PledgeMove|SacrificialAttackMove|CounterMove|AttackMoveWithTarget|HiddenPowerMove|WeatherMove|TypelessAttackMove)\(\s*MoveId\.[A-Z_0-9]+,\s*[^,]+,\s*[^,]+,\s*(-?\d+),\s*(-?\d+)/)
    if (attackMatch) {
      power = Number(attackMatch[1])
      accuracy = Number(attackMatch[2])
    } else {
      const statusMatch = normalized.match(/new\s+(?:StatusMove|SelfStatusMove|ChargingStatusMove|ChargingSelfStatusMove|ProtectMove|TypelessStatusMove)\(\s*MoveId\.[A-Z_0-9]+,\s*[^,]+,\s*(-?\d+)/)
      if (statusMatch) {
        power = -1
        accuracy = Number(statusMatch[1])
      }
    }

    const typeMatch = normalized.match(/MoveId\.[A-Z_0-9]+,\s*PokemonType\.([A-Z_0-9]+)/)
    const categoryMatch = normalized.match(/MoveId\.[A-Z_0-9]+,\s*PokemonType\.[A-Z_0-9]+,\s*MoveCategory\.([A-Z_0-9]+)/)

    moveMeta[moveId] = {
      moveId,
      moveZh: moveNameMap[moveId] || enumNameToEnglish(moveId),
      type: typeMatch?.[1] || null,
      category: categoryMatch?.[1] || null,
      power: power != null && power >= 0 ? power : null,
      accuracy: accuracy != null && accuracy >= 0 ? accuracy : null,
    }
  }
  return moveMeta
}

function extractLevelMoves(block, moveMetaMap) {
  const section = extractSection(block, 'levelMoves')
  if (!section) return []
  const moves = []
  const regex = /\[(EVOLVE_MOVE|RELEARN_MOVE|\d+),\s*MoveId\.([A-Z_0-9]+)\]/g
  let match
  while ((match = regex.exec(section)) !== null) {
    const rawLevel = match[1]
    const moveId = match[2]
    const moveMeta = moveMetaMap[moveId]
    moves.push({
      level: /^\d+$/.test(rawLevel) ? Number(rawLevel) : rawLevel,
      moveId,
      moveZh: moveMeta?.moveZh || enumNameToEnglish(moveId),
      type: moveMeta?.type ?? null,
      category: moveMeta?.category ?? null,
      power: moveMeta?.power ?? null,
      accuracy: moveMeta?.accuracy ?? null,
    })
  }
  return moves
}

function extractEvolutions(block, speciesNameMap, itemNameMap, evolutionTextMap, moveNameMap, typeNameMap) {
  const section = extractSection(block, 'evolutions')
  if (!section) return []
  const evolutions = []
  const evoRegex = /new\s+(SpeciesEvolution|SpeciesFormEvolution)\s*\(\s*\{([\s\S]*?)\}\s*\)/g
  let match
  while ((match = evoRegex.exec(section)) !== null) {
    const kind = match[1]
    const data = match[2]
    const toSpeciesId = extractEnum(data, /speciesId:\s*SpeciesId\.([A-Z_0-9]+)/)
    const level = extractNumber(data, /level:\s*(\d+)/, 1)
    const item = extractEnum(data, /item:\s*EvolutionItem\.([A-Z_0-9]+)/)
    const preFormKey = extractEnum(data, /preFormKey:\s*"([^"]*)"/)
    const evoFormKey = extractEnum(data, /evoFormKey:\s*"([^"]*)"/)

    const conditions = []
    const conditionSectionIndex = data.indexOf('condition:')
    if (conditionSectionIndex !== -1) {
      const friendship = data.includes('EvoCondKey.FRIENDSHIP')
      if (friendship) conditions.push(evolutionTextMap.friendship || '高亲密度')

      const timeMatch = data.match(/EvoCondKey\.TIME[\s\S]*?time:\s*\[([^\]]+)\]/)
      if (timeMatch) {
        const times = [...timeMatch[1].matchAll(/TimeOfDay\.([A-Z_]+)/g)].map(m => m[1])
        const lastTime = times[times.length - 1]
        const timeKey = lastTime ? lastTime.toLowerCase() : ''
        const timeText = evolutionTextMap.timeOfDay?.[timeKey]
        if (timeText) conditions.push(timeText)
      }

      const moveMatch = data.match(/move:\s*MoveId\.([A-Z_0-9]+)/)
      if (moveMatch) {
        const moveZh = moveNameMap[moveMatch[1]] || enumNameToEnglish(moveMatch[1])
        conditions.push((evolutionTextMap.move || '学会{{move}}招式').replace('{{move}}', moveZh))
      }

      const moveTypeMatch = data.match(/pkmnType:\s*PokemonType\.([A-Z_0-9]+)/)
      if (moveTypeMatch) {
        const typeZh = typeNameMap[moveTypeMatch[1]] || moveTypeMatch[1]
        conditions.push((evolutionTextMap.moveType || '学会{{type}} 属性的招式').replace('{{type}}', typeZh))
      }

      if (data.includes('EvoCondKey.PARTY_TYPE')) {
        const partyTypeMatch = data.match(/pkmnType:\s*PokemonType\.([A-Z_0-9]+)/)
        const typeZh = partyTypeMatch ? (typeNameMap[partyTypeMatch[1]] || partyTypeMatch[1]) : ''
        conditions.push((evolutionTextMap.partyType || '队伍中有{{type}}属性宝可梦').replace('{{type}}', typeZh))
      }

      if (data.includes('EvoCondKey.BIOME')) conditions.push(evolutionTextMap.biome || '在特定环境')
      if (data.includes('EvoCondKey.WEATHER')) conditions.push(evolutionTextMap.weather || '在特定天气下')
      if (data.includes('EvoCondKey.NATURE')) conditions.push(evolutionTextMap.nature || '有指定性格')
      if (data.includes('EvoCondKey.SHEDINJA')) conditions.push(evolutionTextMap.shedinja || '队伍中有空位')
      if (data.includes('EvoCondKey.EVO_TREASURE_TRACKER')) conditions.push(evolutionTextMap.treasure || '在收集足够宝藏后')
      if (data.includes('EvoCondKey.SPECIES_CAUGHT')) conditions.push(evolutionTextMap.caught || '已捕获特定宝可梦')
    }

    const descriptionParts = []
    if (level > 1) {
      descriptionParts.push((evolutionTextMap.atLevel || '在等级{{lv}}').replace('{{lv}}', String(level)))
    } else if (conditions.length > 0 || item) {
      descriptionParts.push(evolutionTextMap.levelUp || '升级')
    }
    if (item) {
      const itemZh = itemNameMap[item] || enumNameToEnglish(item)
      descriptionParts.push((evolutionTextMap.using || '使用{{item}}').replace('{{item}}', itemZh).replace(/\s*\(\{\{tier\}\}\)/, ''))
    }
    descriptionParts.push(...conditions)

    evolutions.push({
      kind,
      toSpeciesId,
      toSpeciesZh: speciesNameMap[toCamelCase(toSpeciesId || '')] || enumNameToEnglish(toSpeciesId || ''),
      level,
      item: item || null,
      itemZh: item ? (itemNameMap[item] || enumNameToEnglish(item)) : null,
      preFormKey: preFormKey ?? null,
      evoFormKey: evoFormKey ?? null,
      conditions,
      descriptionZh: descriptionParts.filter(Boolean).join('，'),
    })
  }

  return evolutions
}

function loadEggMoves(moveMetaMap) {
  const content = fs.readFileSync(EGG_MOVES_FILE, 'utf-8')
  const eggMoves = {}
  const regex = /\[SpeciesId\.([A-Z_0-9]+)\]:\s*\[([^\]]*)\]/g
  let match
  while ((match = regex.exec(content)) !== null) {
    const speciesId = match[1]
    const moves = [...match[2].matchAll(/MoveId\.([A-Z_0-9]+)/g)].map(m => {
      const moveId = m[1]
      const moveMeta = moveMetaMap[moveId]
      return {
        moveId,
        moveZh: moveMeta?.moveZh || enumNameToEnglish(moveId),
        type: moveMeta?.type ?? null,
        category: moveMeta?.category ?? null,
        power: moveMeta?.power ?? null,
        accuracy: moveMeta?.accuracy ?? null,
      }
    })
    eggMoves[speciesId] = moves
  }
  return eggMoves
}

function main() {
  const nameMap = loadJson('pokemon.json')
  const formMapRaw = loadJson('pokemon-form.json')
  const formMap = { ...formMapRaw, ...formMapRaw.battleForm }
  const speciesIds = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/species-ids.json'), 'utf-8'))
  const nameMaps = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/name-maps.json'), 'utf-8'))
  const moveNameMap = nameMaps.move || {}
  const abilityNameMap = nameMaps.ability || {}
  const itemNameMap = nameMaps.evolutionItem || {}
  const evolutionTextMap = nameMaps.evolutionText || {}
  const typeNameMap = nameMaps.type || {}
  const moveMetaMap = loadMoveMeta(moveNameMap)
  const eggMovesMap = loadEggMoves(moveMetaMap)

  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.ts')).sort()
  const allPokemons = []
  const byId = {}

  for (const file of files) {
    const content = fs.readFileSync(path.join(SOURCE_DIR, file), 'utf-8')
    const blocks = readSpeciesBlocks(content)

    for (const { id, block } of blocks) {
      const speciesObject = extractSpeciesObject(block)
      if (!speciesObject) continue

      const nameZh = nameMap[toCamelCase(id)] || id
      const ability1 = extractEnum(speciesObject, /ability1:\s*AbilityId\.([A-Z_0-9]+)/)
      const ability2 = extractEnum(speciesObject, /ability2:\s*AbilityId\.([A-Z_0-9]+)/)
      const abilityHidden = extractEnum(speciesObject, /abilityHidden:\s*AbilityId\.([A-Z_0-9]+)/)
      const passiveValue = extractAbilityValue(block, 'passives')
      const levelMoves = extractLevelMoves(block, moveMetaMap)
      const eggMoves = eggMovesMap[id] || []
      const evolutions = extractEvolutions(block, nameMap, itemNameMap, evolutionTextMap, moveNameMap, typeNameMap)

      const formsSection = extractSection(speciesObject, 'forms')
      const forms = []
      if (formsSection) {
        const formRegex = /new\s+PokemonForm\s*\(\s*\{([\s\S]*?)\}\s*\)/g
        let formMatch
        let formIndex = 0
        while ((formMatch = formRegex.exec(formsSection)) !== null) {
          const formBlock = formMatch[1]
          // formKey can be a string literal or a SpeciesFormKey enum reference
          const formKeyEnum = extractEnum(formBlock, /formKey:\s*SpeciesFormKey\.([A-Z_0-9]+)/)
          const formKeyStr = extractEnum(formBlock, /formKey:\s*"([^"]*)"/, '') || ''
          const formKey = formKeyEnum || formKeyStr
          // for enum-based formKeys (e.g. GIGANTAMAX), convert to camelCase for locale lookup
          const formKeyCamel = formKey ? toCamelCase(formKey) : ''
          const formKeyMapKey = formKeyCamel ? `${toCamelCase(id)}${formKeyCamel.charAt(0).toUpperCase()}${formKeyCamel.slice(1)}` : ''
          // also extract formName from source as fallback
          const formName = extractEnum(formBlock, /formName:\s*"([^"]*)"/, '') || ''
          forms.push({
            formIndex,
            formKey,
            formName: formName || '',
            formNameZh: formMap[formKeyMapKey] || formMap[formKeyCamel] || formMap[formKey] || (formName ? formName : (formKey ? formKey : '普通')),
            type1: extractEnum(formBlock, /type1:\s*PokemonType\.([A-Z_0-9]+)/),
            type2: extractEnum(formBlock, /type2:\s*PokemonType\.([A-Z_0-9]+)/),
            ability1: extractEnum(formBlock, /ability1:\s*AbilityId\.([A-Z_0-9]+)/),
            ability2: extractEnum(formBlock, /ability2:\s*AbilityId\.([A-Z_0-9]+)/),
            abilityHidden: extractEnum(formBlock, /abilityHidden:\s*AbilityId\.([A-Z_0-9]+)/),
            passive: passiveValue.byForm[String(formIndex)] || passiveValue.base || null,
            baseTotal: extractNumber(formBlock, /baseTotal:\s*(\d+)/, 0),
            baseHp: extractNumber(formBlock, /baseHp:\s*(\d+)/, 0),
            baseAtk: extractNumber(formBlock, /baseAtk:\s*(\d+)/, 0),
            baseDef: extractNumber(formBlock, /baseDef:\s*(\d+)/, 0),
            baseSpatk: extractNumber(formBlock, /baseSpatk:\s*(\d+)/, 0),
            baseSpdef: extractNumber(formBlock, /baseSpdef:\s*(\d+)/, 0),
        baseSpd: extractNumber(formBlock, /baseSpd:\s*(\d+)/, 0),
        catchRate: extractNumber(formBlock, /catchRate:\s*(\d+)/, 0),
      })
          formIndex++
        }
      }

      const pokemon = {
        id,
        numericId: speciesIds[id] ?? 0,
        nameEn: enumNameToEnglish(id),
        nameZh,
        generation: extractNumber(speciesObject, /generation:\s*(\d+)/, 1),
        type1: extractEnum(speciesObject, /type1:\s*PokemonType\.([A-Z_0-9]+)/),
        type2: extractEnum(speciesObject, /type2:\s*PokemonType\.([A-Z_0-9]+)/),
        baseTotal: extractNumber(speciesObject, /baseTotal:\s*(\d+)/, 0),
        baseHp: extractNumber(speciesObject, /baseHp:\s*(\d+)/, 0),
        baseAtk: extractNumber(speciesObject, /baseAtk:\s*(\d+)/, 0),
        baseDef: extractNumber(speciesObject, /baseDef:\s*(\d+)/, 0),
        baseSpatk: extractNumber(speciesObject, /baseSpatk:\s*(\d+)/, 0),
        baseSpdef: extractNumber(speciesObject, /baseSpdef:\s*(\d+)/, 0),
        baseSpd: extractNumber(speciesObject, /baseSpd:\s*(\d+)/, 0),
        catchRate: extractNumber(speciesObject, /catchRate:\s*(\d+)/, 0),
        ability1,
        ability1Zh: abilityNameMap[ability1] || ability1 || '-',
        ability2,
        ability2Zh: ability2 && ability2 !== 'NONE' ? (abilityNameMap[ability2] || ability2) : '-',
        abilityHidden,
        abilityHiddenZh: abilityHidden ? (abilityNameMap[abilityHidden] || abilityHidden) : '-',
        starter: extractEnum(block, /starter:\s*SpeciesId\.([A-Z_0-9]+)/),
        starterCost: extractNumber(block, /starterCost:\s*(\d+)/),
        passive: passiveValue.base,
        passiveZh: passiveValue.base ? (abilityNameMap[passiveValue.base] || passiveValue.base) : '-',
        passiveByForm: passiveValue.byForm,
        eggTier: extractEnum(block, /eggTier:\s*EggTier\.([A-Z_0-9]+)/),
        forms,
        evolutions,
        levelMoves,
        eggMoves,
        hasEggMoves: eggMoves.length > 0,
      }

      allPokemons.push(pokemon)
      byId[id] = pokemon
    }
  }

  for (const pokemon of allPokemons) {
    if (!pokemon.starterCost && pokemon.starter && byId[pokemon.starter]?.starterCost) {
      pokemon.starterCost = byId[pokemon.starter].starterCost
    }
    if ((!pokemon.passive || pokemon.passive === 'NONE') && pokemon.starter && byId[pokemon.starter]?.passive) {
      pokemon.passive = byId[pokemon.starter].passive
      pokemon.passiveZh = byId[pokemon.starter].passiveZh
    }
    if ((!pokemon.eggMoves || pokemon.eggMoves.length === 0) && pokemon.starter && byId[pokemon.starter]?.eggMoves?.length) {
      pokemon.eggMoves = byId[pokemon.starter].eggMoves
      pokemon.hasEggMoves = pokemon.eggMoves.length > 0
    }
    // 计算满血无异常状态下的默认捕捉概率（普通精灵球倍率=1）
    // 公式：modifiedCatchRate = catchRate * 1/3（满血时 (3M - 2H) / 3M = 1/3）
    // shakeProbability = 65536 / (255 / modifiedCatchRate)^0.1875
    // 实际捕捉概率 = (shakeProbability / 65536)^4
    const catchRate = pokemon.catchRate || 0
    const modifiedCatchRate = Math.round(catchRate / 3)
    if (modifiedCatchRate > 0) {
      const shakeProbability = Math.round(65536 / Math.pow(255 / modifiedCatchRate, 0.1875))
      const catchProb = Math.pow(shakeProbability / 65536, 4)
      pokemon.catchProbability = Math.round(catchProb * 10000) / 10000
    } else {
      pokemon.catchProbability = 0
    }
  }

  let mapped = 0
  for (const p of allPokemons) {
    if (p.nameZh !== p.id) mapped++
  }
  console.log('Chinese name mapping coverage: ' + mapped + '/' + allPokemons.length + ' (' + Math.round(mapped / allPokemons.length * 100) + '%)')

  const outputPath = path.join(__dirname, '../public/data/pokemon.json')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(allPokemons, null, 2))

  console.log('Extracted ' + allPokemons.length + ' pokemon with core details')
}

main()
