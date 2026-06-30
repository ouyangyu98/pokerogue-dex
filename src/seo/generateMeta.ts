import type { Pokemon, Biome, TypeMatchupItem, DataReport } from '../types'
import { PokemonTypeNames } from '../types'

export interface SiteConfig {
  siteUrl: string
  siteName: string
  defaultTitle: string
  defaultDescription: string
  defaultOgImage: string
  locale: string
  twitterHandle?: string
}

export const siteConfig: SiteConfig = {
  siteUrl: 'https://pokerogue-dex.vercel.app',
  siteName: 'PokeRogue 中文图鉴',
  defaultTitle: 'PokeRogue 中文图鉴 - 宝可梦肉鸽数据查询工具',
  defaultDescription:
    'PokeRogue 中文图鉴提供宝可梦肉鸽（PokeRogue）全精灵、地区、道具、招式、特性、性格、属性克制的详细数据查询，支持配队分析与 Smogon 推荐配招。',
  defaultOgImage: '/og-image.png',
  locale: 'zh_CN',
}

export function getCanonicalPath(path: string) {
  const clean = path.replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  return `${siteConfig.siteUrl}${clean}`
}

export function getHomeMeta(): PageMeta {
  return {
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    keywords:
      'PokeRogue,宝可梦肉鸽,图鉴,精灵图鉴,道具,招式,特性,性格,属性克制,配队,Smogon',
  }
}

export interface PageMeta {
  title: string
  description: string
  keywords?: string
  ogImage?: string
}

export function getPokemonListMeta(count: number): PageMeta {
  return {
    title: `精灵图鉴 - ${siteConfig.siteName}`,
    description: `查看 PokeRogue 全部 ${count} 只宝可梦的种族值、特性、技能、进化、出现地区与 Smogon 推荐配招。`,
    keywords: 'PokeRogue,宝可梦肉鸽,精灵图鉴,种族值,特性,技能,进化',
  }
}

export function getPokemonMeta(p: Pokemon): PageMeta {
  const typeZh = [p.type1, p.type2]
    .filter(Boolean)
    .map(t => PokemonTypeNames[t as keyof typeof PokemonTypeNames] || t)
    .join('/')
  const title = `${p.nameZh} ${p.nameEn} - PokeRogue 精灵图鉴`
  const parts: string[] = [
    `${p.nameZh}（${p.nameEn}）是${typeZh}属性宝可梦`,
    `全国图鉴编号 #${p.numericId}`,
    p.isFinalEvolution ? '最终形态' : '可进化',
    `种族值总和 ${p.baseTotal}`,
    `出现地区：${(p.biomes || []).slice(0, 3).map(b => b.nameZh).join('、') || '未知'}`,
  ]
  const description = parts.join('，') + '。查看详细技能、特性、被动、进化链与配队建议。'
  return {
    title,
    description,
    keywords: `PokeRogue,宝可梦肉鸽,${p.nameZh},${p.nameEn},${typeZh},图鉴,种族值,技能,特性`,
  }
}

export function getBiomeListMeta(count: number): PageMeta {
  return {
    title: `地区查询 - ${siteConfig.siteName}`,
    description: `查询 PokeRogue 全部 ${count} 个生态区的遭遇精灵、稀有度、时间段与连接地区。`,
    keywords: 'PokeRogue,宝可梦肉鸽,地区,生态区,遭遇,刷新点',
  }
}

export function getBiomeMeta(b: Biome, encounterCount: number): PageMeta {
  return {
    title: `${b.nameZh} - PokeRogue 地区查询`,
    description: `${b.nameZh}（${b.id}）是 PokeRogue 中的生态区，共有 ${encounterCount} 条遭遇记录，连接地区包括 ${b.biomeLinks.slice(0, 5).join('、') || '无'}。`,
    keywords: `PokeRogue,宝可梦肉鸽,${b.nameZh},地区,遭遇,生态区`,
  }
}

export function getItemListMeta(count: number): PageMeta {
  return {
    title: `道具清单 - ${siteConfig.siteName}`,
    description: `查看 PokeRogue 全部 ${count} 个商店道具的效果说明、稀有度与图标。`,
    keywords: 'PokeRogue,宝可梦肉鸽,道具,商店道具,效果',
  }
}

export function getItemMeta(item: TypeMatchupItem): PageMeta {
  return {
    title: `${item.nameZh} - PokeRogue 道具清单`,
    description: `${item.nameZh}（${item.id}）是 PokeRogue ${item.tierLabel}稀有度道具。${item.description}`,
    keywords: `PokeRogue,宝可梦肉鸽,${item.nameZh},道具,${item.tierLabel}`,
  }
}

export function getMoveListMeta(count: number): PageMeta {
  return {
    title: `招式查询 - ${siteConfig.siteName}`,
    description: `查询 PokeRogue 全部 ${count} 个招式的属性、分类、威力、命中与效果。`,
    keywords: 'PokeRogue,宝可梦肉鸽,招式,技能,效果',
  }
}

