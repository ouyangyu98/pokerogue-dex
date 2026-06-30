import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getTypeListMeta } from '../seo/generateMeta'
import { buildCollectionPage, buildWebSite } from '../seo/schemaBuilders'
import TypeMatchupPageOriginal from '../components/TypeMatchupPage'

export default function TypeMatchupPage() {
  const meta = getTypeListMeta()

  return (
    <div className="page">
      <SEOMeta title={meta.title} description={meta.description} path="/types" keywords={meta.keywords} />
      <JsonLd
        data={[
          buildCollectionPage('属性克制', '/types', 18, []),
          buildWebSite(),
        ]}
      />
      <TypeMatchupPageOriginal />
    </div>
  )
}
