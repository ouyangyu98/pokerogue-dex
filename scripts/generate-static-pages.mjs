import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST_DIR = join(__dirname, '..', 'dist')
const DATA_DIR = join(__dirname, '..', 'public', 'data')
const SITE_URL = 'https://pokerogue-dex.vercel.app'

async function readJson(name) {
  const text = await readFile(join(DATA_DIR, name), 'utf-8')
  return JSON.parse(text)
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildMetaTags({ title, description, keywords, path, jsonLdList }) {
  const canonical = `${SITE_URL}${path}`
  const ogImage = `${SITE_URL}/og-image.png`
  const fullTitle = title.includes('PokeRogue') ? title : `${title} | PokeRogue 中文图鉴`

  let tags = `<!-- SEO_INJECT -->\n`
  tags += `    <title>${escapeHtml(fullTitle)}</title>\n`
  tags += `    <meta name="description" content="${escapeHtml(description)}" />\n`
  if (keywords) {
    tags += `    <meta name="keywords" content="${escapeHtml(keywords)}" />\n`
  }
  tags += `    <link rel="canonical" href="${escapeHtml(canonical)}" />\n`
  tags += `    <meta property="og:title" content="${escapeHtml(fullTitle)}" />\n`
  tags += `    <meta property="og:description" content="${escapeHtml(description)}" />\n`
  tags += `    <meta property="og:type" content="article" />\n`
  tags += `    <meta property="og:url" content="${escapeHtml(canonical)}" />\n`
  tags += `    <meta property="og:image" content="${escapeHtml(ogImage)}" />\n`
  tags += `    <meta property="og:locale" content="zh_CN" />\n`
  tags += `    <meta property="og:site_name" content="PokeRogue 中文图鉴" />\n`
  tags += `    <meta name="twitter:card" content="summary_large_image" />\n`
  tags += `    <meta name="twitter:title" content="${escapeHtml(fullTitle)}" />\n`
  tags += `    <meta name="twitter:description" content="${escapeHtml(description)}" />\n`
  tags += `    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />\n`

  if (jsonLdList && jsonLdList.length > 0) {
    jsonLdList.forEach(data => {
      tags += `    <script type="application/ld+json">${JSON.stringify(data)}</script>\n`
    })
  }

  return tags
}

async function writeHtmlFile(filePath, content) {
  const fullPath = join(DIST_DIR, filePath)
  await mkdir(dirname(fullPath), { recursive: true })
  await writeFile(fullPath, content)
}

async function main() {
  const templatePath = join(DIST_DIR, 'index.html')
  if (!existsSync(templatePath)) {
    console.error('dist/index.html not found. Run vite build first.')
    process.exit(1)
  }

  const template = await readFile(templatePath, 'utf-8')
  if (!template.includes('<!-- SEO_INJECT -->')) {
    console.warn('index.html missing <!-- SEO_INJECT --> placeholder, appending meta after <title>')
  }

  const [pokemons, biomes, items, nameMaps] = await Promise.all([
    readJson('pokemon.json'),
    readJson('biomes.json'),
    readJson('items.json'),
    readJson('name-maps.json'),
  ])

  const moveMap = nameMaps.move || {}
  const abilityMap = nameMaps.ability || {}
  const abilityDescriptionMap = nameMaps.abilityDescription || {}
  const moveEffectMap = nameMaps.moveEffect || {}
  const typeMap = nameMaps.type || {}

  const urls = []
  const staticPaths = [
    { path: '/', title: 'PokeRogue 中文图鉴 - 宝可梦肉鸽数据查询工具', description: 'PokeRogue 中文图鉴提供宝可梦肉鸽（PokeRogue）全精灵、地区、道具、招式、特性、性格、属性克制的详细数据查询，支持配队分析与 Smogon 推荐配招。', keywords: 'PokeRogue,宝可梦肉鸽,图鉴,精灵图鉴,道具,招式,特性,性格,属性克制,配队,Smogon' },
    { path: '/pokemon', title: `精灵图鉴 - PokeRogue 中文图鉴`, description: `查看 PokeRogue 全部 ${pokemons.length} 只宝可梦的种族值、特性、技能、进化、出现地区与 Smogon 推荐配招。`, keywords: 'PokeRogue,宝可梦肉鸽,精灵图鉴,种族值,特性,技能,进化' },
    { path: '/biomes', title: `地区查询 - PokeRogue 中文图鉴`, description: `查询 PokeRogue 全部 ${biomes.length} 个生态区的遭遇精灵、稀有度、时间段与连接地区。`, keywords: 'PokeRogue,宝可梦肉鸽,地区,生态区,遭遇,刷新点' },
    { path: '/items', title: `道具清单 - PokeRogue 中文图鉴`, description: `查看 PokeRogue 全部 ${items.length} 个商店道具的效果说明、稀有度与图标。`, keywords: 'PokeRogue,宝可梦肉鸽,道具,商店道具,效果' },
    { path: '/moves', title: `招式查询 - PokeRogue 中文图鉴`, description: `查询 PokeRogue 全部 ${Object.keys(moveMap).length} 个招式的属性、分类、威力、命中与效果。`, keywords: 'PokeRogue,宝可梦肉鸽,招式,技能,效果' },
    { path: '/abilities', title: `特性查询 - PokeRogue 中文图鉴`, description: `查询 PokeRogue 全部 ${Object.keys(abilityMap).length} 个特性的效果，以及拥有该特性的宝可梦列表。`, keywords: 'PokeRogue,宝可梦肉鸽,特性,隐藏特性,被动' },
    { path: '/natures', title: `性格表 - PokeRogue 中文图鉴`, description: '查看 PokeRogue 全部 25 种性格的加成与减成效果。', keywords: 'PokeRogue,宝可梦肉鸽,性格,加成,减成' },
    { path: '/types', title: `属性克制 - PokeRogue 中文图鉴`, description: '查看 PokeRogue 18 种属性的攻击与防御相克关系。', keywords: 'PokeRogue,宝可梦肉鸽,属性克制,属性相性' },
    { path: '/map', title: `地区导航 - PokeRogue 中文图鉴`, description: 'PokeRogue 生态区地图导航，查看地区连接关系与推荐路线。', keywords: 'PokeRogue,宝可梦肉鸽,地图,地区导航,生态区' },
    { path: '/report', title: `数据报告 - PokeRogue 中文图鉴`, description: 'PokeRogue 数据报告：覆盖率、数据版本与生成时间。', keywords: 'PokeRogue,宝可梦肉鸽,数据报告,覆盖率' },
    { path: '/team', title: `配队分析 - PokeRogue 中文图鉴`, description: 'PokeRogue 队伍构建工具：分析属性覆盖、防守抗性、职责分配与队伍缺口。', keywords: 'PokeRogue,宝可梦肉鸽,配队,队伍分析,队伍构建' },
    { path: '/en', title: 'PokeRogue Helper - Dex, Endless Guide, Fusion and Team Tools', description: 'A fan-made PokeRogue helper with a full Pokédex, base stats, abilities, egg moves, passive abilities, biome encounter tables, fusion ideas and team-building tools for endless mode.', keywords: 'PokeRogue,helper,dex,pokedex,endless,fusion,team builder' },
  ]

  const defaultPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PokeRogue 中文图鉴',
    url: SITE_URL,
  }

  for (const page of staticPaths) {
    const html = template.replace(
      '<!-- SEO_INJECT -->',
      buildMetaTags({ ...page, jsonLdList: [defaultPageJsonLd] })
    )
    await writeHtmlFile(page.path === '/' ? 'index.html' : `${page.path}/index.html`, html)
    urls.push(page.path)
  }

  // Pokemon detail pages
  for (const p of pokemons) {
    const typeZh = [p.type1, p.type2].filter(Boolean).map(t => typeMap[t] || t).join('/')
    const title = `${p.nameZh} ${p.nameEn} - PokeRogue 精灵图鉴`
    const description = `${p.nameZh}（${p.nameEn}）是${typeZh}属性宝可梦，全国图鉴编号 #${p.numericId}，种族值总和 ${p.baseTotal}。查看详细技能、特性、被动、进化链与配队建议。`
    const keywords = `PokeRogue,宝可梦肉鸽,${p.nameZh},${p.nameEn},${typeZh},图鉴,种族值,技能,特性`
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'VideoGameCharacter',
        name: `${p.nameZh} ${p.nameEn}`,
        description: `${p.nameZh}（${p.nameEn}）是${typeZh}属性宝可梦，全国图鉴编号 #${p.numericId}，种族值总和 ${p.baseTotal}。`,
        identifier: p.id,
        url: `${SITE_URL}/pokemon/${p.id}`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '精灵图鉴', item: `${SITE_URL}/pokemon` },
          { '@type': 'ListItem', position: 3, name: p.nameZh, item: `${SITE_URL}/pokemon/${p.id}` },
        ],
      },
    ]
    const html = template.replace(
      '<!-- SEO_INJECT -->',
      buildMetaTags({ title, description, keywords, path: `/pokemon/${p.id}`, jsonLdList: jsonLd })
    )
    await writeHtmlFile(`pokemon/${p.id}/index.html`, html)
    urls.push(`/pokemon/${p.id}`)
  }

  // Biome detail pages
  for (const b of biomes) {
    const title = `${b.nameZh} - PokeRogue 地区查询`
    const description = `${b.nameZh}（${b.id}）是 PokeRogue 中的生态区，共有 ${b.encounters.length} 条遭遇记录。`
    const keywords = `PokeRogue,宝可梦肉鸽,${b.nameZh},地区,遭遇,生态区`
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'Place',
        name: b.nameZh,
        description,
        url: `${SITE_URL}/biome/${b.id}`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '地区查询', item: `${SITE_URL}/biomes` },
          { '@type': 'ListItem', position: 3, name: b.nameZh, item: `${SITE_URL}/biome/${b.id}` },
        ],
      },
    ]
    const html = template.replace(
      '<!-- SEO_INJECT -->',
      buildMetaTags({ title, description, keywords, path: `/biome/${b.id}`, jsonLdList: jsonLd })
    )
    await writeHtmlFile(`biome/${b.id}/index.html`, html)
    urls.push(`/biome/${b.id}`)
  }

  // Item detail pages
  for (const item of items) {
    const title = `${item.nameZh} - PokeRogue 道具清单`
    const description = `${item.nameZh}（${item.id}）是 PokeRogue ${item.tierLabel}稀有度道具。${item.description}`
    const keywords = `PokeRogue,宝可梦肉鸽,${item.nameZh},道具,${item.tierLabel}`
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: item.nameZh,
        description: item.description,
        category: item.tierLabel,
        url: `${SITE_URL}/item/${item.id}`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '道具清单', item: `${SITE_URL}/items` },
          { '@type': 'ListItem', position: 3, name: item.nameZh, item: `${SITE_URL}/item/${item.id}` },
        ],
      },
    ]
    const html = template.replace(
      '<!-- SEO_INJECT -->',
      buildMetaTags({ title, description, keywords, path: `/item/${item.id}`, jsonLdList: jsonLd })
    )
    await writeHtmlFile(`item/${item.id}/index.html`, html)
    urls.push(`/item/${item.id}`)
  }

  // Move detail pages
  const moveList = Object.entries(moveMap).map(([id, nameZh]) => ({ id, nameZh }))
  for (const move of moveList) {
    const title = `${move.nameZh} - PokeRogue 招式查询`
    const effect = moveEffectMap[move.id] || ''
    const description = `${move.nameZh}（${move.id}）是 PokeRogue 招式。${effect}`
    const keywords = `PokeRogue,宝可梦肉鸽,${move.nameZh},招式`
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'Thing',
        name: move.nameZh,
        description,
        url: `${SITE_URL}/move/${move.id}`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '招式查询', item: `${SITE_URL}/moves` },
          { '@type': 'ListItem', position: 3, name: move.nameZh, item: `${SITE_URL}/move/${move.id}` },
        ],
      },
    ]
    const html = template.replace(
      '<!-- SEO_INJECT -->',
      buildMetaTags({ title, description, keywords, path: `/move/${move.id}`, jsonLdList: jsonLd })
    )
    await writeHtmlFile(`move/${move.id}/index.html`, html)
    urls.push(`/move/${move.id}`)
  }

  // Ability detail pages
  const abilityList = Object.entries(abilityMap).map(([id, nameZh]) => ({ id, nameZh }))
  for (const ability of abilityList) {
    const title = `${ability.nameZh} - PokeRogue 特性查询`
    const description = `${ability.nameZh}（${ability.id}）${abilityDescriptionMap[ability.id] ? `：${abilityDescriptionMap[ability.id]}` : '是 PokeRogue 中的宝可梦特性。'}`
    const keywords = `PokeRogue,宝可梦肉鸽,${ability.nameZh},特性,隐藏特性`
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'Thing',
        name: ability.nameZh,
        description,
        url: `${SITE_URL}/ability/${ability.id}`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '特性查询', item: `${SITE_URL}/abilities` },
          { '@type': 'ListItem', position: 3, name: ability.nameZh, item: `${SITE_URL}/ability/${ability.id}` },
        ],
      },
    ]
    const html = template.replace(
      '<!-- SEO_INJECT -->',
      buildMetaTags({ title, description, keywords, path: `/ability/${ability.id}`, jsonLdList: jsonLd })
    )
    await writeHtmlFile(`ability/${ability.id}/index.html`, html)
    urls.push(`/ability/${ability.id}`)
  }

  // Nature detail pages
  const natureRows = [
    { id: 'HARDY', nameZh: '勤奋' }, { id: 'LONELY', nameZh: '怕寂寞' },
    { id: 'BRAVE', nameZh: '勇敢' }, { id: 'ADAMANT', nameZh: '固执' },
    { id: 'NAUGHTY', nameZh: '顽皮' }, { id: 'BOLD', nameZh: '大胆' },
    { id: 'DOCILE', nameZh: '坦率' }, { id: 'RELAXED', nameZh: '悠闲' },
    { id: 'IMPISH', nameZh: '淘气' }, { id: 'LAX', nameZh: '乐天' },
    { id: 'TIMID', nameZh: '胆小' }, { id: 'HASTY', nameZh: '急躁' },
    { id: 'SERIOUS', nameZh: '认真' }, { id: 'JOLLY', nameZh: '爽朗' },
    { id: 'NAIVE', nameZh: '天真' }, { id: 'MODEST', nameZh: '内敛' },
    { id: 'MILD', nameZh: '慢吞吞' }, { id: 'QUIET', nameZh: '冷静' },
    { id: 'BASHFUL', nameZh: '害羞' }, { id: 'RASH', nameZh: '马虎' },
    { id: 'CALM', nameZh: '温和' }, { id: 'GENTLE', nameZh: '温顺' },
    { id: 'SASSY', nameZh: '自大' }, { id: 'CAREFUL', nameZh: '慎重' },
    { id: 'QUIRKY', nameZh: '浮躁' },
  ]
  for (const nature of natureRows) {
    const title = `${nature.nameZh} - PokeRogue 性格表`
    const description = `${nature.nameZh}性格的效果与能力值修正。`
    const keywords = `PokeRogue,宝可梦肉鸽,${nature.nameZh},性格`
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'Thing',
        name: nature.nameZh,
        description,
        url: `${SITE_URL}/nature/${nature.id}`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '性格表', item: `${SITE_URL}/natures` },
          { '@type': 'ListItem', position: 3, name: nature.nameZh, item: `${SITE_URL}/nature/${nature.id}` },
        ],
      },
    ]
    const html = template.replace(
      '<!-- SEO_INJECT -->',
      buildMetaTags({ title, description, keywords, path: `/nature/${nature.id}`, jsonLdList: jsonLd })
    )
    await writeHtmlFile(`nature/${nature.id}/index.html`, html)
    urls.push(`/nature/${nature.id}`)
  }

  // Type detail pages
  const typeRows = Object.entries(typeMap)
  for (const [type, nameZh] of typeRows) {
    const title = `${nameZh}属性 - PokeRogue 属性克制`
    const description = `查看${nameZh}属性在 PokeRogue 中的攻击克制、防守弱点与抗性。`
    const keywords = `PokeRogue,宝可梦肉鸽,${nameZh},属性克制`
    const jsonLd = [
      {
        '@context': 'https://schema.org',
        '@type': 'Thing',
        name: `${nameZh}属性`,
        description,
        url: `${SITE_URL}/type/${type}`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: '属性克制', item: `${SITE_URL}/types` },
          { '@type': 'ListItem', position: 3, name: nameZh, item: `${SITE_URL}/type/${type}` },
        ],
      },
    ]
    const html = template.replace(
      '<!-- SEO_INJECT -->',
      buildMetaTags({ title, description, keywords, path: `/type/${type}`, jsonLdList: jsonLd })
    )
    await writeHtmlFile(`type/${type}/index.html`, html)
    urls.push(`/type/${type}`)
  }

  // sitemap.xml
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>\n    <loc>${SITE_URL}${url}</loc>\n  </url>`).join('\n')}
</urlset>`
  await writeFile(join(DIST_DIR, 'sitemap.xml'), sitemap)

  // robots.txt
  const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`
  await writeFile(join(DIST_DIR, 'robots.txt'), robots)

  console.log(`Generated ${urls.length} static pages.`)
  console.log(`Sitemap: ${join(DIST_DIR, 'sitemap.xml')}`)
  console.log(`Robots: ${join(DIST_DIR, 'robots.txt')}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
