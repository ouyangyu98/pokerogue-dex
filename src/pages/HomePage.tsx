import { Link } from 'react-router-dom'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getHomeMeta } from '../seo/generateMeta'
import { buildWebSite } from '../seo/schemaBuilders'

export default function HomePage() {
  const meta = getHomeMeta()

  return (
    <div className="home-page">
      <SEOMeta title={meta.title} description={meta.description} path="/" keywords={meta.keywords} />
      <JsonLd
        data={[
          buildWebSite(),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: meta.title,
            description: meta.description,
          },
        ]}
      />
      <div className="home-hero">
        <h2>PokeRogue 中文图鉴</h2>
        <p>宝可梦肉鸽（PokeRogue）全中文数据查询工具：精灵图鉴、地区查询、道具清单、招式特性、性格加成、属性克制与配队分析。</p>
        <div className="home-actions">
          <Link to="/pokemon" className="home-action-btn">浏览精灵图鉴</Link>
          <Link to="/biomes" className="home-action-btn">查询生态区</Link>
          <Link to="/items" className="home-action-btn">查看道具</Link>
        </div>
      </div>
    </div>
  )
}
