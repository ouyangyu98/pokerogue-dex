import natureZhMap from '../data/nature-zh.json'

interface NatureRow {
  id: string
  nameZh: string
  upStat: string | null
  downStat: string | null
}

const statLabelMap: Record<string, string> = {
  ATK: '攻击',
  DEF: '防御',
  SPATK: '特攻',
  SPDEF: '特防',
  SPD: '速度',
}

const natureRows: NatureRow[] = [
  { id: 'HARDY', nameZh: natureZhMap.hardy, upStat: null, downStat: null },
  { id: 'LONELY', nameZh: natureZhMap.lonely, upStat: 'ATK', downStat: 'DEF' },
  { id: 'BRAVE', nameZh: natureZhMap.brave, upStat: 'ATK', downStat: 'SPD' },
  { id: 'ADAMANT', nameZh: natureZhMap.adamant, upStat: 'ATK', downStat: 'SPATK' },
  { id: 'NAUGHTY', nameZh: natureZhMap.naughty, upStat: 'ATK', downStat: 'SPDEF' },
  { id: 'BOLD', nameZh: natureZhMap.bold, upStat: 'DEF', downStat: 'ATK' },
  { id: 'DOCILE', nameZh: natureZhMap.docile, upStat: null, downStat: null },
  { id: 'RELAXED', nameZh: natureZhMap.relaxed, upStat: 'DEF', downStat: 'SPD' },
  { id: 'IMPISH', nameZh: natureZhMap.impish, upStat: 'DEF', downStat: 'SPATK' },
  { id: 'LAX', nameZh: natureZhMap.lax, upStat: 'DEF', downStat: 'SPDEF' },
  { id: 'TIMID', nameZh: natureZhMap.timid, upStat: 'SPD', downStat: 'ATK' },
  { id: 'HASTY', nameZh: natureZhMap.hasty, upStat: 'SPD', downStat: 'DEF' },
  { id: 'SERIOUS', nameZh: natureZhMap.serious, upStat: null, downStat: null },
  { id: 'JOLLY', nameZh: natureZhMap.jolly, upStat: 'SPD', downStat: 'SPATK' },
  { id: 'NAIVE', nameZh: natureZhMap.naive, upStat: 'SPD', downStat: 'SPDEF' },
  { id: 'MODEST', nameZh: natureZhMap.modest, upStat: 'SPATK', downStat: 'ATK' },
  { id: 'MILD', nameZh: natureZhMap.mild, upStat: 'SPATK', downStat: 'DEF' },
  { id: 'QUIET', nameZh: natureZhMap.quiet, upStat: 'SPATK', downStat: 'SPD' },
  { id: 'BASHFUL', nameZh: natureZhMap.bashful, upStat: null, downStat: null },
  { id: 'RASH', nameZh: natureZhMap.rash, upStat: 'SPATK', downStat: 'SPDEF' },
  { id: 'CALM', nameZh: natureZhMap.calm, upStat: 'SPDEF', downStat: 'ATK' },
  { id: 'GENTLE', nameZh: natureZhMap.gentle, upStat: 'SPDEF', downStat: 'DEF' },
  { id: 'SASSY', nameZh: natureZhMap.sassy, upStat: 'SPDEF', downStat: 'SPD' },
  { id: 'CAREFUL', nameZh: natureZhMap.careful, upStat: 'SPDEF', downStat: 'SPATK' },
  { id: 'QUIRKY', nameZh: natureZhMap.quirky, upStat: null, downStat: null },
]

function formatStat(stat: string | null) {
  if (!stat) return '无'
  return statLabelMap[stat] || stat
}

export default function NatureTable() {
  return (
    <div className="nature-page">
      <div className="nature-page-header">
        <h2>性格表</h2>
        <p>基于官方源码规则展示全部 25 种性格的加成与减益方向。</p>
      </div>

      <div className="nature-summary-card">
        <div className="nature-summary-item">
          <span className="nature-summary-label">中性性格</span>
          <span className="nature-summary-value">勤奋 / 坦率 / 认真 / 害羞 / 浮躁</span>
        </div>
        <div className="nature-summary-item">
          <span className="nature-summary-label">判定规则</span>
          <span className="nature-summary-value">提升 1 项能力 ×1.1，降低 1 项能力 ×0.9</span>
        </div>
      </div>

      <div className="table-container nature-table-container">
        <table className="nature-table">
          <thead>
            <tr>
              <th>中文名</th>
              <th>内部 ID</th>
              <th>提升属性</th>
              <th>降低属性</th>
              <th>效果说明</th>
            </tr>
          </thead>
          <tbody>
            {natureRows.map(row => (
              <tr key={row.id}>
                <td className="name-zh">{row.nameZh}</td>
                <td className="name-en">{row.id}</td>
                <td>
                  {row.upStat ? <span className="nature-stat nature-stat-up">↑ {formatStat(row.upStat)}</span> : <span className="nature-stat nature-stat-neutral">-</span>}
                </td>
                <td>
                  {row.downStat ? <span className="nature-stat nature-stat-down">↓ {formatStat(row.downStat)}</span> : <span className="nature-stat nature-stat-neutral">-</span>}
                </td>
                <td>
                  {row.upStat && row.downStat
                    ? `${formatStat(row.upStat)}提升，${formatStat(row.downStat)}下降`
                    : '中性性格，无能力修正'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
