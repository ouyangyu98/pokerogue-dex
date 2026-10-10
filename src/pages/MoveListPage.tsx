import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getMoveListMeta } from '../seo/generateMeta'
import { buildCollectionPage, buildWebSite } from '../seo/schemaBuilders'
import { renderTypeBadge, renderMoveCategoryBadge } from '../utils/render'
import type { Pokemon } from '../types'

interface NameMaps {
  move?: Record<string, string>
  moveEffect?: Record<string, string>
  type?: Record<string, string>
}

interface MoveRow {
  id: string
  nameZh: string
  type?: string
  category?: string
  power?: number | null
  accuracy?: number | null
  effect?: string
}

export default function MoveListPage() {
  const [moves, setMoves] = useState<MoveRow[]>([])
  const [search, setSearch] = useState('')
  const [count, setCount] = useState(0)
  const meta = getMoveListMeta(count)

  useEffect(() => {
    Promise.all([fetch('/data/name-maps.json').then(r => r.json()), fetch('/data/pokemon.json').then(r => r.json())])
      .then(([nameMaps, pokemonData]: [NameMaps, Pokemon[]]) => {
        const moveMap = nameMaps.move || {}
        const moveEffectMap = nameMaps.moveEffect || {}

        const seen = new Set<string>()
        const moveList: MoveRow[] = []

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

  const filteredMoves = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return moves
    return moves.filter(move =>
      move.nameZh.toLowerCase().includes(keyword) ||
      move.id.toLowerCase().includes(keyword)
    )
  }, [moves, search])

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
      <p>共 {filteredMoves.length} 个招式，点击招式查看可学习的宝可梦列表。</p>
      <div className="move-list-toolbar">
        <input
          className="search-input"
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="搜索招式中文名..."
          aria-label="搜索招式中文名或内部 ID"
        />
        {search && (
          <button type="button" className="reset-btn" onClick={() => setSearch('')}>
            清除搜索
          </button>
        )}
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>中文名</th>
              <th>属性</th>
              <th>分类</th>
              <th>威力</th>
              <th>命中</th>
              <th>效果</th>
            </tr>
          </thead>
          <tbody>
            {filteredMoves.map(move => (
              <tr key={move.id} className="clickable">
                <td><Link to={`/move/${move.id}`}>{move.nameZh}</Link></td>
                <td>{renderTypeBadge(move.type || null) || '-'}</td>
                <td>{renderMoveCategoryBadge(move.category || null)}</td>
                <td>{move.power ?? '-'}</td>
                <td>{move.accuracy ?? '-'}</td>
                <td className="move-effect-cell" title={move.effect || ''}>
                  {move.effect || '暂无效果说明'}
                </td>
              </tr>
            ))}
            {filteredMoves.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-cell">没有找到匹配的招式。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
