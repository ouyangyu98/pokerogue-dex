import type { Pokemon, PokemonFormEntry } from '../types'

export function formRouteId(baseId: string, formKey: string) {
  return `${baseId}--${formKey.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`
}

export function getPokemonDetailPath(
  pokemon: Pokemon,
  form?: PokemonFormEntry | null,
) {
  if (form && form.formIndex > 0 && form.formKey) {
    return `/pokemon/${formRouteId(pokemon.id, form.formKey)}`
  }
  return `/pokemon/${pokemon.id}`
}
