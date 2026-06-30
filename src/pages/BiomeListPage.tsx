import { useEffect, useState } from 'react'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getBiomeListMeta } from '../seo/generateMeta'
import { buildCollectionPage, buildWebSite } from '../seo/schemaBuilders'
import BiomeList from '../components/BiomeList'
import type { Biome } from '../types'

export default function BiomeListPage() {
  const [count, setCount] = useState(0)
  const meta = getBiomeListMeta(count)

  useEffect(() => {
    fetch('/data/biomes.json')
      .then(r => r.json())
      .then((data: Biome[]) => setCount(data.length))
      .catch(() => {})
  }, [])

  return (
    <div className="page">
      <SEOMeta title={meta.title} description={meta.description} path="/biomes" keywords={meta.keywords} />
      <JsonLd
        data={[
          buildCollectionPage('地区查询', '/biomes', count, []),
          buildWebSite(),
        ]}
      />
      <BiomeList />
    </div>
  )
}
