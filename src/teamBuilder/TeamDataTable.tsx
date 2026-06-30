import type { TeamPokemonDetail } from './types'
import { ROLE_LABELS } from './types'
import { getPokemonRoles } from './teamUtils'
import { renderTypeBadge } from '../utils/render'

interface TeamDataTableProps {
  details: TeamPokemonDetail[]
}

export default function TeamDataTable({ details }: TeamDataTableProps) {
  return (
    <div className="analysis-card">
      <h4>队伍数据</h4>
      <div className="team-table-wrapper">
        <table className="team-data-table">
          <thead>
            <tr>
              <th>精灵</th>
              <th>属性</th>
              <th>HP</th>
              <th>攻击</th>
              <th>防御</th>
              <th>特攻</th>
              <th>特防</th>
              <th>速度</th>
              <th>职能</th>
            </tr>
          </thead>
          <tbody>
            {details.map(({ pokemon, form, slotIndex }) => {
              const roles = getPokemonRoles(pokemon, form)
              return (
                <tr key={slotIndex}>
                  <td className="team-table-name">
                    <div>{pokemon.nameZh}</div>
                    {form.formNameZh && form.formNameZh !== pokemon.nameZh && (
                      <div className="team-table-form">{form.formNameZh}</div>
                    )}
                  </td>
                  <td>
                    {renderTypeBadge(form.type1)}
                    {renderTypeBadge(form.type2)}
                  </td>
                  <td>{form.baseHp}</td>
                  <td>{form.baseAtk}</td>
                  <td>{form.baseDef}</td>
                  <td>{form.baseSpatk}</td>
                  <td>{form.baseSpdef}</td>
                  <td>{form.baseSpd}</td>
                  <td>
                    <div className="team-table-roles">
                      {roles.map(r => (
                        <span key={r} className="role-tag">
                          {ROLE_LABELS[r]}
                        </span>
                      ))}
                      {roles.length === 0 && <span className="analysis-empty">—</span>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
