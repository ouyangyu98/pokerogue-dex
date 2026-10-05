import { useMemo } from 'react'
import type { Pokemon } from '../types'
import type { TeamSlot, TeamPokemonDetail, TeamAnalysisResult } from './types'
import {
  getTeamCoverage,
  getTeamDefenseMatrix,
  getTeamPokemonForm,
  getPokemonDefenseProfile,
  getTeamRoleDistribution,
  generateGapSuggestions,
} from './teamUtils'

export function useTeamAnalysis(
  slots: (TeamSlot | null)[],
  pokemons: Pokemon[],
): TeamAnalysisResult | null {
  return useMemo(() => {
    const pokemonMap = new Map(pokemons.map(p => [p.id, p]))

    const details: TeamPokemonDetail[] = []
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i]
      if (!slot) continue
      const pokemon = pokemonMap.get(slot.speciesId)
      if (!pokemon) continue
      const form = getTeamPokemonForm(pokemon, slot.formIndex)
      details.push({ pokemon, form, slotIndex: i })
    }

    if (details.length === 0) return null

    const coverage = getTeamCoverage(details)
    const defense = getTeamDefenseMatrix(details)
    const defenseProfiles = details.map(getPokemonDefenseProfile)
    const roles = getTeamRoleDistribution(details)
    const gaps = generateGapSuggestions(details, coverage, defense, roles)

    return {
      coverage,
      defense,
      defenseProfiles,
      roles,
      gaps,
      pokemonDetails: details,
    }
  }, [slots, pokemons])
}
