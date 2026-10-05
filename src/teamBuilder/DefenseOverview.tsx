import { useState } from 'react'
import { typeColors, typeNames } from '../typeMatchups'
import type {
  DefenseResult,
  DefenseStat,
  PokemonDefenseProfile,
  TeamPokemonDetail,
} from './types'
import { getPokemonDetailPath } from '../utils/pokemonRoutes'
import { Link } from 'react-router-dom'

interface DefenseOverviewProps {
  defense: DefenseResult
  details: TeamPokemonDetail[]
  profiles: PokemonDefenseProfile[]
}

function typeName(type: string) {
  return typeNames[type as keyof typeof typeNames] || type
}

function TypePill({ type }: { type: string }) {
  return (
    <span
      className="team-defense-type-pill"
      style={{ backgroundColor: typeColors[type as keyof typeof typeColors] || '#888' }}
    >
      {typeName(type)}
    </span>
  )
}

function TypeList({ types, empty = '无' }: { types: string[], empty?: string }) {
  if (types.length === 0) {
    return <span className="team-defense-empty">{empty}</span>
  }

  return (
    <div className="team-defense-type-list">
      {types.map(type => <TypePill key={type} type={type} />)}
    </div>
  )
}

function RiskTypeButton({
  stat,
  selected,
  onToggle,
}: {
  stat: DefenseStat
  selected: boolean
  onToggle: (type: string) => void
}) {
  return (
    <button
      type="button"
      className={`team-defense-risk-type${selected ? ' is-selected' : ''}`}
      onClick={() => onToggle(stat.type)}
      aria-pressed={selected}
    >
      <TypePill type={stat.type} />
      <span>弱 {stat.weakCount}</span>
      <span>抗 {stat.resistCount}</span>
      <span>免 {stat.immuneCount}</span>
    </button>
  )
}