export interface MoveInfo {
  id: string
  nameZh: string
  type?: string | null
  category?: string | null
  power?: number | null
  accuracy?: number | null
  effect?: string
}

export function getMoveMeta(move: MoveInfo, pokemonCount: number): PageMeta {
  const typeText = move.type ? PokemonTypeNames[move.type as keyof typeof PokemonTypeNames] || move.type : '未知'
  const parts = [
    `${move.nameZh}是${typeText}属性招式`,
    move.category,
    move.power ? `威力 ${move.power}` : null,
    move.accuracy ? `命中 ${move.accuracy}` : null,
    pokemonCount > 0 ? `${pokemonCount} 只宝可梦可学习` : null,
  ]
  return {
    title: `${move.nameZh} - PokeRogue 招式查询`,
    description: parts.filter(Boolean).join('，') + '。' + (move.effect || ''),
    keywords: `PokeRogue,宝可梦肉鸽,${move.nameZh},招式,${typeText}`,
  }
}

export interface AbilityInfo {
  id: string
  nameZh: string
  description?: string
}

export function getAbilityListMeta(count: number): PageMeta {
  return {
    title: `特性查询 - ${siteConfig.siteName}`,
    description: `查询 PokeRogue 全部 ${count} 个特性的效果，以及拥有该特性的宝可梦列表。`,
    keywords: 'PokeRogue,宝可梦肉鸽,特性,隐藏特性,被动',
  }
}

export function getAbilityMeta(ability: AbilityInfo, pokemonCount: number): PageMeta {
  return {
    title: `${ability.nameZh} - PokeRogue 特性查询`,
    description: `${ability.nameZh}（${ability.id}）${ability.description ? `：${ability.description}` : ''}${pokemonCount > 0 ? `。共有 ${pokemonCount} 只宝可梦拥有该特性。` : ''}`,
    keywords: `PokeRogue,宝可梦肉鸽,${ability.nameZh},特性,隐藏特性`,
  }
}

export function getNatureListMeta(): PageMeta {
  return {
    title: `性格表 - ${siteConfig.siteName}`,
    description: '查看 PokeRogue 全部 25 种性格的加成与减成效果。',
    keywords: 'PokeRogue,宝可梦肉鸽,性格,加成,减成',
  }
}

export interface NatureInfo {
  id: string
  nameZh: string
  upStat: string | null
  downStat: string | null
}

export function getNatureMeta(nature: NatureInfo): PageMeta {
  const parts = [`${nature.nameZh}性格`]
  if (nature.upStat && nature.downStat) {
    parts.push(`提升${nature.upStat}，降低${nature.downStat}`)
  } else {
    parts.push('无修正')
  }
  return {
    title: `${nature.nameZh} - PokeRogue 性格表`,
    description: parts.join('，') + '。',
    keywords: `PokeRogue,宝可梦肉鸽,${nature.nameZh},性格`,
  }
}

export function getTypeListMeta(): PageMeta {
  return {
    title: `属性克制 - ${siteConfig.siteName}`,
    description: '查看 PokeRogue 18 种属性的攻击与防御相克关系。',
    keywords: 'PokeRogue,宝可梦肉鸽,属性克制,属性相性',
  }
}

export function getTypeMeta(_type: string, nameZh: string): PageMeta {
  return {
    title: `${nameZh}属性 - PokeRogue 属性克制`,
    description: `查看${nameZh}属性的攻击克制、防守弱点与抗性。`,
    keywords: `PokeRogue,宝可梦肉鸽,${nameZh},属性克制`,
  }
}

export function getMapMeta(): PageMeta {
  return {
    title: `地区导航 - ${siteConfig.siteName}`,
    description: 'PokeRogue 生态区地图导航，查看地区连接关系与推荐路线。',
    keywords: 'PokeRogue,宝可梦肉鸽,地图,地区导航,生态区',
  }
}

export function getReportMeta(report: DataReport): PageMeta {
  return {
    title: `数据报告 - ${siteConfig.siteName}`,
    description: `PokeRogue 数据报告：覆盖 ${report.pokemonCount} 只宝可梦、${report.biomeCount} 个生态区、${report.encounterCount} 条遭遇记录，数据版本 ${report.sourceVersion}。`,
    keywords: 'PokeRogue,宝可梦肉鸽,数据报告,覆盖率',
  }
}

export function getTeamMeta(): PageMeta {
  return {
    title: `配队分析 - ${siteConfig.siteName}`,
    description: 'PokeRogue 队伍构建工具：分析属性覆盖、防守抗性、职责分配与队伍缺口。',
    keywords: 'PokeRogue,宝可梦肉鸽,配队,队伍分析,队伍构建',
  }
}

export function getNotFoundMeta(): PageMeta {
  return {
    title: `页面未找到 - ${siteConfig.siteName}`,
    description: '抱歉，你访问的页面不存在。返回 PokeRogue 中文图鉴首页继续浏览。',
  }
}
