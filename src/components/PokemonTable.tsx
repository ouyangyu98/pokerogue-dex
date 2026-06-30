import { renderTypeBadge } from '../utils/render'
import {
  getPokemonIconFrame,
  getAtlasSpriteStyle,
  DEFAULT_ICON_SOURCE_SIZE,
  type TextureAtlas,
} from '../utils/atlas'
import type { Pokemon } from '../types'

export interface PokemonTableProps {
  pokemons: Pokemon[]
  iconAtlases: Record<string, TextureAtlas>
  fallbackIconAtlases?: Record<string, TextureAtlas>
  sortBy: string
  sortDesc: boolean
  onSort: (field: string) => void
  onRowClick: (pokemon: Pokemon) => void
  registerLazyImage?: (el: HTMLElement | null, id: string) => void
}

export default function PokemonTable({
  pokemons,
  iconAtlases,
  fallbackIconAtlases,
  sortBy,
  sortDesc,
  onSort,
  onRowClick,
  registerLazyImage,
}: PokemonTableProps) {
  const sortIcon = (field: string) =>
    sortBy === field ? (sortDesc ? '↓' : '↑') : ''

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th onClick={() => onSort('numericId')}>ID {sortIcon('numericId')}</th>
            <th>图片</th>
            <th onClick={() => onSort('nameZh')}>中文名 {sortIcon('nameZh')}</th>
            <th onClick={() => onSort('nameEn')}>英文名 {sortIcon('nameEn')}</th>
            <th>属性</th>
            <th onClick={() => onSort('generation')}>世代 {sortIcon('generation')}</th>
            <th onClick={() => onSort('starterCost')}>费用 {sortIcon('starterCost')}</th>
            <th onClick={() => onSort('baseHp')}>HP {sortIcon('baseHp')}</th>
            <th onClick={() => onSort('baseAtk')}>攻击 {sortIcon('baseAtk')}</th>
            <th onClick={() => onSort('baseDef')}>防御 {sortIcon('baseDef')}</th>
            <th onClick={() => onSort('baseSpatk')}>特攻 {sortIcon('baseSpatk')}</th>
            <th onClick={() => onSort('baseSpdef')}>特防 {sortIcon('baseSpdef')}</th>
            <th onClick={() => onSort('baseSpd')}>速度 {sortIcon('baseSpd')}</th>
            <th>分布地区</th>
            <th onClick={() => onSort('primaryBiomeRarity')}>地区稀有度 {sortIcon('primaryBiomeRarity')}</th>
            <th onClick={() => onSort('catchProbability')}>捕捉概率 {sortIcon('catchProbability')}</th>
            <th onClick={() => onSort('baseTotal')}>种族值 {sortIcon('baseTotal')}</th>
          </tr>
        </thead>
        <tbody>
          {pokemons.map((p) => {
            const { atlas, frame } = getPokemonIconFrame(
              p.numericId,
              p.generation,
              iconAtlases,
              fallbackIconAtlases
            )
            return (
              <tr key={p.id} onClick={() => onRowClick(p)} className="clickable">
                <td>{p.numericId}</td>
                <td
                  className="sprite-cell"
                  ref={(el) => registerLazyImage?.(el, p.id)}
                >
                  {atlas && frame ? (
                    <span
                      className="pokemon-icon-sprite"
                      style={getAtlasSpriteStyle(
                        atlas,
                        frame,
                        frame.sourceSize || DEFAULT_ICON_SOURCE_SIZE,
                        40
                      )}
                      title={p.nameZh}
                    />
                  ) : (
                    <span className="sprite-placeholder sprite-placeholder-sm">-</span>
                  )}
                </td>
                <td className="name-zh">{p.nameZh}</td>
                <td className="name-en">{p.nameEn}</td>
                <td>
                  {renderTypeBadge(p.type1)}
                  {p.type2 && renderTypeBadge(p.type2)}
                </td>
                <td>{p.generation}</td>
                <td>{p.starterCost ?? '-'}</td>
                <td>{p.baseHp}</td>
                <td>{p.baseAtk}</td>
                <td>{p.baseDef}</td>
                <td>{p.baseSpatk}</td>
                <td>{p.baseSpdef}</td>
                <td>{p.baseSpd}</td>
                <td className="biomes-cell">
                  {(p.biomes || []).length > 0 ? (
                    <span className="biome-tags">
                      {(p.biomes || [])
                        .slice(0, 2)
                        .map((b) => (
                          <span key={b.id} className="biome-tag">
                            {b.nameZh}
                          </span>
                        ))}
                      {(p.biomes || []).length > 2 && (
                        <span className="more-tag">
                          +{(p.biomes || []).length - 2}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="no-biome">-</span>
                  )}
                </td>
                <td>{p.primaryBiomeRarity || '-'}</td>
                <td>
                  {p.catchProbability > 0
                    ? `${(p.catchProbability * 100).toFixed(2)}%`
                    : '-'}
                </td>
                <td className="total">{p.baseTotal}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
