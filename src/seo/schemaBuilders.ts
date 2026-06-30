import { siteConfig, getCanonicalPath } from './generateMeta'
import type { Pokemon, Biome, TypeMatchupItem } from '../types'
import { PokemonTypeNames } from '../types'

export function buildBreadcrumbList(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: getCanonicalPath(item.path),
    })),
  }
}

export function buildWebSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.siteName,
    url: siteConfig.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.siteUrl}/pokemon?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildPokemonSchema(p: Pokemon) {
  const typeZh = [p.type1, p.type2]
    .filter(Boolean)
    .map(t => PokemonTypeNames[t as keyof typeof PokemonTypeNames] || t)
    .join('/')

  const mainEntity: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoGameCharacter',
    name: `${p.nameZh} ${p.nameEn}`,
    alternateName: [p.nameZh, p.nameEn],
    description: `${p.nameZh}（${p.nameEn}）是${typeZh}属性宝可梦，全国图鉴编号 #${p.numericId}，种族值总和 ${p.baseTotal}。`,
    identifier: p.id,
    gameItem: [
      { '@type': 'PropertyValue', name: '全国图鉴编号', value: p.numericId },
      { '@type': 'PropertyValue', name: '属性', value: typeZh },
      { '@type': 'PropertyValue', name: '种族值总和', value: p.baseTotal },
      { '@type': 'PropertyValue', name: '特性1', value: p.ability1Zh },
      p.ability2 && p.ability2 !== 'NONE' ? { '@type': 'PropertyValue', name: '特性2', value: p.ability2Zh } : null,
      p.abilityHidden && p.abilityHidden !== 'NONE' ? { '@type': 'PropertyValue', name: '隐藏特性', value: p.abilityHiddenZh } : null,
      p.passive && p.passive !== 'NONE' ? { '@type': 'PropertyValue', name: '被动', value: p.passiveZh } : null,
    ].filter(Boolean),
    url: getCanonicalPath(`/pokemon/${p.id}`),
  }

  const faqs: { question: string; answer: string }[] = [
    {
      question: `${p.nameZh}的属性是什么？`,
      answer: `${p.nameZh}是${typeZh}属性宝可梦。`,
    },
    {
      question: `${p.nameZh}的种族值是多少？`,
      answer: `HP ${p.baseHp} / 攻击 ${p.baseAtk} / 防御 ${p.baseDef} / 特攻 ${p.baseSpatk} / 特防 ${p.baseSpdef} / 速度 ${p.baseSpd}，总计 ${p.baseTotal}。`,
    },
    {
      question: `${p.nameZh}在哪里出现？`,
      answer:
        (p.biomes || []).length > 0
          ? `可在${p.biomes.map(b => `${b.nameZh}（${b.rarities?.join('、') || '普通'}）`).join('、')}出现。`
          : '暂无出现地区数据。',
    },
  ]

  if (p.evolutions.length > 0) {
    faqs.push({
      question: `${p.nameZh}怎么进化？`,
      answer: p.evolutions.map(e => `${e.descriptionZh}`).join('；') + '。',
    })
  }

  if ((p.eggMoves || []).length > 0) {
    faqs.push({
      question: `${p.nameZh}有哪些蛋招式？`,
      answer: p.eggMoves.map(m => m.moveZh).join('、') + '。',
    })
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  }

  return [mainEntity, faqSchema]
}

export function buildBiomeSchema(b: Biome, topSpecies: { id: string; nameZh: string }[]) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: b.nameZh,
      alternateName: b.id,
      description: `${b.nameZh}（${b.id}）是 PokeRogue 生态区，连接 ${b.biomeLinks.join('、') || '无'}。`,
      url: getCanonicalPath(`/biome/${b.id}`),
      containsPlace: topSpecies.map(s => ({
        '@type': 'Thing',
        name: s.nameZh,
        url: getCanonicalPath(`/pokemon/${s.id}`),
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `${b.nameZh}连接哪些地区？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: b.biomeLinks.length > 0 ? `连接${b.biomeLinks.join('、')}。` : '无连接地区。',
          },
        },
        {
          '@type': 'Question',
          name: `${b.nameZh}有哪些稀有精灵？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              topSpecies.length > 0
                ? `常见精灵包括 ${topSpecies.slice(0, 10).map(s => s.nameZh).join('、')} 等。`
                : '暂无遭遇数据。',
          },
        },
      ],
    },
  ]
}

