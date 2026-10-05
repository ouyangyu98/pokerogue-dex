interface GapSuggestionsProps {
  gaps: string[]
}

export default function GapSuggestions({ gaps }: GapSuggestionsProps) {
  if (gaps.length === 0) {
    return (
      <div className="analysis-card gap-card">
        <div className="analysis-card-heading">
          <div>
            <span className="analysis-eyebrow">下一步</span>
            <h4>缺口建议</h4>
          </div>
        </div>
        <div className="gap-ok">当前队伍配置较为均衡，未发现明显缺口。</div>
      </div>
    )
  }

  return (
    <div className="analysis-card gap-card">
      <div className="analysis-card-heading">
        <div>
          <span className="analysis-eyebrow">下一步</span>
          <h4>缺口建议</h4>
        </div>
      </div>
      <ul className="gap-list">
        {gaps.map((gap, i) => (
          <li key={i} className={gap.startsWith('危险') ? 'gap-danger' : 'gap-normal'}>
            {gap}
          </li>
        ))}
      </ul>
    </div>
  )
}
