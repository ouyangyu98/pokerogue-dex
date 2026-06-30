import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getTeamMeta } from '../seo/generateMeta'
import { buildWebSite, buildBreadcrumbList } from '../seo/schemaBuilders'
import TeamBuilderPageOriginal from '../teamBuilder/TeamBuilderPage'

export default function TeamBuilderPage() {
  const meta = getTeamMeta()

  return (
    <div className="page">
      <SEOMeta title={meta.title} description={meta.description} path="/team" keywords={meta.keywords} />
      <JsonLd
        data={[
          buildWebSite(),
          buildBreadcrumbList([
            { name: '首页', path: '/' },
            { name: '配队分析', path: '/team' },
          ]),
        ]}
      />
      <TeamBuilderPageOriginal />
    </div>
  )
}
