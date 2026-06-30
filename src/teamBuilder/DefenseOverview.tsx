import { typeNames } from '../typeMatchups'
import type { DefenseResult } from './types'

interface DefenseOverviewProps {
  defense: DefenseResult
}

export default function DefenseOverview({ defense }: DefenseOverviewProps) {
  return (
    <div className="analysis-card">
      <h4>抗性总览</h4>

      {defense.dangerousTypes.length > 0 && (
        <div className="analysis-section danger">
          <div className="analysis-label warning">危险属性（≥3只弱点）</div>
          <div className="analysis-badges">
            {defense.dangerousTypes.map(s => (
              <span key={s.type} className="defense-badge danger">
                {s.nameZh} 弱{s.weakCount}只
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="defense-table-wrapper">
        <table className="defense-table">
          <thead>
            <tr>
              <th>攻击属性</th>
              <th>弱点</th>
              <th>抗性</th>
              <th>免疫</th>
              <th>无修正</th>
            </tr>
          </thead>
          <tbody>
            {defense.stats.map(s => (
              <tr key={s.type} className={s.weakCount >= 3 ? 'danger-row' : ''}>
                <td>
                  <span
                    className="type-badge-mini"
                    style={{ backgroundColor: (typeNames as any)[s.type] ? '#888' : '#888' }}
                  >
                    {s.nameZh}
                  </span>
                </td>
                <td className={s.weakCount > 0 ? 'weak' : ''}>{s.weakCount || '—'}</td>
                <td className={s.resistCount > 0 ? 'resist' : ''}>{s.resistCount || '—'}</td>
                <td className={s.immuneCount > 0 ? 'immune' : ''}>{s.immuneCount || '—'}</td>
                <td>{s.neutralCount || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
