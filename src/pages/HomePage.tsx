import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
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

interface QuickLink {
  to: string
  title: string
  desc: string
}

const navCards: NavCard[] = [
  {
    to: '/pokemon',
    icon: '🔍',
    title: '精灵图鉴',
    desc: '搜索宝可梦，查看属性、费用、地区、招式和种族值。',
    primary: true,
  },
  {
    to: '/biomes',
    icon: '🗺️',
    title: '按地区找精灵',
    desc: '查看每个地区的遭遇列表、稀有度和首领信息。',
  },
  {
    to: '/map',
    icon: '🧭',
    title: '地区路线图',
    desc: '选择起点和终点，查看肉鸽地图中的最短路线。',
  },
  {
    to: '/types',
    icon: '⚔️',
    title: '查属性克制',
    desc: '快速判断攻击和防守时的属性倍率。',
  },
  {
    to: '/items',
    icon: '🎒',
    title: '查道具效果',
    desc: '按商店稀有度分组，快速了解每个道具的中文名与用途。',
  },
  {
    to: '/team',
    icon: '🛡️',
    title: '分析队伍弱点',
    desc: '选择多只精灵，实时分析队伍的属性弱点与抗性覆盖。',
  },
  {
    to: '/natures',
    icon: '📊',
    title: '查性格加成',
    desc: '所有性格对能力值的影响一览，方便培育时快速查阅。',
  },
  {
    to: '/report',
    icon: '📈',
    title: '查看数据状态',
    desc: '当前数据覆盖范围、版本状态与数据源说明。',
  },
  {
    to: '/feedback',
    icon: '💬',
    title: '提交反馈',
    desc: '报告数据问题或提出功能建议。',
  },
]

const quickLinks: QuickLink[] = [
  { to: '/moves', title: '招式资料', desc: '按招式名称查看属性、威力和效果。' },
  { to: '/abilities', title: '特性资料', desc: '查找特性与被动效果。' },
]

export default function HomePage() {
  const meta = getHomeMeta()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    navigate(value ? `/pokemon?search=${encodeURIComponent(value)}` : '/pokemon')
  }

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
        <p className="home-eyebrow">PokeRogue 中文数据工具</p>
        <h2>先找到你要用的资料</h2>
        <p>查一只宝可梦、一个招式，或确认它出现在哪个地区。</p>
        <form className="home-search" onSubmit={handleSearch}>
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="搜索宝可梦中文名、英文名或编号"
            aria-label="搜索宝可梦"
          />
          <button type="submit">开始查询</button>
        </form>
        <p className="home-search-hint">例如：未知图腾、Unown、201</p>
      </section>
      <nav className="home-nav-grid" aria-label="常用查询">
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
      <section className="home-secondary" aria-label="更多资料">
        <div className="home-section-heading">
          <h3>更多资料</h3>
          <span>按需使用的辅助工具</span>
        </div>
        <div className="home-secondary-links">
          {quickLinks.map(link => (
            <Link key={link.to} to={link.to} className="home-secondary-link">
              <strong>{link.title}</strong>
              <span>{link.desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
