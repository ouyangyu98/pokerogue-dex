import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getAbilityMeta } from '../seo/generateMeta'
import { buildAbilitySchema, buildBreadcrumbList } from '../seo/schemaBuilders'
import type { Pokemon } from '../types'

interface NameMaps {
  ability?: Record<string, string>
  abilityDescription?: Record<string, string>
}

export default function AbilityDetailPage() {
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

  const abilityInfo = useMemo(() => {
    return {
      id: id || '',
      nameZh: nameMaps.ability?.[id || ''] || id || '',
      description: nameMaps.abilityDescription?.[id || ''],
    }
  }, [nameMaps, id])

  const owners = useMemo(() => {
    return pokemons.filter(
      p =>
        p.ability1 === id ||
        p.ability2 === id ||
        p.abilityHidden === id ||
        p.passive === id ||
        (p.forms || []).some(f => f.ability1 === id || f.ability2 === id || f.abilityHidden === id || f.passive === id)
    )
  }, [pokemons, id])

  if (loading) return <div className="loading">加载中...</div>
  if (!id || !nameMaps.ability?.[id]) return <div className="loading">未找到该特性</div>

  const meta = getAbilityMeta(abilityInfo, owners.length)

  return (
    <div className="ability-detail-page detail-page">
      <SEOMeta title={meta.title} description={meta.description} path={`/ability/${id}`} keywords={meta.keywords} />
      <JsonLd
        data={[
          ...buildAbilitySchema(abilityInfo, owners.map(p => p.nameZh)),
          buildBreadcrumbList([
            { name: '首页', path: '/' },
            { name: '特性查询', path: '/abilities' },
            { name: abilityInfo.nameZh, path: `/ability/${id}` },
          ]),
        ]}
      />

      <Link to="/abilities" className="back-link">← 返回特性查询</Link>

      <h1>{abilityInfo.nameZh} <span className="sub">{id}</span></h1>
      <p className="lead">{abilityInfo.description || `${abilityInfo.nameZh}是 PokeRogue 中的宝可梦特性。`}</p>

      <section className="detail-section">
        <h2>拥有该特性的宝可梦（{owners.length} 只）</h2>
        {owners.length > 0 ? (
          <ul className="tag-list">
            {owners.slice(0, 100).map(p => (
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
