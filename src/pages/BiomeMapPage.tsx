import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getMapMeta } from '../seo/generateMeta'
import { buildWebSite } from '../seo/schemaBuilders'
import BiomeMapPageOriginal from '../components/BiomeMapPage'

export default function BiomeMapPage() {
  const meta = getMapMeta()

  return (
    <div className="page">
      <SEOMeta title={meta.title} description={meta.description} path="/map" keywords={meta.keywords} />
      <JsonLd data={buildWebSite()} />
      <BiomeMapPageOriginal />
    </div>
  )
}