export function buildItemSchema(item: TypeMatchupItem) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: item.nameZh,
      alternateName: item.id,
      description: item.description,
      category: item.tierLabel,
      url: getCanonicalPath(`/item/${item.id}`),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `${item.nameZh}有什么效果？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.description,
          },
        },
        {
          '@type': 'Question',
          name: `${item.nameZh}的稀有度是多少？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `${item.tierLabel}（${item.tier}）。`,
          },
        },
      ],
    },
  ]
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

export function buildMoveSchema(move: MoveInfo, pokemonNames: string[]) {
  const typeZh = move.type ? PokemonTypeNames[move.type as keyof typeof PokemonTypeNames] || move.type : '未知'
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: move.nameZh,
      alternateName: move.id,
      description: `${move.nameZh}是${typeZh}属性${move.category || ''}招式${move.power ? `，威力 ${move.power}` : ''}${move.accuracy ? `，命中 ${move.accuracy}` : ''}。${move.effect || ''}`,
      url: getCanonicalPath(`/move/${move.id}`),
      about: typeZh,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `${move.nameZh}是什么属性招式？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `${move.nameZh}是${typeZh}属性招式。`,
          },
        },
        {
          '@type': 'Question',
          name: `哪些宝可梦可以学习${move.nameZh}？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              pokemonNames.length > 0
                ? `可学习的宝可梦包括 ${pokemonNames.slice(0, 20).join('、')} 等。`
                : '暂无数据。',
          },
        },
      ],
    },
  ]
}

export interface AbilityInfo {
  id: string
  nameZh: string
  description?: string
}

export function buildAbilitySchema(ability: AbilityInfo, pokemonNames: string[]) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: ability.nameZh,
      alternateName: ability.id,
      description: ability.description || `${ability.nameZh}是 PokeRogue 中的宝可梦特性。`,
      url: getCanonicalPath(`/ability/${ability.id}`),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `${ability.nameZh}有什么效果？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: ability.description || '暂无说明。',
          },
        },
        {
          '@type': 'Question',
          name: `哪些宝可梦拥有${ability.nameZh}？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              pokemonNames.length > 0
                ? `拥有该特性的宝可梦包括 ${pokemonNames.slice(0, 20).join('、')} 等。`
                : '暂无数据。',
          },
        },
      ],
    },
  ]
}

export interface NatureInfo {
  id: string
  nameZh: string
  upStat: string | null
  downStat: string | null
}

export function buildNatureSchema(nature: NatureInfo) {
  const description =
    nature.upStat && nature.downStat
      ? `${nature.nameZh}性格会提升${nature.upStat}、降低${nature.downStat}。`
      : `${nature.nameZh}性格不会对能力值产生修正。`

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: nature.nameZh,
      alternateName: nature.id,
      description,
      url: getCanonicalPath(`/nature/${nature.id}`),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `${nature.nameZh}性格有什么效果？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: description,
          },
        },
      ],
    },
  ]
}

export function buildTypeSchema(type: string, nameZh: string) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: `${nameZh}属性`,
      alternateName: type,
      description: `${nameZh}属性在 PokeRogue 中的攻击与防御相性。`,
      url: getCanonicalPath(`/type/${type}`),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `${nameZh}属性克制哪些属性？`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `请查看${nameZh}属性在 PokeRogue 中文图鉴中的完整克制表。`,
          },
        },
      ],
    },
  ]
}

export function buildCollectionPage(name: string, path: string, itemCount: number, sampleItems: string[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: getCanonicalPath(path),
    description: `${name}，共 ${itemCount} 条记录。`,
    hasPart: sampleItems.slice(0, 12).map(itemName => ({
      '@type': 'Thing',
      name: itemName,
    })),
  }
}
