import { Link } from 'react-router-dom'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getNotFoundMeta } from '../seo/generateMeta'
import { buildWebSite } from '../seo/schemaBuilders'

export default function NotFoundPage() {
  const meta = getNotFoundMeta()

  return (
    <div className="page not-found-page">
      <SEOMeta title={meta.title} description={meta.description} path="/404" noindex />
      <JsonLd data={buildWebSite()} />
      <h1>404 - 页面未找到</h1>
      <p>抱歉，你访问的页面不存在。</p>
      <Link to="/" className="home-action-btn">返回首页</Link>
    </div>
  )
}
