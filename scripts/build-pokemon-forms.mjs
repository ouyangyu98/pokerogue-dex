import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const dataDir = path.join(rootDir, 'public', 'data')
const pokemonPath = path.join(dataDir, 'pokemon.json')
const nameMapsPath = path.join(dataDir, 'name-maps.json')
const outputPath = path.join(dataDir, 'pokemon-forms.json')

function formId(baseId, formKey) {
  return `${baseId}--${formKey.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`
}

function formLabel(value) {
  return String(value || '')
    .replace(/超級/g, '超级')
    .replace(/Ｘ/g, 'X')
    .replace(/Ｙ/g, 'Y')
}

function abilityName(id, names) {
  return id && id !== 'NONE' ? (names[id] || id) : '-'
}

function catchProbability(catchRate) {
  const modifiedCatchRate = Math.round(Number(catchRate || 0) / 3)
  if (modifiedCatchRate <= 0) return 0
  const shakeProbability = Math.round(65536 / Math.pow(255 / modifiedCatchRate, 0.1875))
  return Math.round(Math.pow(shakeProbability / 65536, 4) * 10000) / 10000
}

const pokemons = JSON.parse(fs.readFileSync(pokemonPath, 'utf-8'))
const nameMaps = JSON.parse(fs.readFileSync(nameMapsPath, 'utf-8'))
const abilityNames = nameMaps.ability || {}

const forms = pokemons.flatMap(base => (base.forms || [])
  .filter(form => form.formIndex > 0 && form.formKey)
  .map(form => {
    const ability1 = form.ability1 ?? base.ability1
    const ability2 = form.ability2 ?? base.ability2
    const abilityHidden = form.abilityHidden ?? base.abilityHidden
    const passive = form.passive ?? base.passive
    const label = formLabel(form.formNameZh || form.formKey)
    const catchRate = form.catchRate ?? base.catchRate

    return {
      ...base,
      id: formId(base.id, form.formKey),
      nameZh: `${base.nameZh}·${label}`,
      nameEn: `${base.nameEn} ${form.formName || form.formKey.replace(/_/g, ' ')}`,
      type1: form.type1 ?? base.type1,
      type2: form.type2 ?? base.type2,
      baseTotal: form.baseTotal ?? base.baseTotal,
      baseHp: form.baseHp ?? base.baseHp,
      baseAtk: form.baseAtk ?? base.baseAtk,
      baseDef: form.baseDef ?? base.baseDef,
      baseSpatk: form.baseSpatk ?? base.baseSpatk,
      baseSpdef: form.baseSpdef ?? base.baseSpdef,
      baseSpd: form.baseSpd ?? base.baseSpd,
      catchRate,
      catchProbability: catchProbability(catchRate),
      ability1,
      ability1Zh: abilityName(ability1, abilityNames),
      ability2,
      ability2Zh: abilityName(ability2, abilityNames),
      abilityHidden,
      abilityHiddenZh: abilityName(abilityHidden, abilityNames),
      passive,
      passiveZh: abilityName(passive, abilityNames),
      baseId: base.id,
      baseNameZh: base.nameZh,
      isForm: true,
      formIndex: form.formIndex,
      formKey: form.formKey,
      formNameZh: label,
      forms: [],
      smogonSets: [],
    }
  }))

const ids = new Set(forms.map(form => form.id))
if (forms.length === 0 || ids.size !== forms.length) {
  throw new Error(`Expected unique non-base form entries, received ${forms.length} entries and ${ids.size} unique IDs`)
}

fs.writeFileSync(outputPath, `${JSON.stringify(forms, null, 2)}\n`)
console.log(`Built ${forms.length} independent Pokemon form entries at ${path.relative(rootDir, outputPath)}`)
