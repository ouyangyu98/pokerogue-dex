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
    </div>
  )
}
