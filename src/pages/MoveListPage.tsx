import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getMoveListMeta } from '../seo/generateMeta'
import { buildCollectionPage, buildWebSite } from '../seo/schemaBuilders'
import type { Pokemon } from '../types'

interface NameMaps {
  move?: Record<string, string>
  moveEffect?: Record<string, string>
  type?: Record<string, string>
}

export default function MoveListPage() {
  const [moves, setMoves] = useState<{ id: string; nameZh: string; type?: string; category?: string; power?: number | null; accuracy?: number | null }[]>([])
  const [count, setCount] = useState(0)
  const meta = getMoveListMeta(count)

  useEffect(() => {
    Promise.all([fetch('/data/name-maps.json').then(r => r.json()), fetch('/data/pokemon.json').then(r => r.json())])
      .then(([nameMaps, pokemonData]: [NameMaps, Pokemon[]]) => {
        const moveMap = nameMaps.move || {}
        const moveEffectMap = nameMaps.moveEffect || {}

        const seen = new Set<string>()
        const moveList: { id: string; nameZh: string; type?: string; category?: string; power?: number | null; accuracy?: number | null; effect?: string }[] = []

        pokemonData.forEach(p => {
          ;[...(p.levelMoves || []), ...(p.eggMoves || [])].forEach(m => {
            if (!seen.has(m.moveId)) {
              seen.add(m.moveId)
              moveList.push({
                id: m.moveId,
                nameZh: m.moveZh,
                type: m.type || undefined,
                category: m.category || undefined,
                power: m.power,
                accuracy: m.accuracy,
                effect: moveEffectMap[m.moveId],
              })
            }
          })
        })

        Object.entries(moveMap).forEach(([id, nameZh]) => {
          if (!seen.has(id)) {
            seen.add(id)
            moveList.push({ id, nameZh, effect: moveEffectMap[id] })
          }
        })

        setMoves(moveList.sort((a, b) => a.nameZh.localeCompare(b.nameZh, 'zh-CN')))
        setCount(moveList.length)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="page">
      <SEOMeta title={meta.title} description={meta.description} path="/moves" keywords={meta.keywords} />
      <JsonLd
        data={[
          buildCollectionPage('招式查询', '/moves', count, moves.slice(0, 12).map(m => m.nameZh)),
          buildWebSite(),
        ]}
      />
      <h1>招式查询</h1>
      <p>共 {count} 个招式，点击招式查看可学习的宝可梦列表。</p>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>中文名</th>
              <th>内部 ID</th>
              <th>属性</th>
              <th>分类</th>
              <th>威力</th>
              <th>命中</th>
            </tr>
          </thead>
          <tbody>
            {moves.map(move => (
              <tr key={move.id} className="clickable">
                <td><Link to={`/move/${move.id}`}>{move.nameZh}</Link></td>
                <td>{move.id}</td>
                <td>{move.type || '-'}</td>
                <td>{move.category || '-'}</td>
                <td>{move.power ?? '-'}</td>
                <td>{move.accuracy ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
