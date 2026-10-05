import { useMemo, useState } from 'react'
import {
  buildSingleTypeMatchupRows,
  getCombinedDefenseBuckets,
  getSingleTypeMultiplier,
  MATCHUP_TYPE_ORDER,
  type CombinedDefenseBuckets,
  type MatchupTypeKey,
  typeColors,
  typeNames,
} from '../typeMatchups'

type Perspective = 'attack' | 'defense'
type HighlightVariant = 'focus' | 'dim'

const COMMON_TYPE_COMBOS: Array<{
  label: string
  type1: MatchupTypeKey
  type2: MatchupTypeKey
  note: string
}> = [
  { label: '水+地', type1: 'WATER', type2: 'GROUND', note: '常见抗电联防组合' },
  { label: '钢+妖精', type1: 'STEEL', type2: 'FAIRY', note: '高抗性核心组合' },
  { label: '火+钢', type1: 'FIRE', type2: 'STEEL', note: '耐性丰富但怕地面' },
  { label: '恶+飞行', type1: 'DARK', type2: 'FLYING', note: '常见进攻联防思路' },
  { label: '龙+地', type1: 'DRAGON', type2: 'GROUND', note: '高压制输出组合' },
  { label: '水+妖精', type1: 'WATER', type2: 'FAIRY', note: '攻守均衡的泛用组合' },
]

function isSameCombo(
  comboType1: MatchupTypeKey,
  comboType2: MatchupTypeKey,
  targetType1: MatchupTypeKey,
  targetType2: MatchupTypeKey,
) {
  return (
    (comboType1 === targetType1 && comboType2 === targetType2)
    || (comboType1 === targetType2 && comboType2 === targetType1)
  )
}

function renderTypeBadge(type: MatchupTypeKey, active = false) {
  return (
    <span
      className={`type-badge type-overview-badge ${active ? 'type-overview-badge-active' : ''}`}
      style={{ backgroundColor: typeColors[type] || '#888' }}
    >
      {typeNames[type] || type}
    </span>
  )
}

function renderBadgeGroup(
  types: MatchupTypeKey[],
  selectedType: MatchupTypeKey | null,
  onTypeSelect: (type: MatchupTypeKey) => void,
  variant: HighlightVariant,
) {
  if (types.length === 0) {
    return <span className="type-matchup-empty">—</span>
  }

  return (
    <div className="type-matchup-badge-group">
      {types.map(type => {
        const isActive = selectedType === type
        const shouldDim = Boolean(selectedType) && !isActive && variant === 'dim'
        return (
          <button
            key={type}
            type="button"
            className={`type-overview-badge-btn ${isActive ? 'is-active' : ''} ${shouldDim ? 'is-dim' : ''}`}
            onClick={() => onTypeSelect(type)}
            title={`聚焦 ${typeNames[type]}`}
          >
            {renderTypeBadge(type, isActive)}
          </button>
        )
      })}
    </div>
  )
}

