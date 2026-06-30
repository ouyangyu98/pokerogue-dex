import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getAbilityListMeta } from '../seo/generateMeta'
import { buildCollectionPage, buildWebSite } from '../seo/schemaBuilders'
import type { Pokemon } from '../types'

interface NameMaps {
  ability?: Record<string, string>
  abilityDescription?: Record<string, string>
}

export default function AbilityListPage() {
  const [abilities, setAbilities] = useState<{ id: string; nameZh: string; description?: string }[]>([])
  const [count, setCount] = useState(0)
  const meta = getAbilityListMeta(count)

  useEffect(() => {
    Promise.all([fetch('/data/name-maps.json').then(r => r.json()), fetch('/data/pokemon.json').then(r => r.json())])
      .then(([nameMaps, _pokemonData]: [NameMaps, Pokemon[]]) => {
        const abilityMap = nameMaps.ability || {}
        const abilityDescriptionMap = nameMaps.abilityDescription || {}
        const list = Object.entries(abilityMap).map(([id, nameZh]) => ({
          id,
          nameZh,
          description: abilityDescriptionMap[id],
        }))
        setAbilities(list.sort((a, b) => a.nameZh.localeCompare(b.nameZh, 'zh-CN')))
        setCount(list.length)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="page">
      <SEOMeta title={meta.title} description={meta.description} path="/abilities" keywords={meta.keywords} />
      <JsonLd
        data={[
          buildCollectionPage('特性查询', '/abilities', count, abilities.slice(0, 12).map(a => a.nameZh)),
          buildWebSite(),
        ]}
      />
      <h1>特性查询</h1>
      <p>共 {count} 个特性，点击特性查看拥有该特性的宝可梦列表。</p>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>中文名</th>
              <th>内部 ID</th>
              <th>效果</th>
            </tr>
          </thead>
          <tbody>
            {abilities.map(ability => (
              <tr key={ability.id} className="clickable">
                <td><Link to={`/ability/${ability.id}`}>{ability.nameZh}</Link></td>
                <td>{ability.id}</td>
                <td>{ability.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
