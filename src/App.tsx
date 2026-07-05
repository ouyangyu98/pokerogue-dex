import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import './index.css'

interface DataReportInfo {
  sourceVersion: string
  generationTime: string
}

const navItems = [
  { to: '/pokemon', label: '精灵图鉴' },
  { to: '/biomes', label: '地区查询' },
  { to: '/report', label: '数据报告' },
  { to: '/natures', label: '性格表' },
  { to: '/map', label: '地区导航' },
  { to: '/types', label: '属性克制' },
  { to: '/items', label: '道具清单' },
  { to: '/team', label: '配队分析' },
  { to: '/feedback', label: '反馈' },
]

export default function App() {
  const [dataVersion, setDataVersion] = useState('数据加载中...')

  useEffect(() => {
    fetch('/data/data-report.json')
      .then(r => r.json())
      .then((data: DataReportInfo) => {
        setDataVersion(`${data.sourceVersion} · ${data.generationTime}`)
      })
      .catch(() => setDataVersion('数据加载中...'))
  }, [])

  return (
    <div className="app">
      <header>
        <NavLink to="/" className="header-brand">
          <img src="/logo.svg" alt="PokeRogue 中文图鉴" className="header-logo" />
          <h1>PokeRogue 中文图鉴</h1>
        </NavLink>
        <div className="data-version">{dataVersion}</div>
        <nav>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }: { isActive: boolean }) => (isActive ? 'active' : '')}
              end={item.to === '/pokemon'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <NavLink to="/feedback" className="feedback-fab" title="反馈留言">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>反馈</span>
      </NavLink>
    </div>
  )
}
