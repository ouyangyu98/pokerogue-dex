// Coverage badges rendered as plain spans
import { typeNames } from '../typeMatchups'
import type { CoverageResult } from './types'

interface CoverageAnalysisProps {
  coverage: CoverageResult
}

export default function CoverageAnalysis({ coverage }: CoverageAnalysisProps) {
  const stabList = Array.from(coverage.stabTypes).map(t => typeNames[t as keyof typeof typeNames] || t)
  const moveTypeList = Array.from(coverage.moveTypes).map(t => typeNames[t as keyof typeof typeNames] || t)

  return (
    <div className="analysis-card">
      <h4>属性覆盖分析</h4>

      <div className="analysis-section">
        <div className="analysis-label">本系属性分布</div>
        <div className="analysis-badges">
          {stabList.length > 0
            ? stabList.map(name => <span key={name} className="coverage-badge stab">{name}</span>)
            : <span className="analysis-empty">—</span>
          }
        </div>
      </div>

      <div className="analysis-section">
        <div className="analysis-label">技能属性覆盖</div>
        <div className="analysis-badges">
          {moveTypeList.length > 0
            ? moveTypeList.map(name => <span key={name} className="coverage-badge">{name}</span>)
            : <span className="analysis-empty">—</span>
          }
        </div>
      </div>

      {coverage.uncoveredTypes.length > 0 && (
        <div className="analysis-section">
          <div className="analysis-label warning">未覆盖属性（盲区）</div>
          <div className="analysis-badges">
            {coverage.uncoveredTypes.map(name => (
              <span key={name} className="coverage-badge uncovered">{name}</span>
            ))}
          </div>
        </div>
      )}

      {Object.entries(coverage.typeCounts)
        .filter(([, count]) => count >= 2)
        .length > 0 && (
        <div className="analysis-section">
          <div className="analysis-label">本系重复（2只以上）</div>
          <div className="analysis-badges">
            {Object.entries(coverage.typeCounts)
              .filter(([, count]) => count >= 2)
              .map(([type, count]) => (
                <span key={type} className="coverage-badge repeated">
                  {typeNames[type as keyof typeof typeNames] || type} ×{count}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