export default function DefenseOverview({
  defense,
  details,
  profiles,
}: DefenseOverviewProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const noSafeSwitch = defense.stats.filter(
    stat => stat.weakCount > 0 && stat.resistCount + stat.immuneCount === 0,
  )
  const sharedWeaknesses = defense.dangerousTypes.filter(
    stat => !noSafeSwitch.some(danger => danger.type === stat.type),
  )
  const reliableAnswers = defense.stats.filter(
    stat => stat.weakCount === 0 && stat.resistCount + stat.immuneCount > 0,
  )
  const selectedName = selectedType ? typeName(selectedType) : null
  const toggleType = (type: string) => {
    setSelectedType(current => current === type ? null : type)
  }

  return (
    <section className="team-defense-board" aria-label="防守风险看板">
      <div className="team-defense-heading">
        <div>
          <span className="analysis-eyebrow">防守端</span>
          <h4>防守风险看板</h4>
          <p>点击属性可查看队内谁会受压、谁能安全承接。</p>
        </div>
        <span className="team-defense-threshold">共同弱点 ≥ {defense.dangerThreshold} 名</span>
      </div>

      {selectedName && (
        <div className="team-defense-selection" role="status">
          当前查看：<strong>{selectedName}属性攻击</strong>
          <button type="button" onClick={() => setSelectedType(null)}>清除</button>
        </div>
      )}

      <div className="team-defense-summary-grid">
        <section className="team-defense-summary danger">
          <div className="team-defense-summary-heading">
            <span>高风险</span>
            <h5>无安全换入</h5>
          </div>
          {noSafeSwitch.length > 0 ? (
            <div className="team-defense-risk-list">
              {noSafeSwitch.map(stat => (
                <div key={stat.type} className="team-defense-risk-row">
                  <RiskTypeButton stat={stat} selected={selectedType === stat.type} onToggle={toggleType} />
                  <p>{stat.nameZh}属性攻击会压制 {stat.weakCount} 名成员，队内没有抗性或免疫成员。</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="team-defense-summary-empty">当前没有属性能让全队都无法安全承接。</p>
          )}
        </section>

        <section className="team-defense-summary warning">
          <div className="team-defense-summary-heading">
            <span>需留意</span>
            <h5>共同弱点</h5>
          </div>
          {sharedWeaknesses.length > 0 ? (
            <div className="team-defense-risk-list">
              {sharedWeaknesses.map(stat => (
                <div key={stat.type} className="team-defense-risk-row">
                  <RiskTypeButton stat={stat} selected={selectedType === stat.type} onToggle={toggleType} />
                  <p>{stat.weakCount} 名成员弱点，仍有 {stat.resistCount + stat.immuneCount} 名成员可以承接。</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="team-defense-summary-empty">没有达到共同弱点阈值的属性。</p>
          )}
        </section>

        <section className="team-defense-summary safe">
          <div className="team-defense-summary-heading">
            <span>有余地</span>
            <h5>可靠应对</h5>
          </div>
          {reliableAnswers.length > 0 ? (
            <div className="team-defense-risk-list">
              {reliableAnswers.map(stat => (
                <div key={stat.type} className="team-defense-risk-row">
                  <RiskTypeButton stat={stat} selected={selectedType === stat.type} onToggle={toggleType} />
                  <p>没有成员弱 {stat.nameZh}属性，{stat.resistCount + stat.immuneCount} 名成员具备抗性或免疫。</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="team-defense-summary-empty">暂无所有成员都不弱且可承接的属性。</p>
          )}
        </section>
      </div>

      <section className="team-defense-members">
        <div className="team-defense-members-heading">
          <div>
            <span className="analysis-eyebrow">成员层</span>
            <h5>谁会被克制，谁能上场</h5>
          </div>
          <span>4倍弱点优先标红</span>
        </div>
        <div className="team-defense-member-grid">
          {details.map(detail => {
            const profile = profiles.find(item => item.slotIndex === detail.slotIndex)
            if (!profile) return null
            const multiplier = selectedType ? profile.multipliers[selectedType] : undefined
            const state = multiplier === undefined
              ? ''
              : multiplier > 1 ? ' is-weak'
                : multiplier < 1 ? ' is-safe'
                  : ''
            const formName = detail.form.formIndex > 0
              && detail.form.formNameZh
              && detail.form.formNameZh !== detail.pokemon.nameZh
              ? detail.form.formNameZh
              : null

            return (
              <article key={detail.slotIndex} className={`team-defense-member${state}`}>
                <div className="team-defense-member-header">
                  <Link
                    to={getPokemonDetailPath(detail.pokemon, detail.form)}
                    className="team-defense-member-name team-defense-member-link"
                    aria-label={`查看${detail.pokemon.nameZh}详情`}
                  >
                    <strong>{detail.pokemon.nameZh}</strong>
                    {formName && <small>{formName}</small>}
                  </Link>
                  <span className="team-defense-member-types">
                    <TypePill type={detail.form.type1 || detail.pokemon.type1 || 'UNKNOWN'} />
                    {detail.form.type2 && <TypePill type={detail.form.type2} />}
                  </span>
                  {selectedType && (
                    <span className="team-defense-member-state">
                      {multiplier === 0 ? '免疫' : multiplier && multiplier < 1 ? '可承接' : multiplier && multiplier > 1 ? `${multiplier}倍弱点` : '无修正'}
                    </span>
                  )}
                </div>
                <div className="team-defense-member-summary">
                  <div className="team-defense-profile-line critical">
                    <span>4倍弱点</span>
                    <TypeList types={profile.quadWeak} />
                  </div>
                  <div className="team-defense-profile-line weak">
                    <span>2倍弱点</span>
                    <TypeList types={profile.weak} />
                  </div>
                  <div className="team-defense-profile-line immune">
                    <span>免疫</span>
                    <TypeList types={profile.immune} />
                  </div>
                </div>
                <details className="team-defense-member-detail">
                  <summary>查看抗性细节</summary>
                  <div className="team-defense-member-detail-content">
                    <div className="team-defense-profile-line">
                      <span>1/2抗性</span>
                      <TypeList types={profile.resist} />
                    </div>
                    <div className="team-defense-profile-line">
                      <span>1/4抗性</span>
                      <TypeList types={profile.doubleResist} />
                    </div>
                  </div>
                </details>
              </article>
            )
          })}
        </div>
      </section>

      <details className="team-defense-matrix">
        <summary>查看全部 18 种攻击属性</summary>
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
              {defense.stats.map(stat => (
                <tr key={stat.type} className={stat.weakCount >= defense.dangerThreshold ? 'danger-row' : ''}>
                  <td><TypePill type={stat.type} /></td>
                  <td className={stat.weakCount > 0 ? 'weak' : ''}>{stat.weakCount || '—'}</td>
                  <td className={stat.resistCount > 0 ? 'resist' : ''}>{stat.resistCount || '—'}</td>
                  <td className={stat.immuneCount > 0 ? 'immune' : ''}>{stat.immuneCount || '—'}</td>
                  <td>{stat.neutralCount || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <p className="team-defense-note">按当前形态的基础属性关系计算，不含特性、道具、太晶化、天气或场地。</p>
    </section>
  )
}
