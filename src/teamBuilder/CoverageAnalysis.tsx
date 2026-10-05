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
      <div className="analysis-card-heading">
        <div>
          <span className="analysis-eyebrow">进攻端</span>
          <h4>可学招式池打击面</h4>
        </div>
        <span className="analysis-metric">{coverage.coveredTypes.length} / 18</span>
      </div>
      <p className="analysis-caption">根据队伍成员的等级招式与蛋招汇总，不等同于当前已配置的四个招式。</p>

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
        <div className="analysis-label">可学招式属性</div>
        <div className="analysis-badges">
          {moveTypeList.length > 0
            ? moveTypeList.map(name => <span key={name} className="coverage-badge">{name}</span>)
            : <span className="analysis-empty">—</span>
          }
        </div>
      </div>

      {coverage.uncoveredTypes.length > 0 && (
        <div className="analysis-section">
          <div className="analysis-label warning">无法克制的属性</div>
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
