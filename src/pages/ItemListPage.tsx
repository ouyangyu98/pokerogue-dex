import { useEffect, useState } from 'react'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getItemListMeta } from '../seo/generateMeta'
import { buildCollectionPage, buildWebSite } from '../seo/schemaBuilders'
import ItemList from '../components/ItemList'
import type { TypeMatchupItem } from '../types'

export default function ItemListPage() {
  const [count, setCount] = useState(0)
  const meta = getItemListMeta(count)

  useEffect(() => {
    fetch('/data/items.json')
      .then(r => r.json())
      .then((data: TypeMatchupItem[]) => setCount(data.length))
      .catch(() => {})
  }, [])

  return (
    <div className="page">
      <SEOMeta title={meta.title} description={meta.description} path="/items" keywords={meta.keywords} />
      <JsonLd
        data={[
          buildCollectionPage('道具清单', '/items', count, []),
          buildWebSite(),
        ]}
      />
      <ItemList />
    </div>
  )
}
