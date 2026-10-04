import { useEffect, useState } from 'react'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { getPokemonListMeta } from '../seo/generateMeta'
import { buildCollectionPage, buildWebSite } from '../seo/schemaBuilders'
import PokemonList from '../components/PokemonList'
import type { Pokemon } from '../types'

export default function PokemonListPage() {
  const [count, setCount] = useState(0)
  const meta = getPokemonListMeta(count)

  useEffect(() => {
    Promise.all([
      fetch('/data/pokemon.json').then(r => r.json()),
      fetch('/data/pokemon-forms.json').then(r => r.json()),
    ])
      .then(([pokemonData, formData]: [Pokemon[], Pokemon[]]) => setCount(pokemonData.length + formData.length))
      .catch(() => {})
  }, [])

  return (
    <div className="page">
      <SEOMeta title={meta.title} description={meta.description} path="/pokemon" keywords={meta.keywords} />
      <JsonLd
        data={[
          buildCollectionPage('精灵图鉴', '/pokemon', count, []),
          buildWebSite(),
        ]}
      />
      <PokemonList />
    </div>
  )
}
