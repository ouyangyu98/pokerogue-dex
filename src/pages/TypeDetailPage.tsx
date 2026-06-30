import { useParams, Link } from 'react-router-dom'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getTypeMeta } from '../seo/generateMeta'
import { buildTypeSchema, buildBreadcrumbList } from '../seo/schemaBuilders'
import { PokemonTypeNames, type PokemonTypeKey } from '../types'

export default function TypeDetailPage() {
  const { id } = useParams()
  const validTypes = Object.keys(PokemonTypeNames) as PokemonTypeKey[]
  const type = validTypes.find(t => t === id)

  if (!type) return <div className="loading">未找到该属性</div>

  const nameZh = PokemonTypeNames[type]
  const meta = getTypeMeta(type, nameZh)

  return (
    <div className="type-detail-page detail-page">
      <SEOMeta title={meta.title} description={meta.description} path={`/type/${type}`} keywords={meta.keywords} />
      <JsonLd
        data={[
          ...buildTypeSchema(type, nameZh),
          buildBreadcrumbList([
            { name: '首页', path: '/' },
            { name: '属性克制', path: '/types' },
            { name: nameZh, path: `/type/${type}` },
          ]),
        ]}
      />

      <Link to="/types" className="back-link">← 返回属性克制</Link>

      <h1>{nameZh}属性</h1>
      <p className="lead">查看{nameZh}属性在 PokeRogue 中的攻击克制、防守弱点与抗性。请前往属性克制页使用交互式矩阵。</p>
    </div>
  )
}