function renderBucketGroup(
  title: string,
  items: CombinedDefenseBuckets[keyof CombinedDefenseBuckets],
  selectedType: MatchupTypeKey | null,
  onTypeSelect: (type: MatchupTypeKey) => void,
) {
  return (
    <div className="type-combo-bucket-card">
      <div className="type-combo-bucket-title">{title}</div>
      {items.length > 0 ? (
        <div className="type-matchup-badge-group">
          {items.map(item => {
            const isActive = selectedType === item.type
            return (
              <button
                key={`${title}-${item.type}`}
                type="button"
                className={`type-overview-badge-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => onTypeSelect(item.type)}
                title={`聚焦 ${typeNames[item.type]}`}
              >
                {renderTypeBadge(item.type, isActive)}
                <span className="type-combo-multiplier">{item.multiplier === 0 ? '0倍' : `${item.multiplier}倍`}</span>
              </button>
            )}
          )}
        </div>
      ) : (
        <span className="type-matchup-empty">—</span>
      )}
    </div>
  )
}

export default function TypeMatchupPage() {
  const [perspective, setPerspective] = useState<Perspective>('attack')
  const [selectedType, setSelectedType] = useState<MatchupTypeKey | null>(null)
  const [pokemonType1, setPokemonType1] = useState<MatchupTypeKey>('WATER')
  const [pokemonType2, setPokemonType2] = useState<MatchupTypeKey | null>('GROUND')
  const [coverageTypes, setCoverageTypes] = useState<MatchupTypeKey[]>(['FIRE', 'WATER', 'GRASS'])
  const rows = useMemo(() => buildSingleTypeMatchupRows(), [])

  const selectedRow = useMemo(
    () => rows.find(row => row.type === selectedType) || null,
    [rows, selectedType],
  )

  const combinedBuckets = useMemo(
    () => getCombinedDefenseBuckets(pokemonType1, pokemonType2),
    [pokemonType1, pokemonType2],
  )

  const activePreset = useMemo(
    () => pokemonType2
      ? COMMON_TYPE_COMBOS.find(combo => isSameCombo(pokemonType1, pokemonType2, combo.type1, combo.type2)) || null
      : null,
    [pokemonType1, pokemonType2],
  )

  const coverageResults = useMemo(
    () => MATCHUP_TYPE_ORDER.map(type => ({
      type,
      effectiveAttackers: coverageTypes.filter(attackType => getSingleTypeMultiplier(attackType, type) > 1),
    })),
    [coverageTypes],
  )

  const coveredTypes = coverageResults.filter(item => item.effectiveAttackers.length > 0)
  const uncoveredTypes = coverageResults.filter(item => item.effectiveAttackers.length === 0)

  const handleTypeSelect = (type: MatchupTypeKey) => {
    setSelectedType(current => (current === type ? null : type))
  }

  const toggleCoverageType = (type: MatchupTypeKey) => {
    if (!coverageTypes.includes(type) && coverageTypes.length >= 4) return
    setCoverageTypes(current => (
      current.includes(type)
        ? current.filter(currentType => currentType !== type)
        : [...current, type]
    ))
  }

  const handlePresetSelect = (type1: MatchupTypeKey, type2: MatchupTypeKey) => {
    setPokemonType1(type1)
    setPokemonType2(type2)
  }

  return (
    <div className="type-overview-page">
      <div className="type-overview-header">
        <h2>属性克制关系</h2>
        <p>模拟精灵属性与配招属性的组合效果，并查看 18 种属性的攻击 / 防御关系总览。</p>
      </div>

      <div className="type-overview-summary">
        <div className="type-overview-summary-item">
          <span className="type-overview-summary-label">数据来源</span>
          <span className="type-overview-summary-value">官方本地源码属性克制表 + 官方中文本地化</span>
        </div>
        <div className="type-overview-summary-item">
          <span className="type-overview-summary-label">当前范围</span>
          <span className="type-overview-summary-value">精灵单 / 双属性 + 最多 4 种招式属性覆盖分析</span>
        </div>
      </div>

      <section className="type-analysis-section" aria-labelledby="type-analysis-heading">
        <div className="type-analysis-header">
          <div>
            <span className="type-overview-summary-label">属性配置与配招分析</span>
            <h3 id="type-analysis-heading">
              {typeNames[pokemonType1]}{pokemonType2 ? ` + ${typeNames[pokemonType2]}` : ''} 的攻守覆盖
            </h3>
          </div>
          <p>左侧配置精灵属性与招式属性，下面同步查看防守弱点和进攻打击面。</p>
        </div>

        <div className="type-analysis-config">
          <div className="type-analysis-config-block">
            <div className="type-analysis-block-heading">
              <div>
                <h4>精灵属性</h4>
                <p>用于计算这只精灵的防守端倍率</p>
              </div>
              <span className="type-analysis-slot-count">{pokemonType2 ? '双属性' : '单属性'}</span>
            </div>
            <div className="type-analysis-selects">
              <label className="type-combo-select-group">
                <span>属性 1</span>
                <select value={pokemonType1} onChange={e => {
                  const nextType = e.target.value as MatchupTypeKey
                  setPokemonType1(nextType)
                  if (pokemonType2 === nextType) setPokemonType2(null)
                }}>
                  {rows.map(row => (
                    <option key={`pokemon-type1-${row.type}`} value={row.type}>{row.nameZh}</option>
                  ))}
                </select>
              </label>
              <span className="type-analysis-plus">+</span>
              <label className="type-combo-select-group">
                <span>属性 2（可选）</span>
                <select value={pokemonType2 || ''} onChange={e => setPokemonType2((e.target.value || null) as MatchupTypeKey | null)}>
                  <option value="">不选择</option>
                  {rows.map(row => (
                    <option key={`pokemon-type2-${row.type}`} value={row.type} disabled={row.type === pokemonType1}>
                      {row.nameZh}{row.type === pokemonType1 ? '（与属性 1 相同）' : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="type-analysis-config-block type-analysis-moves-block">
            <div className="type-analysis-block-heading">
              <div>
                <h4>招式属性</h4>
                <p>最多选择 4 种不同属性，支持只配置一部分</p>
              </div>
              <span className="type-analysis-slot-count">{coverageTypes.length} / 4</span>
            </div>
            <div className="type-analysis-move-list">
              {MATCHUP_TYPE_ORDER.map(type => {
                const isSelected = coverageTypes.includes(type)
                const isDisabled = !isSelected && coverageTypes.length >= 4
                return (
                  <button
                    key={type}
                    type="button"
                    className={`type-analysis-move-button ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => toggleCoverageType(type)}
                    aria-pressed={isSelected}
                    disabled={isDisabled}
                    title={`${isSelected ? '移除' : '加入'}${typeNames[type]}招式属性`}
                  >
                    {renderTypeBadge(type, isSelected)}
                  </button>
                )
              })}
            </div>
            <div className="type-analysis-move-footer">
              <span>{coverageTypes.length > 0 ? `已配置 ${coverageTypes.length} 种招式属性` : '尚未配置招式属性'}</span>
              <button
                type="button"
                className="type-coverage-clear-btn"
                onClick={() => setCoverageTypes([])}
                disabled={coverageTypes.length === 0}
              >
                清空招式
              </button>
            </div>
          </div>
        </div>

        <div className="type-analysis-presets">
          <div className="type-analysis-presets-heading">
            <span className="type-overview-summary-label">常用精灵属性组合</span>
            <span>一键填充防守端属性</span>
          </div>
          <div className="type-analysis-preset-list">
            {COMMON_TYPE_COMBOS.map(combo => {
              const isActive = pokemonType2
                ? isSameCombo(pokemonType1, pokemonType2, combo.type1, combo.type2)
                : false
              return (
                <button
                  key={combo.label}
                  type="button"
                  className={`type-combo-preset-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => handlePresetSelect(combo.type1, combo.type2)}
                  title={combo.note}
                >
                  <span className="type-combo-preset-label">{combo.label}</span>
                  <span className="type-combo-preset-note">{combo.note}</span>
                </button>
              )
            })}
          </div>
          {activePreset && (
            <div className="type-combo-active-note">
              当前快捷组合：<strong>{activePreset.label}</strong> · {activePreset.note}
            </div>
          )}
        </div>

        <div className="type-analysis-results">
          <div className="type-analysis-defense">
            <div className="type-analysis-result-header">
              <div>
                <span className="type-overview-summary-label">防守端</span>
                <h4>{typeNames[pokemonType1]}{pokemonType2 ? ` + ${typeNames[pokemonType2]}` : ''} 的属性弱点与抗性</h4>
              </div>
              <span className="type-analysis-result-note">按防守倍率计算</span>
            </div>
            <div className="type-analysis-defense-grid">
              {renderBucketGroup('4倍弱点', combinedBuckets.quadWeak, selectedType, handleTypeSelect)}
              {renderBucketGroup('2倍弱点', combinedBuckets.weak, selectedType, handleTypeSelect)}
              {renderBucketGroup('1/2抗性', combinedBuckets.resist, selectedType, handleTypeSelect)}
              {renderBucketGroup('1/4抗性', combinedBuckets.doubleResist, selectedType, handleTypeSelect)}
              {renderBucketGroup('免疫', combinedBuckets.immune, selectedType, handleTypeSelect)}
            </div>
          </div>

          <div className="type-analysis-offense">
            <div className="type-analysis-result-header">
              <div>
                <span className="type-overview-summary-label">进攻端</span>
                <h4>招式打击面</h4>
              </div>
              <div className="type-coverage-count" aria-label={`当前覆盖 ${coveredTypes.length} 种属性`}>
                <strong>{coveredTypes.length}</strong>
                <span>/ {MATCHUP_TYPE_ORDER.length} 种已覆盖</span>
              </div>
            </div>
            {coverageTypes.length > 0 ? (
              <>
                <div className="type-coverage-result-group">
                  <div className="type-coverage-result-title">
                    <h4>可克制</h4>
                    <span>{coveredTypes.length} 种</span>
                  </div>
                  <div className="type-coverage-result-list">
                    {coveredTypes.map(item => (
                      <div key={item.type} className="type-coverage-result-row">
                        {renderTypeBadge(item.type)}
                        <span>由 {item.effectiveAttackers.map(type => typeNames[type]).join('、')} 招式克制</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="type-coverage-result-group type-coverage-uncovered-group">
                  <div className="type-coverage-result-title">
                    <h4>尚未覆盖</h4>
                    <span>{uncoveredTypes.length} 种</span>
                  </div>
                  <div className="type-coverage-uncovered-list">
                    {uncoveredTypes.map(item => renderTypeBadge(item.type))}
                  </div>
                </div>
              </>
            ) : (
              <div className="type-coverage-empty">
                还没有配置招式属性；可从上方选择 1 至 4 种招式属性。
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="type-overview-toolbar">
        <div className="type-overview-switcher" role="tablist" aria-label="属性克制视角切换">
          <button
            type="button"
            className={perspective === 'attack' ? 'active' : ''}
            onClick={() => setPerspective('attack')}
          >
            攻击视角
          </button>
          <button
            type="button"
            className={perspective === 'defense' ? 'active' : ''}
            onClick={() => setPerspective('defense')}
          >
            防御视角
          </button>
        </div>

        <div className="type-overview-selection-panel">
          <span className="type-overview-selection-label">当前聚焦</span>
          {selectedRow ? (
            <div className="type-overview-selection-main">
              {renderTypeBadge(selectedRow.type, true)}
              <button type="button" className="type-overview-clear-btn" onClick={() => setSelectedType(null)}>
                清除聚焦
              </button>
            </div>
          ) : (
            <span className="type-overview-selection-placeholder">点击任意属性 badge 可聚焦查看</span>
          )}
        </div>
      </div>

      <div className="type-overview-table-wrap table-container">
        <table className="type-overview-table">
          <thead>
            <tr>
              <th>属性</th>
              {perspective === 'attack' ? (
                <>
                  <th>克制（2倍）</th>
                  <th>被抵抗（1/2）</th>
                  <th>无效（0倍）</th>
                </>
              ) : (
                <>
                  <th>弱点（2倍）</th>
                  <th>抗性（1/2）</th>
                  <th>免疫（0倍）</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const isSelectedRow = row.type === selectedType
              const shouldDimRow = Boolean(selectedType) && !isSelectedRow
              return (
                <tr key={row.type} className={`${isSelectedRow ? 'type-overview-row-active' : ''} ${shouldDimRow ? 'type-overview-row-dim' : ''}`}>
                  <td className="type-overview-type-cell type-overview-type-cell-sticky">
                    <button type="button" className="type-overview-row-type-btn" onClick={() => handleTypeSelect(row.type)}>
                      <div className="type-overview-type-main">{renderTypeBadge(row.type, isSelectedRow)}</div>
                      <div className="name-en">{row.type}</div>
                    </button>
                  </td>
                  {perspective === 'attack' ? (
                    <>
                      <td>{renderBadgeGroup(row.attack.strongAgainst, selectedType, handleTypeSelect, 'dim')}</td>
                      <td>{renderBadgeGroup(row.attack.resistedBy, selectedType, handleTypeSelect, 'dim')}</td>
                      <td>{renderBadgeGroup(row.attack.noEffectAgainst, selectedType, handleTypeSelect, 'dim')}</td>
                    </>
                  ) : (
                    <>
                      <td>{renderBadgeGroup(row.defense.weakTo, selectedType, handleTypeSelect, 'dim')}</td>
                      <td>{renderBadgeGroup(row.defense.resistantTo, selectedType, handleTypeSelect, 'dim')}</td>
                      <td>{renderBadgeGroup(row.defense.immuneTo, selectedType, handleTypeSelect, 'dim')}</td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedRow && (
        <div className="type-overview-focus-card">
          <div className="type-overview-focus-header">
            <div>
              <span className="type-overview-summary-label">聚焦详情</span>
              <h3>{typeNames[selectedRow.type]} · {perspective === 'attack' ? '攻击视角' : '防御视角'}</h3>
            </div>
            {renderTypeBadge(selectedRow.type, true)}
          </div>
          <div className="type-overview-focus-grid">
            {perspective === 'attack' ? (
              <>
                <div className="type-overview-focus-item">
                  <span className="type-overview-focus-label">克制（2倍）</span>
                  {renderBadgeGroup(selectedRow.attack.strongAgainst, selectedType, handleTypeSelect, 'focus')}
                </div>
                <div className="type-overview-focus-item">
                  <span className="type-overview-focus-label">被抵抗（1/2）</span>
                  {renderBadgeGroup(selectedRow.attack.resistedBy, selectedType, handleTypeSelect, 'focus')}
                </div>
                <div className="type-overview-focus-item">
                  <span className="type-overview-focus-label">无效（0倍）</span>
                  {renderBadgeGroup(selectedRow.attack.noEffectAgainst, selectedType, handleTypeSelect, 'focus')}
                </div>
              </>
            ) : (
              <>
                <div className="type-overview-focus-item">
                  <span className="type-overview-focus-label">弱点（2倍）</span>
                  {renderBadgeGroup(selectedRow.defense.weakTo, selectedType, handleTypeSelect, 'focus')}
                </div>
                <div className="type-overview-focus-item">
                  <span className="type-overview-focus-label">抗性（1/2）</span>
                  {renderBadgeGroup(selectedRow.defense.resistantTo, selectedType, handleTypeSelect, 'focus')}
                </div>
                <div className="type-overview-focus-item">
                  <span className="type-overview-focus-label">免疫（0倍）</span>
                  {renderBadgeGroup(selectedRow.defense.immuneTo, selectedType, handleTypeSelect, 'focus')}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="type-overview-notes">
        <div className="type-overview-note-card">
          <h3>倍率说明</h3>
          <ul>
            <li><strong>2倍：</strong> 克制 / 弱点</li>
            <li><strong>1/2：</strong> 被抵抗 / 抗性</li>
            <li><strong>0倍：</strong> 无效 / 免疫</li>
          </ul>
        </div>
        <div className="type-overview-note-card">
          <h3>说明</h3>
          <ul>
            <li>该页面用于全属性总览，不替代精灵详情页中的个体克制摘要。</li>
            <li>属性配置分析支持单属性、双属性和最多 4 种招式属性；相同属性不会重复计算。</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
