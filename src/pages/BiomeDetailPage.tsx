import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getBiomeMeta } from '../seo/generateMeta'
import { buildBiomeSchema, buildBreadcrumbList } from '../seo/schemaBuilders'
import type { Biome, Pokemon } from '../types'

const timeNames: Record<string, string> = {
  DAWN: '黎明', DAY: '白天', DUSK: '黄昏', NIGHT: '夜晚', ALL: '全天',
}

const tierOrder = ['COMMON', 'UNCOMMON', 'RARE', 'SUPER_RARE', 'ULTRA_RARE', 'BOSS', 'BOSS_RARE', 'BOSS_SUPER_RARE', 'BOSS_ULTRA_RARE']

export default function BiomeDetailPage() {
  const { id } = useParams()
  const [biomes, setBiomes] = useState<Biome[]>([])
  const [pokemonMap, setPokemonMap] = useState<Record<string, Pokemon>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/data/biomes.json').then(r => r.json()),
      fetch('/data/pokemon.json').then(r => r.json()),
    ])
      .then(([biomeData, pokemonData]: [Biome[], Pokemon[]]) => {
        setBiomes(biomeData)
        setPokemonMap(Object.fromEntries(pokemonData.map(p => [p.id, p])))
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const biome = useMemo(() => biomes.find(b => b.id === id), [biomes, id])

  if (loading) return <div className="loading">加载中...</div>
  if (!biome) return <div className="loading">未找到该地区</div>

  const sortedEncounters = [...biome.encounters].sort((a, b) => {
    const ia = tierOrder.indexOf(a.poolTier)
    const ib = tierOrder.indexOf(b.poolTier)
    if (ia !== ib) return ia - ib
    return b.individualProbability - a.individualProbability
  })

  const meta = getBiomeMeta(biome, biome.encounters.length)
  const topSpecies = sortedEncounters.slice(0, 10).map(e => ({
    id: e.speciesId,
    nameZh: pokemonMap[e.speciesId]?.nameZh || e.speciesId,
  }))

  return (
    <div className="biome-detail-page detail-page">
      <SEOMeta
        title={meta.title}
        description={meta.description}
        path={`/biome/${biome.id}`}
        keywords={meta.keywords}
      />
      <JsonLd
        data={[
          ...buildBiomeSchema(biome, topSpecies),
          buildBreadcrumbList([
            { name: '首页', path: '/' },
            { name: '地区查询', path: '/biomes' },
            { name: biome.nameZh, path: `/biome/${biome.id}` },
          ]),
        ]}
      />

      <Link to="/biomes" className="back-link">← 返回地区查询</Link>

      <h1>{biome.nameZh} <span className="sub">{biome.id}</span></h1>
      <p className="lead">{biome.nameZh}是 PokeRogue 中的生态区，共有 {biome.encounters.length} 条遭遇记录。
        {biome.biomeLinks.length > 0 && `连接地区：${biome.biomeLinks.join('、')}。`}
      </p>

      {biome.biomeLinks.length > 0 && (
        <section className="detail-section">
          <h2>连接地区</h2>
          <ul className="tag-list">
            {biome.biomeLinks.map(link => (
              <li key={link}>
                <Link to={`/biome/${link}`}>{link}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="detail-section">
        <h2>遭遇精灵（按稀有度排序）</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>精灵</th>
                <th>稀有度</th>
                <th>时间段</th>
                <th>类型</th>
                <th>个体概率</th>
              </tr>
            </thead>
            <tbody>
              {sortedEncounters.map((e, idx) => (
                <tr key={idx} className={e.isBoss ? 'boss-row' : ''}>
                  <td>
                    <Link to={`/pokemon/${e.speciesId}`}>{pokemonMap[e.speciesId]?.nameZh || e.speciesId}</Link>
                  </td>
                  <td>{e.rarity}</td>
                  <td>{timeNames[e.timeOfDay] || e.timeOfDay}</td>
                  <td>{e.isBoss ? 'Boss' : '普通'}</td>
                  <td>{e.individualProbability}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
