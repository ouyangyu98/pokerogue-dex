import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getMoveMeta } from '../seo/generateMeta'
import { buildMoveSchema, buildBreadcrumbList } from '../seo/schemaBuilders'
import type { Pokemon } from '../types'

interface NameMaps {
  move?: Record<string, string>
  moveEffect?: Record<string, string>
  type?: Record<string, string>
}

export default function MoveDetailPage() {
  const { id } = useParams()
  const [pokemons, setPokemons] = useState<Pokemon[]>([])
  const [nameMaps, setNameMaps] = useState<NameMaps>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetch('/data/pokemon.json').then(r => r.json()), fetch('/data/name-maps.json').then(r => r.json())])
      .then(([pokemonData, nameMapData]: [Pokemon[], NameMaps]) => {
        setPokemons(pokemonData)
        setNameMaps(nameMapData)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const moveInfo = useMemo(() => {
    const moveName = nameMaps.move?.[id || ''] || id || ''
    let found: { type?: string | null; category?: string | null; power?: number | null; accuracy?: number | null } = {}
    for (const p of pokemons) {
      const m = [...(p.levelMoves || []), ...(p.eggMoves || [])].find(m => m.moveId === id)
      if (m) {
        found = { type: m.type, category: m.category, power: m.power, accuracy: m.accuracy }
        break
      }
    }
    return {
      id: id || '',
      nameZh: moveName,
      ...found,
      effect: nameMaps.moveEffect?.[id || ''],
    }
  }, [pokemons, nameMaps, id])

  const learners = useMemo(() => {
    return pokemons.filter(p => (p.levelMoves || []).some(m => m.moveId === id) || (p.eggMoves || []).some(m => m.moveId === id))
  }, [pokemons, id])

  if (loading) return <div className="loading">加载中...</div>
  if (!id || !nameMaps.move?.[id]) return <div className="loading">未找到该招式</div>

  const meta = getMoveMeta(moveInfo, learners.length)

  return (
    <div className="move-detail-page detail-page">
      <SEOMeta title={meta.title} description={meta.description} path={`/move/${id}`} keywords={meta.keywords} />
      <JsonLd
        data={[
          ...buildMoveSchema(moveInfo, learners.map(p => p.nameZh)),
          buildBreadcrumbList([
            { name: '首页', path: '/' },
            { name: '招式查询', path: '/moves' },
            { name: moveInfo.nameZh, path: `/move/${id}` },
          ]),
        ]}
      />

      <Link to="/moves" className="back-link">← 返回招式查询</Link>

      <h1>{moveInfo.nameZh} <span className="sub">{id}</span></h1>
      <p className="lead">{moveInfo.nameZh}是{moveInfo.type ? moveInfo.type + '属性' : ''}招式，{moveInfo.category ? moveInfo.category + '招式' : ''}
        {moveInfo.power ? `，威力 ${moveInfo.power}` : ''}{moveInfo.accuracy ? `，命中 ${moveInfo.accuracy}` : ''}。{moveInfo.effect || ''}
      </p>

      <section className="detail-section">
        <h2>可学习的宝可梦（{learners.length} 只）</h2>
        {learners.length > 0 ? (
          <ul className="tag-list">
            {learners.slice(0, 100).map(p => (
              <li key={p.id}>
                <Link to={`/pokemon/${p.id}`}>{p.nameZh}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>暂无数据。</p>
        )}
      </section>
    </div>
  )
}
