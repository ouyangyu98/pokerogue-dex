import { Link } from 'react-router-dom'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getHomeMeta } from '../seo/generateMeta'
import { buildWebSite } from '../seo/schemaBuilders'

interface NavCard {
  to: string
  icon: string
  title: string
  desc: string
  primary?: boolean
}

const navCards: NavCard[] = [
  {
    to: '/pokemon',
    icon: '🔍',
    title: '精灵图鉴',
    desc: '按属性、世代、地区、稀有度筛选，查看完整种族值与配招推荐。',
    primary: true,
  },
  {
    to: '/biomes',
    icon: '🗺️',
    title: '地区查询',
    desc: '浏览所有野生生态区，查看每个地区的遭遇列表与首领信息。',
  },
  {
    to: '/types',
    icon: '⚔️',
    title: '属性克制',
    desc: '18 属性攻防双视角总览，支持单属性聚焦与双属性组合分析。',
  },
  {
    to: '/items',
    icon: '🎒',
    title: '道具清单',
    desc: '按商店稀有度分组，快速了解每个道具的中文名与用途。',
  },
  {
    to: '/team',
    icon: '🛡️',
    title: '配队分析',
    desc: '选择多只精灵，实时分析队伍的属性弱点与抗性覆盖。',
  },
  {
    to: '/natures',
    icon: '📊',
    title: '性格表',
    desc: '所有性格对能力值的影响一览，方便培育时快速查阅。',
  },
  {
    to: '/report',
    icon: '📈',
    title: '数据报告',
    desc: '当前数据覆盖范围、版本状态与数据源说明。',
  },
  {
    to: '/feedback',
    icon: '💬',
    title: '反馈建议',
    desc: '发现数据错误或有新功能想法？欢迎提交反馈。',
  },
]

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
      <section className="home-hero">
        <h2>一切从查询开始</h2>
        <p>
          这里汇集了精灵、招式、道具、属性、地区、性格、数据报告等 PokeRogue 全中文数据，快速定位你需要的工具。
        </p>
      </section>
      <nav className="home-nav-grid" aria-label="功能导航">
        {navCards.map(card => (
          <Link
            key={card.to}
            to={card.to}
            className={`home-nav-card${card.primary ? ' is-primary' : ''}`}
          >
            <span className="home-nav-icon" aria-hidden="true">
              {card.icon}
            </span>
            <span className="home-nav-title">{card.title}</span>
            <span className="home-nav-desc">{card.desc}</span>
          </Link>
        ))}
      </nav>
      <p className="home-nav-tip">提示：点击任意卡片即可进入对应功能页面。</p>
    </div>
  )
}
