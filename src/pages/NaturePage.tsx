import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getNatureListMeta } from '../seo/generateMeta'
import { buildCollectionPage, buildWebSite } from '../seo/schemaBuilders'
import NatureTable from '../components/NatureTable'

export default function NaturePage() {
  const meta = getNatureListMeta()

  return (
    <div className="page">
      <SEOMeta title={meta.title} description={meta.description} path="/natures" keywords={meta.keywords} />
      <JsonLd
        data={[
          buildCollectionPage('性格表', '/natures', 25, []),
          buildWebSite(),
        ]}
      />
      <NatureTable />
    </div>
  )
}
