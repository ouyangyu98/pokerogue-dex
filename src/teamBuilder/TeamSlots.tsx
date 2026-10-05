import { useState } from 'react'
import type { Pokemon } from '../types'
import type { TextureAtlas } from '../utils/atlas'
import type { TeamSlot } from './types'
import { getTeamPokemonForm } from './teamUtils'
import { renderTypeBadge } from '../utils/render'
import {
  getPokemonIconFrame,
  getAtlasSpriteStyle,
  DEFAULT_ICON_SOURCE_SIZE,
} from '../utils/atlas'
import PokemonPickerModal from './PokemonPickerModal'

interface TeamSlotsProps {
  slots: (TeamSlot | null)[]
  pokemons: Pokemon[]
  iconAtlases: Record<string, TextureAtlas>
  onAddPokemon: (slotIndex: number, speciesId: string) => void
  onRemovePokemon: (slotIndex: number) => void
  onSwitchForm: (slotIndex: number, formIndex: number) => void
}

export default function TeamSlots({
  slots,
  pokemons,
  iconAtlases,
  onAddPokemon,
  onRemovePokemon,
  onSwitchForm,
}: TeamSlotsProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeSlot, setActiveSlot] = useState<number | null>(null)

  const pokemonMap = new Map(pokemons.map(p => [p.id, p]))

  function openPicker(slotIndex: number) {
    setActiveSlot(slotIndex)
    setPickerOpen(true)
  }

  function handleSelect(speciesId: string) {
    if (activeSlot !== null) {
      onAddPokemon(activeSlot, speciesId)
    }
    setPickerOpen(false)
    setActiveSlot(null)
  }

  const filledCount = slots.filter(Boolean).length

  return (
    <section className="team-composer" aria-label="当前队伍">
      <div className="team-composer-heading">
        <div>
          <span className="team-section-label">当前队伍</span>
          <h3>{filledCount > 0 ? `已选择 ${filledCount} 名精灵` : '从第一名精灵开始组队'}</h3>
        </div>
        <span className="team-composer-progress">还可添加 {6 - filledCount} 名</span>
      </div>

      <div className="team-slots">
        {slots.map((slot, index) => {
          const pokemon = slot ? pokemonMap.get(slot.speciesId) : null
          const form = pokemon ? getTeamPokemonForm(pokemon, slot!.formIndex) : null

          const { atlas, frame } = pokemon
            ? getPokemonIconFrame(pokemon.numericId, pokemon.generation, iconAtlases)
            : { atlas: null, frame: null }
          const iconStyle = atlas && frame
            ? getAtlasSpriteStyle(atlas, frame, DEFAULT_ICON_SOURCE_SIZE, 48)
            : null

          if (!pokemon) {
            return (
              <button
                key={index}
                type="button"
                className="team-slot team-slot-empty"
                onClick={() => openPicker(index)}
                aria-label={`为队伍第 ${index + 1} 位添加精灵`}
              >
                <span className="slot-number">第 {index + 1} 位</span>
                <span className="slot-placeholder">
                  <span className="slot-plus">+</span>
                  <span className="slot-label">添加精灵</span>
                </span>
              </button>
            )
          }

          const formLabel = form?.formNameZh && form.formNameZh !== pokemon.nameZh
            ? form.formNameZh
            : '基础形态'

          return (
            <article key={index} className="team-slot team-slot-filled">
              <div className="slot-topline">
                <span className="slot-number">第 {index + 1} 位</span>
                <button
                  className="slot-remove"
                  type="button"
                  onClick={e => {
                    e.stopPropagation()
                    onRemovePokemon(index)
                  }}
                  title={`移除${pokemon.nameZh}`}
                  aria-label={`移除${pokemon.nameZh}`}
                >
                  ×
                </button>
              </div>
              <div className="slot-main">
                <div className="slot-icon">
                  {iconStyle ? (
                    <div style={iconStyle} />
                  ) : (
                    <div className="slot-icon-placeholder">{pokemon.nameZh[0]}</div>
                  )}
                </div>
                <div className="slot-name">{pokemon.nameZh}</div>
                <div className="slot-types">
                  {renderTypeBadge(form ? form.type1 : pokemon.type1)}
                  {renderTypeBadge(form ? form.type2 : pokemon.type2)}
                </div>
              </div>
              <div className="slot-controls">
                <button type="button" className="slot-replace-btn" onClick={() => openPicker(index)}>
                  替换
                </button>
                {pokemon.forms.length > 1 && (
                  <label className="slot-form-select">
                    <span>形态</span>
                    <select
                      value={slot!.formIndex}
                      onChange={e => onSwitchForm(index, Number(e.target.value))}
                      aria-label={`${pokemon.nameZh}形态`}
                    >
                      {pokemon.forms.map((entry, formIndex) => (
                        <option key={entry.formKey || formIndex} value={formIndex}>
                          {entry.formNameZh && entry.formNameZh !== pokemon.nameZh
                            ? entry.formNameZh
                            : formIndex === 0 ? '基础形态' : `形态 ${formIndex + 1}`}
                        </option>
                      ))}
                    </select>
                    <span className="slot-form-current">{formLabel}</span>
                  </label>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <p className="team-composer-helper">
        可随时替换、移除或切换形态；分析结果会随队伍实时更新。
      </p>

      <PokemonPickerModal
        open={pickerOpen}
        pokemons={pokemons}
        iconAtlases={iconAtlases}
        selectedSpeciesIds={slots.flatMap(slot => slot ? [slot.speciesId] : [])}
        slotIndex={activeSlot}
        onSelect={handleSelect}
        onClose={() => {
          setPickerOpen(false)
          setActiveSlot(null)
        }}
      />
    </section>
  )
}
