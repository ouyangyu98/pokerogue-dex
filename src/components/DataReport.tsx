import { useState, useEffect } from 'react'

interface CoverageItem {
  total: number
  mapped: number
  coverage: number
}

interface ReportData {
  sourceVersion: string
  generationTime: string
  pokemonCount: number
  biomeCount: number
  encounterCount: number
  levelMoveCount: number
  eggMovePokemonCount: number
  eggMoveCount: number
  evolutionCount: number
  costCount: number
  passiveCount: number
  formCount: number
  itemCount?: number
  nameMapCoverage?: Record<string, CoverageItem>
}

const coverageLabels: Record<string, string> = {
  pokemon: '精灵',
  ability: '特性',
  move: '技能',
  biome: '生态区',
}

export default function DataReport() {
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/data/data-report.json')
      .then(r => r.json())
      .then((data: ReportData) => {
        setReport(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load report:', err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="loading">加载中...</div>
  if (!report) return <div className="error">无法加载数据报告</div>

  return (
    <div className="data-report">
      <h2>数据报告</h2>

      <div className="report-cards">
        <div className="report-card">
          <div className="card-icon">🐾</div>
          <div className="card-value">{report.pokemonCount}</div>
          <div className="card-label">精灵总数</div>
        </div>
        <div className="report-card">
          <div className="card-icon">🌍</div>
          <div className="card-value">{report.biomeCount}</div>
          <div className="card-label">生态区总数</div>
        </div>
        <div className="report-card">
          <div className="card-icon">⚔️</div>
          <div className="card-value">{report.encounterCount}</div>
          <div className="card-label">遭遇记录总数</div>
        </div>
        <div className="report-card">
          <div className="card-icon">📚</div>
          <div className="card-value">{report.levelMoveCount}</div>
          <div className="card-label">等级技能记录</div>
        </div>
        <div className="report-card">
          <div className="card-icon">🥚</div>
          <div className="card-value">{report.eggMoveCount}</div>
          <div className="card-label">蛋招记录</div>
        </div>
        <div className="report-card">
          <div className="card-icon">🔁</div>
          <div className="card-value">{report.evolutionCount}</div>
          <div className="card-label">进化记录</div>
        </div>
      </div>

      <div className="report-details">
        <h3>数据源信息</h3>
        <table>
          <tbody>
            <tr>
              <td>源码版本</td>
              <td>{report.sourceVersion}</td>
            </tr>
            <tr>
              <td>生成时间</td>
              <td>{new Date(report.generationTime).toLocaleString('zh-CN')}</td>
            </tr>
            <tr>
              <td>中文映射源</td>
              <td>pokerogue-locales/zh-Hans</td>
            </tr>
            <tr>
              <td>概率推导</td>
              <td>基于 arena.ts 中 generateNonBossBiomeTier / generateBossBiomeTier 逻辑</td>
            </tr>
            <tr>
              <td>有费用精灵</td>
              <td>{report.costCount}</td>
            </tr>
            <tr>
              <td>有被动精灵</td>
              <td>{report.passiveCount}</td>
            </tr>
            <tr>
              <td>有蛋招精灵</td>
              <td>{report.eggMovePokemonCount}</td>
            </tr>
            <tr>
              <td>商店道具条目</td>
              <td>{report.itemCount ?? '-'}</td>
            </tr>
            <tr>
              <td>形态总数</td>
              <td>{report.formCount}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {report.nameMapCoverage && (
        <div className="report-details">
          <h3>中文映射覆盖率</h3>
          <table>
            <tbody>
              {Object.entries(report.nameMapCoverage).map(([key, item]) => (
                <tr key={key}>
                  <td>{coverageLabels[key] || key}</td>
                  <td>{item.mapped} / {item.total}（{item.coverage}%）</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="report-note">
        <h3>说明</h3>
        <ul>
          <li>所有数据来源于 PokeRogue 官方源码，未经人工修改</li>
          <li>中文映射使用官方本地化仓库 pokerogue-locales 的 zh-Hans 目录</li>
          <li>生态区概率为推导值，基于源码中 tier 权重计算</li>
          <li>同一 tier 内所有精灵均分该 tier 的概率</li>
          <li>费用、被动、蛋招、进化、等级技能已并入精灵详情数据</li>
        </ul>
      </div>
    </div>
  )
}
