import { useState } from 'react'
import type { Pokemon } from '../types'
import type { TextureAtlas } from '../utils/atlas'
import type { TeamSlot } from './types'
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

  return (
    <div className="team-slots">
      {slots.map((slot, index) => {
        const pokemon = slot ? pokemonMap.get(slot.speciesId) : null
        const form = pokemon ? (pokemon.forms[slot!.formIndex] ?? pokemon.forms[0]) : null

        const { atlas, frame } = pokemon
          ? getPokemonIconFrame(pokemon.numericId, pokemon.generation, iconAtlases)
          : { atlas: null, frame: null }
        const iconStyle = atlas && frame
          ? getAtlasSpriteStyle(atlas, frame, DEFAULT_ICON_SOURCE_SIZE, 48)
          : null

        return (
          <div
            key={index}
            className={`team-slot ${pokemon ? 'filled' : 'empty'}`}
            onClick={() => !pokemon && openPicker(index)}
          >
            {pokemon ? (
              <>
                <button
                  className="slot-remove"
                  onClick={e => {
                    e.stopPropagation()
                    onRemovePokemon(index)
                  }}
                  title="移除"
                >
                  ×
                </button>
                <div className="slot-icon">
                  {iconStyle ? (
                    <div style={iconStyle} />
                  ) : (
                    <div className="slot-icon-placeholder">{pokemon.nameZh[0]}</div>
                  )}
                </div>
                <div className="slot-name">{pokemon.nameZh}</div>
                <div className="slot-types">
                  {renderTypeBadge(form?.type1 ?? pokemon.type1)}
                  {renderTypeBadge(form?.type2 ?? pokemon.type2)}
                </div>
                {pokemon.forms.length > 1 && (
                  <div className="slot-forms">
                    {pokemon.forms.map((f, fi) => (
                      <button
                        key={fi}
                        className={`slot-form-btn ${slot!.formIndex === fi ? 'active' : ''}`}
                        onClick={e => {
                          e.stopPropagation()
                          onSwitchForm(index, fi)
                        }}
                        title={f.formNameZh || `形态 ${fi + 1}`}
                      >
                        {fi + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="slot-placeholder">
                <div className="slot-plus">+</div>
                <div className="slot-label">添加精灵</div>
              </div>
            )}
          </div>
        )
      })}

      <PokemonPickerModal
        open={pickerOpen}
        pokemons={pokemons}
        iconAtlases={iconAtlases}
        onSelect={handleSelect}
        onClose={() => {
          setPickerOpen(false)
          setActiveSlot(null)
        }}
      />
    </div>
  )
}
