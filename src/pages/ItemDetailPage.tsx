import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getItemMeta } from '../seo/generateMeta'
import { buildItemSchema, buildBreadcrumbList } from '../seo/schemaBuilders'
import type { TypeMatchupItem } from '../types'

export default function ItemDetailPage() {
  const { id } = useParams()
  const [items, setItems] = useState<TypeMatchupItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/items.json')
      .then(r => r.json())
      .then((data: TypeMatchupItem[]) => {
        setItems(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const item = useMemo(() => items.find(i => i.id === id), [items, id])

  if (loading) return <div className="loading">加载中...</div>
  if (!item) return <div className="loading">未找到该道具</div>

  const meta = getItemMeta(item)

  return (
    <div className="item-detail-page detail-page">
      <SEOMeta
        title={meta.title}
        description={meta.description}
        path={`/item/${item.id}`}
        keywords={meta.keywords}
      />
      <JsonLd
        data={[
          ...buildItemSchema(item),
          buildBreadcrumbList([
            { name: '首页', path: '/' },
            { name: '道具清单', path: '/items' },
            { name: item.nameZh, path: `/item/${item.id}` },
          ]),
        ]}
      />

      <Link to="/items" className="back-link">← 返回道具清单</Link>

      <h1>{item.nameZh} <span className="sub">{item.id}</span></h1>
      <p className="lead">{item.nameZh}是 PokeRogue 中的{item.tierLabel}稀有度道具。{item.description}</p>

      <section className="detail-section">
        <h2>道具信息</h2>
        <ul>
          <li><strong>中文名：</strong>{item.nameZh}</li>
          <li><strong>内部 ID：</strong>{item.id}</li>
          <li><strong>稀有度：</strong>{item.tierLabel}（{item.tier}）</li>
        </ul>
      </section>

      <section className="detail-section">
        <h2>效果说明</h2>
        <p>{item.description}</p>
      </section>
    </div>
  )
}
