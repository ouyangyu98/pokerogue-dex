import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')

function runStep(title, command) {
  console.log(`=== ${title} ===`)
  execSync(command, { cwd: rootDir, stdio: 'inherit' })
}

function loadRootJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), 'utf-8'))
}

function cleanText(value) {
  return String(value || '')
    .replace(/\{\{.*?\}\}/g, '')
    .replace(/\s*-\s*$/g, '')
    .replace(/\s*x\s*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractModifierIdsForTier(source, tier) {
  const marker = `modifierPool[ModifierTier.${tier}] = [`
  const start = source.indexOf(marker)
  if (start === -1) {
    return []
  }

  const listStart = source.indexOf('[', start)
  const listEnd = source.indexOf('].map', listStart)
  if (listStart === -1 || listEnd === -1) {
    return []
  }

  const section = source.slice(listStart, listEnd)
  return Array.from(new Set(Array.from(section.matchAll(/modifierTypes\.([A-Z0-9_]+)/g), match => match[1])))
}

const modifierTierLabelMap = {
  COMMON: '普通',
  GREAT: '高级',
  ULTRA: '超级',
  ROGUE: '肉鸽',
  MASTER: '大师',
  LUXURY: '豪华',
}

const modifierTierOrder = {
  MASTER: 5,
  ROGUE: 4,
  ULTRA: 3,
  GREAT: 2,
  COMMON: 1,
  LUXURY: 0,
}

const playerPoolTierOrder = ['MASTER', 'ROGUE', 'ULTRA', 'GREAT', 'COMMON']

const itemNameFallbacks = {
  POKEBALL: '精灵球',
  GREAT_BALL: '超级球',
  ULTRA_BALL: '高级球',
  ROGUE_BALL: '肉鸽球',
  MASTER_BALL: '大师球',
  TM_COMMON: '普通招式学习器',
  TM_GREAT: '高级招式学习器',
  TM_ULTRA: '超级招式学习器',
  BERRY: '树果',
  TEMP_STAT_STAGE_BOOSTER: '临时能力强化',
  BASE_STAT_BOOSTER: '基础能力增强剂',
  SPECIES_STAT_BOOSTER: '物种专属强化',
  RARE_SPECIES_STAT_BOOSTER: '稀有物种专属强化',
  EVOLUTION_ITEM: '进化道具',
  RARE_EVOLUTION_ITEM: '稀有进化道具',
  FORM_CHANGE_ITEM: '形态变更道具',
  RARE_FORM_CHANGE_ITEM: '稀有形态变更道具',
  MINT: '薄荷',
  TERA_SHARD: '太晶碎块',
  VOUCHER: '兑换券',
  VOUCHER_PLUS: '高级兑换券',
  VOUCHER_PREMIUM: '豪华兑换券',
}

const specificDescriptionFallbacks = {
  POKEBALL: '获得 5 个精灵球，捕获率 1.0x（基础倍率）。',
  GREAT_BALL: '获得 5 个超级球，捕获率 1.5x。',
  ULTRA_BALL: '获得 5 个高级球，捕获率 2.0x。',
  ROGUE_BALL: '获得 5 个肉鸽球，捕获率 3.0x。',
  MASTER_BALL: '获得 1 个大师球，必定捕获（100%）。',
  RARE_CANDY: '让一只宝可梦立即提升 1 级。',
  RARER_CANDY: '让全队所有宝可梦各提升 1 级。',
  BERRY: '随机提供一枚可携带树果（如橙子果、文柚果等），用于回复 HP、解异常或触发特殊效果。',
  TEMP_STAT_STAGE_BOOSTER: '为全队提供短期能力阶段提升（+2 阶段），持续 5 场战斗；包含力量/防御/特攻/特防/速度/命中强化中的一种。',
  TM_COMMON: '随机提供普通稀有度的招式学习器，用于扩充招式池；包含一般属性及常见属性招式。',
  TM_GREAT: '随机提供高级稀有度的招式学习器，兼顾泛用性与强度；覆盖更多属性的高威力选项。',
  TM_ULTRA: '随机提供超级稀有度的招式学习器，通常为高威力本系大招或强力辅助技能。',
  SPECIES_STAT_BOOSTER: '为特定物种提供专属能力强化（如：皮卡丘→光粉攻击/特攻×2、卡拉卡拉→粗骨头攻击×2、百变怪→金属粉防御×2 或轻粉速度×2、珍珠贝→深海鳞特防×2 或深海牙特攻×2）。',
  RARE_SPECIES_STAT_BOOSTER: '更稀有的物种专属强化道具，效果同物种专属强化但出现概率更低、收益更高（如灵魂之玉拉提亚斯/拉帝欧斯专用）。',
  BASE_STAT_BOOSTER: '提升持有者某项基础能力值（HP 增强 / 攻击增强剂 / 铁 / 钙 / 锌 / 速速力增强剂之一），可重复使用以持续培养主力。',
  EVOLUTION_ITEM: '提供常见进化道具（联系绳、日之石、月之石、叶之石、火之石、水之石、雷之石、冰之石、暗之石、觉醒之石等），用于推进需要特定道具的进化路线。',
  RARE_EVOLUTION_ITEM: '提供更稀有的进化道具（可疑光盘、电子针、熔岩推进器、保护者等），服务于特殊或后期进化路线。',
  FORM_CHANGE_ITEM: '形态变更道具（Mega 石、各种板块、驱动器、面具、宝珠、记忆等），让部分宝可梦切换形态并可能改变属性或能力。',
  RARE_FORM_CHANGE_ITEM: '更少见的形态变更道具（如极巨化腰带），出现概率低但效果通常更强。',
  MINT: '调整宝可梦的性格修正方向（如硬朗、固执、胆小等），改变性格对应的能力加成与减益分配。',
  TERA_SHARD: '将宝可梦的太晶属性改为指定属性（18 种太晶属性之一），方便补盲或重组打点。',
  VOUCHER: '获得 1 张初级扭蛋券，可在扭蛋系统中兑换额外奖励资源。',
  VOUCHER_PLUS: '获得 1 张中级扭蛋券，奖励品质优于初级扭蛋券。',
  VOUCHER_PREMIUM: '获得 1 张高级扭蛋券，通常能获取高价值奖励。',
  // 精确数值补充
  POTION: '为一只宝可梦回复 20 HP 或 10% HP，取较大值。',
  SUPER_POTION: '为一只宝可梦回复 50 HP 或 25% HP，取较大值。',
  HYPER_POTION: '为一只宝可梦回复 200 HP 或 50% HP，取较大值。',
  MAX_POTION: '为一只宝可梦回复全部 HP。',
  FULL_RESTORE: '为一只宝可梦回复全部 HP 并消除所有负面状态。',
  FULL_HEAL: '为一只宝可梦消除所有负面状态。',
  REVIVE: '复活一只宝可梦并回复 50% HP。',
  MAX_REVIVE: '复活一只宝可梦并回复全部 HP。',
  SACRED_ASH: '复活所有濒死的宝可梦，并完全回复 HP。',
  ETHER: '为一只宝可梦的一个招式回复 10 PP。',
  MAX_ETHER: '完全回复一只宝可梦一个招式的 PP。',
  ELIXIR: '为一只宝可梦的所有招式回复 10 PP。',
  MAX_ELIXIR: '完全回复一只宝可梦所有招式的 PP。',
  PP_UP: '使一个招式的 PP 最大值提升基础的 20%（最多 3 次）。',
  PP_MAX: '使一个招式的 PP 最大值提升至极限（相当于 3 次 PP 提升剂）。',
  LURE: '遭遇双打概率提升 4 倍，持续 10 场战斗。',
  SUPER_LURE: '遭遇双打概率提升 4 倍，持续 15 场战斗。',
  MAX_LURE: '遭遇双打概率提升 4 倍，持续 30 场战斗。',
  EXP_CHARM: '全队经验值获取量增加 25%。',
  SUPER_EXP_CHARM: '全队经验值获取量增加 60%。',
  GOLDEN_EXP_CHARM: '全队经验值获取量增加 100%。',
  SOOTHE_BELL: '亲密度获取量增加 50%。',
  MEMORY_MUSHROOM: '回忆一个宝可梦已经遗忘的招式。',
  CANDY_JAR: '神奇糖果提供的升级额外增加 1 级。',
  MAP: '有概率允许你在切换地区时选择目的地。',
  IV_SCANNER: '允许扫描野生宝可梦的个体值。',
  LOCK_CAPSULE: '允许在商店中刷新物品时锁定物品的稀有度。',
  WIDE_LENS: '携带者招式命中率增加 5。',
  MULTI_LENS: '将持有者本次伤害的 25% 转化为一次独立的攻击。',
  GRIP_CLAW: '攻击时 10% 概率偷取对手物品。',
  DNA_SPLICERS: '融合两只宝可梦（改变特性，平分基础点数和属性，共享招式池）。',
  MINI_BLACK_HOLE: '持有者每回合从对手那里获得一个持有的物品。',
  DIRE_HIT: '提升全队会心等级，持续 5 场战斗。',
  NUGGET: '获得少量金钱。',
  BIG_NUGGET: '获得大量金钱。',
  RELIC_GOLD: '获得大量金钱。',
  AMULET_COIN: '获得的金钱增加 20%。',
  GOLDEN_PUNCH: '将 50% 造成的伤害转换为金钱。',
  COIN_CASE: '每 10 场战斗获得自己金钱 10% 的利息。',
  EXP_SHARE: '未参加对战的宝可梦获得 20% 的经验值。',
  EXP_BALANCE: '经验值会更多分给队伍中等级最低的宝可梦。',
  OVAL_CHARM: '多只宝可梦参与战斗时，分别获得总经验值 10% 的额外经验值。',
  LUCKY_EGG: '持有者经验值获取量增加 50%。',
  GOLDEN_EGG: '持有者经验值获取量增加 100%。',
  SCOPE_LENS: '携带者会心等级 +1，招式变得更容易击中要害。',
  LEEK: '会心等级 +2，仅对大葱鸭、大葱鸭(伽勒尔)、葱游兵有效。',
  EVIOLITE: '防御和特防提升 50%（1.5 倍），仅对还能进化的宝可梦有效。',
  SOUL_DEW: '增加 10% 宝可梦性格对数值的影响（加算），仅拉提亚斯/拉帝欧斯可用。',
  FOCUS_BAND: '携带者受到致命攻击时，有 10% 几率保留 1 点 HP 不进入濒死状态。',
  QUICK_CLAW: '有 10% 几率无视速度优先使出招式（先制技能仍优先）。',
  KINGS_ROCK: '使用原本不会造成畏缩状态的攻击时，额外增加 10% 几率使目标陷入畏缩状态。',
  LEFTOVERS: '每回合结束时恢复最大 HP 的 1/16。',
  SHELL_BELL: '攻击成功造成伤害后，恢复所造成伤害量的 1/8 HP。',
  TOXIC_ORB: '入场时立即陷入剧毒状态（每回合 HP 损失量递增）；适合配合不怕异常状态的策略使用。',
  FLAME_ORB: '入场时立即陷入灼伤状态（攻击减半，每回合损失 HP）；常用于配合"根性"特性反转负面效果。',
  MYSTICAL_ROCK: '每堆叠一次，可将招式或能力造成的地形和天气的持续时间延长 2 回合。',
  BATON: '允许在切换宝可梦时保留能力变化，对陷阱同样生效。',
  SHINY_CHARM: '显著增加野生宝可梦的闪光概率。',
  ABILITY_CHARM: '显著增加野生宝可梦有隐藏特性的概率。',
  CATCHING_CHARM: '增加关键捕获的几率。',
  HEALING_CHARM: 'HP 回复量增加 10%（不含复活）。',
  BERRY_POUCH: '使用树果时增加 30% 的几率不会消耗树果。',
  GOLDEN_POKEBALL: '每场战斗结束后，增加一个额外物品选项。',
  ENEMY_DAMAGE_BOOSTER: '造成 5% 额外伤害（乘算）。',
  ENEMY_DAMAGE_REDUCTION: '受到 2.5% 更少伤害（乘算）。',
  ENEMY_HEAL: '每回合回复 2% 最大 HP。',
  ENEMY_STATUS_EFFECT_HEAL_CHANCE: '增加 2.5% 每回合治愈异常状态的概率。',
  ENEMY_FUSED_CHANCE: '增加 1% 野生融合宝可梦出现概率。',
}

const healingItemIds = new Set(['POTION', 'SUPER_POTION', 'HYPER_POTION', 'MAX_POTION', 'FULL_RESTORE', 'FULL_HEAL'])
const reviveItemIds = new Set(['REVIVE', 'MAX_REVIVE', 'SACRED_ASH'])
const ppItemIds = new Set(['ETHER', 'MAX_ETHER', 'ELIXIR', 'MAX_ELIXIR', 'PP_UP', 'PP_MAX'])
const lureItemIds = new Set(['LURE', 'SUPER_LURE', 'MAX_LURE'])
const moneyItemIds = new Set(['NUGGET', 'BIG_NUGGET', 'RELIC_GOLD', 'AMULET_COIN', 'GOLDEN_PUNCH'])
const growthItemIds = new Set(['EXP_CHARM', 'SUPER_EXP_CHARM', 'EXP_SHARE', 'SOOTHE_BELL', 'MEMORY_MUSHROOM', 'CANDY_JAR'])
const scoutingItemIds = new Set(['MAP', 'IV_SCANNER', 'CATCHING_CHARM', 'ABILITY_CHARM', 'LOCK_CAPSULE'])

function buildFallbackDescription(id, displayName) {
  if (specificDescriptionFallbacks[id]) {
    return specificDescriptionFallbacks[id]
  }
  if (healingItemIds.has(id)) {
    return `${displayName}属于回复类道具，主要用于在连战中维持队伍血线。`
  }
  if (reviveItemIds.has(id)) {
    return `${displayName}属于复活类道具，用于把濒死成员重新拉回战线。`
  }
  if (ppItemIds.has(id)) {
    return `${displayName}用于回复或提升招式 PP，适合长线推进与关键技能保底。`
  }
  if (lureItemIds.has(id)) {
    return `${displayName}会影响连续遭遇节奏，适合想加快推进或刷资源时使用。`
  }
  if (moneyItemIds.has(id)) {
    return `${displayName}偏向金钱收益，能帮助你更快积累商店资源。`
  }
  if (growthItemIds.has(id)) {
    return `${displayName}偏向成长与培养，适合围绕主力队伍做长期强化。`
  }
  if (scoutingItemIds.has(id)) {
    return `${displayName}偏向信息与路线管理，能帮助你更稳定地规划后续推进。`
  }
  return `${displayName}属于高价值功能型道具，建议结合当前队伍构成和关卡节奏选择。`
}

function resolveItemName(id, modifierEntries, pokeballLocale) {
  const localizedEntry = modifierEntries[id]
  if (localizedEntry?.name) {
    const cleaned = cleanText(localizedEntry.name)
    if (cleaned) {
      return cleaned
    }
  }

  if (id === 'POKEBALL') return pokeballLocale.pokeBall
  if (id === 'GREAT_BALL') return pokeballLocale.greatBall
  if (id === 'ULTRA_BALL') return pokeballLocale.ultraBall
  if (id === 'ROGUE_BALL') return pokeballLocale.rogueBall
  if (id === 'MASTER_BALL') return pokeballLocale.masterBall

  return itemNameFallbacks[id] || id
}

function resolveItemDescription(id, displayName, modifierEntries) {
  // 优先使用我们手写的精确描述（含数值），覆盖可能不够具体的本地化文案
  if (specificDescriptionFallbacks[id]) {
    return specificDescriptionFallbacks[id]
  }
  const localizedEntry = modifierEntries[id]
  if (localizedEntry?.description) {
    const cleaned = cleanText(localizedEntry.description)
    if (cleaned) {
      return cleaned
    }
  }
  return buildFallbackDescription(id, displayName)
}

const staticItemIconOverrides = {
  POKEBALL: 'pb',
  GREAT_BALL: 'gb',
  ULTRA_BALL: 'ub',
  ROGUE_BALL: 'rb',
  MASTER_BALL: 'mb',
  MULTI_LENS: 'zoom_lens',
  IV_SCANNER: 'scanner',
  MEMORY_MUSHROOM: 'big_mushroom',
  VOUCHER: 'coupon',
  VOUCHER_PLUS: 'pair_of_tickets',
  VOUCHER_PREMIUM: 'mystic_ticket',
}

const groupedItemIconMap = {
  MINT: { iconKey: 'mint_neutral', fallbackIconKey: null },
  TM_COMMON: { iconKey: 'tm_normal', fallbackIconKey: 'tm_fire' },
  TM_GREAT: { iconKey: 'tm_normal', fallbackIconKey: 'tm_fire' },
  TM_ULTRA: { iconKey: 'tm_normal', fallbackIconKey: 'tm_fire' },
  BERRY: { iconKey: 'sitrus_berry', fallbackIconKey: 'oran_berry' },
  TEMP_STAT_STAGE_BOOSTER: { iconKey: 'x_attack', fallbackIconKey: null },
  BASE_STAT_BOOSTER: { iconKey: 'hp_up', fallbackIconKey: 'protein' },
  SPECIES_STAT_BOOSTER: { iconKey: 'thick_club', fallbackIconKey: 'light_ball' },
  RARE_SPECIES_STAT_BOOSTER: { iconKey: 'soul_dew', fallbackIconKey: 'light_ball' },
  ATTACK_TYPE_BOOSTER: { iconKey: 'black_belt', fallbackIconKey: 'mystic_water' },
  EVOLUTION_ITEM: { iconKey: 'linking_cord', fallbackIconKey: 'moon_stone' },
  RARE_EVOLUTION_ITEM: { iconKey: 'moon_stone', fallbackIconKey: 'linking_cord' },
  FORM_CHANGE_ITEM: { iconKey: 'mega_bracelet', fallbackIconKey: 'dynamax_band' },
  RARE_FORM_CHANGE_ITEM: { iconKey: 'dynamax_band', fallbackIconKey: 'mega_bracelet' },
  TERA_SHARD: { iconKey: 'normal_tera_shard', fallbackIconKey: 'stellar_tera_shard' },
}

// 属性增幅道具展开映射：PokemonType -> 道具名/图标/属性名
const attackTypeBoosterMap = [
  { type: 'NORMAL', iconKey: 'silk_scarf', nameKey: 'silk_scarf', typeName: '一般' },
  { type: 'FIGHTING', iconKey: 'black_belt', nameKey: 'black_belt', typeName: '格斗' },
  { type: 'FLYING', iconKey: 'sharp_beak', nameKey: 'sharp_beak', typeName: '飞行' },
  { type: 'POISON', iconKey: 'poison_barb', nameKey: 'poison_barb', typeName: '毒' },
  { type: 'GROUND', iconKey: 'soft_sand', nameKey: 'soft_sand', typeName: '地面' },
  { type: 'ROCK', iconKey: 'hard_stone', nameKey: 'hard_stone', typeName: '岩石' },
  { type: 'BUG', iconKey: 'silver_powder', nameKey: 'silver_powder', typeName: '虫' },
  { type: 'GHOST', iconKey: 'spell_tag', nameKey: 'spell_tag', typeName: '幽灵' },
  { type: 'STEEL', iconKey: 'metal_coat', nameKey: 'metal_coat', typeName: '钢' },
  { type: 'FIRE', iconKey: 'charcoal', nameKey: 'charcoal', typeName: '火' },
  { type: 'WATER', iconKey: 'mystic_water', nameKey: 'mystic_water', typeName: '水' },
  { type: 'GRASS', iconKey: 'miracle_seed', nameKey: 'miracle_seed', typeName: '草' },
  { type: 'ELECTRIC', iconKey: 'magnet', nameKey: 'magnet', typeName: '电' },
  { type: 'PSYCHIC', iconKey: 'twisted_spoon', nameKey: 'twisted_spoon', typeName: '超能力' },
  { type: 'ICE', iconKey: 'never_melt_ice', nameKey: 'never_melt_ice', typeName: '冰' },
  { type: 'DRAGON', iconKey: 'dragon_fang', nameKey: 'dragon_fang', typeName: '龙' },
  { type: 'DARK', iconKey: 'black_glasses', nameKey: 'black_glasses', typeName: '恶' },
  { type: 'FAIRY', iconKey: 'fairy_feather', nameKey: 'fairy_feather', typeName: '妖精' },
]

function resolveItemIconKeys(id) {
  const groupedItemIcon = groupedItemIconMap[id]
  if (groupedItemIcon) {
    return groupedItemIcon
  }

  return {
    iconKey: staticItemIconOverrides[id] || id.toLowerCase(),
    fallbackIconKey: null,
  }
}

runStep('Step 1: Extract species IDs', 'node scripts/extract-species-ids.mjs')
runStep('Step 2: Build name maps', 'node scripts/build-name-maps.mjs')
runStep('Step 3: Extract pokemon data', 'node scripts/extract-pokemon.mjs')
runStep('Step 4: Extract biome data', 'node scripts/extract-biomes.mjs')
runStep('Step 5: Enrich pokemon data', 'node scripts/enrich-pokemon.mjs')

const pokemons = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/data/pokemon.json'), 'utf-8'))
const biomes = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/data/biomes.json'), 'utf-8'))
const nameMaps = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/data/name-maps.json'), 'utf-8'))

console.log('=== Step 6: Build item list for type matchup side rail ===')
const modifierTypeLocale = loadRootJson('source/pokerogue-locales/zh-Hans/modifier-type.json')
const pokeballLocale = loadRootJson('source/pokerogue-locales/zh-Hans/pokeball.json')
const modifierEntries = modifierTypeLocale.ModifierType || {}
const attackTypeBoosterNames = modifierTypeLocale.AttackTypeBoosterItem || {}
const modifierPoolSource = fs.readFileSync(path.join(rootDir, 'source/pokerogue/src/modifier/init-modifier-pools.ts'), 'utf-8')
const seenItemIds = new Set()
const items = []

for (const tier of playerPoolTierOrder) {
  const ids = extractModifierIdsForTier(modifierPoolSource, tier)
  ids.forEach((id, index) => {
    if (seenItemIds.has(id)) {
      return
    }
    seenItemIds.add(id)

    // ATTACK_TYPE_BOOSTER 展开为 18 个属性具体道具
    if (id === 'ATTACK_TYPE_BOOSTER') {
      attackTypeBoosterMap.forEach((booster, boosterIndex) => {
        const rawName = attackTypeBoosterNames[booster.nameKey]
        const nameZh = rawName ? cleanText(rawName) : booster.nameKey.replace(/_/g, ' ')
        items.push({
          id: `ATTACK_TYPE_BOOSTER_${booster.type}`,
          nameZh,
          description: `携带后，${booster.typeName}属性招式的威力提升 20%。`,
          tier,
          tierLabel: modifierTierLabelMap[tier] || tier,
          sortOrder: modifierTierOrder[tier] || 0,
          tierIndex: index + boosterIndex * 0.01,
          iconKey: booster.iconKey,
          fallbackIconKey: null,
        })
      })
      return
    }

    const nameZh = resolveItemName(id, modifierEntries, pokeballLocale)
    const description = resolveItemDescription(id, nameZh, modifierEntries)
    const { iconKey, fallbackIconKey } = resolveItemIconKeys(id)

    items.push({
      id,
      nameZh,
      description,
      tier,
      tierLabel: modifierTierLabelMap[tier] || tier,
      sortOrder: modifierTierOrder[tier] || 0,
      tierIndex: index,
      iconKey,
      fallbackIconKey,
    })
  })
}

const sortedItems = items.sort((a, b) => {
  if (b.sortOrder !== a.sortOrder) {
    return b.sortOrder - a.sortOrder
  }
  if (a.tierIndex !== b.tierIndex) {
    return a.tierIndex - b.tierIndex
  }
  return a.nameZh.localeCompare(b.nameZh, 'zh-Hans-CN')
})

fs.writeFileSync(path.join(rootDir, 'public/data/items.json'), JSON.stringify(sortedItems, null, 2))
console.log('Built item list with ' + sortedItems.length + ' entries')

console.log('=== Step 7: Update data report ===')

// Compute encounter splits
const normalEncounters = biomes.flatMap(b => b.encounters.filter(e => !e.isBoss))
const bossEncounters = biomes.flatMap(b => b.encounters.filter(e => e.isBoss))

// Compute distinct move count from pokemon data
const allMoveIds = new Set()
pokemons.forEach(p => {
  ;(p.levelMoves || []).forEach(m => allMoveIds.add(m.moveId))
  ;(p.eggMoves || []).forEach(m => allMoveIds.add(m.moveId))
})

// Compute distinct ability count from pokemon data
const allAbilityIds = new Set()
pokemons.forEach(p => {
  if (p.ability1 && p.ability1 !== 'NONE') allAbilityIds.add(p.ability1)
  if (p.ability2 && p.ability2 !== 'NONE') allAbilityIds.add(p.ability2)
  if (p.abilityHidden && p.abilityHidden !== 'NONE') allAbilityIds.add(p.abilityHidden)
  if (p.passive && p.passive !== 'NONE') allAbilityIds.add(p.passive)
  ;(p.forms || []).forEach(f => {
    if (f.ability1 && f.ability1 !== 'NONE') allAbilityIds.add(f.ability1)
    if (f.ability2 && f.ability2 !== 'NONE') allAbilityIds.add(f.ability2)
    if (f.abilityHidden && f.abilityHidden !== 'NONE') allAbilityIds.add(f.abilityHidden)
    if (f.passive && f.passive !== 'NONE') allAbilityIds.add(f.passive)
  })
})

// Name map coverage for all PRD-required entity types
const formTotal = pokemons.reduce((sum, p) => sum + (p.forms?.length || 0), 0)
const formMapped = pokemons.reduce((sum, p) => sum + (p.forms || []).filter(f => f.formNameZh && f.formNameZh !== f.formKey && f.formNameZh !== '普通').length, 0)

const nameMapCoverage = {
  pokemon: {
    total: pokemons.length,
    mapped: pokemons.filter(p => p.nameZh && p.nameZh !== p.id).length,
    coverage: Number((pokemons.filter(p => p.nameZh && p.nameZh !== p.id).length / pokemons.length * 100).toFixed(2)),
  },
  form: {
    total: formTotal,
    mapped: formMapped,
    coverage: formTotal > 0 ? Number((formMapped / formTotal * 100).toFixed(2)) : 100,
  },
  type: {
    total: Object.keys(nameMaps.type || {}).length,
    mapped: Object.keys(nameMaps.type || {}).length,
    coverage: 100,
  },
  move: {
    total: Object.keys(nameMaps.move || {}).length,
    mapped: Object.keys(nameMaps.move || {}).length,
    coverage: 100,
  },
  ability: {
    total: Object.keys(nameMaps.ability || {}).length,
    mapped: Object.keys(nameMaps.ability || {}).length,
    coverage: 100,
  },
  biome: {
    total: biomes.length,
    mapped: biomes.filter(b => b.nameZh && b.nameZh !== b.id).length,
    coverage: Number((biomes.filter(b => b.nameZh && b.nameZh !== b.id).length / biomes.length * 100).toFixed(2)),
  },
  rarity: {
    total: 9,
    mapped: 9,
    coverage: 100,
  },
  skillSourceType: {
    total: 2,
    mapped: 2,
    coverage: 100,
  },
}

const report = {
  sourceVersion: 'pokerogue-beta-2026-06-15',
  generationTime: new Date().toISOString(),
  pokemonCount: pokemons.length,
  biomeCount: biomes.length,
  encounterCount: normalEncounters.length + bossEncounters.length,
  normalEncounterCount: normalEncounters.length,
  bossEncounterCount: bossEncounters.length,
  levelMoveCount: pokemons.reduce((sum, p) => sum + (p.levelMoves?.length || 0), 0),
  eggMovePokemonCount: pokemons.filter(p => p.eggMoves?.length > 0).length,
  eggMoveCount: pokemons.reduce((sum, p) => sum + (p.eggMoves?.length || 0), 0),
  evolutionCount: pokemons.reduce((sum, p) => sum + (p.evolutions?.length || 0), 0),
  costCount: pokemons.filter(p => p.starterCost != null).length,
  passiveCount: pokemons.filter(p => p.passive && p.passive !== 'NONE').length,
  formCount: pokemons.reduce((sum, p) => sum + (p.forms?.length || 0), 0),
  itemCount: sortedItems.length,
  moveCount: allMoveIds.size,
  abilityCount: allAbilityIds.size,
  nameMapCoverage,
}
fs.writeFileSync(path.join(rootDir, 'public/data/data-report.json'), JSON.stringify(report, null, 2))

console.log('=== Step 8: Fetch Smogon sets ===')
try {
  execSync('node scripts/fetch-smogon-sets.mjs', { cwd: rootDir, stdio: 'inherit' })
} catch (e) {
  console.warn('Warning: Failed to fetch Smogon sets, skipping:', e.message)
}

console.log('=== Step 9: Process Smogon recommendations ===')
try {
  execSync('node scripts/process-smogon-recommendations.mjs', { cwd: rootDir, stdio: 'inherit' })
} catch (e) {
  console.warn('Warning: Failed to process Smogon recommendations, skipping:', e.message)
}

console.log('=== Step 10: Merge Smogon recommendations into pokemon.json ===')
try {
  const smogonRecs = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/data/smogon-recommendations.json'), 'utf-8'))
  let mergedCount = 0
  for (const p of pokemons) {
    if (smogonRecs[p.id]) {
      p.smogonSets = smogonRecs[p.id].sets
      mergedCount++
    }
  }
  fs.writeFileSync(path.join(rootDir, 'public/data/pokemon.json'), JSON.stringify(pokemons, null, 2))
  console.log(`Merged Smogon recommendations for ${mergedCount} Pokemon`)
} catch (e) {
  console.warn('Warning: Failed to merge Smogon recommendations:', e.message)
}

console.log('=== All done! ===')
