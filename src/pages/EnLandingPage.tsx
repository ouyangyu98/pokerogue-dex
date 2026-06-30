import { Link } from 'react-router-dom'
import SEOMeta from '../seo/SEOMeta'
import JsonLd from '../seo/JsonLd'
import { siteConfig } from '../seo/generateMeta'

export default function EnLandingPage() {
  const title = 'PokeRogue Helper - Dex, Endless Guide, Fusion and Team Tools'
  const description =
    'A fan-made PokeRogue helper with a full Pokédex, base stats, abilities, egg moves, passive abilities, biome encounter tables, fusion ideas and team-building tools for endless mode.'

  return (
    <div className="en-landing-page">
      <SEOMeta
        title={title}
        description={description}
        path="/en"
        ogImage="/og-image.png"
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: title,
          description,
          url: `${siteConfig.siteUrl}/en`,
          inLanguage: 'en',
          isPartOf: {
            '@type': 'WebSite',
            name: siteConfig.siteName,
            url: siteConfig.siteUrl,
          },
        }}
      />

      <section className="en-hero">
        <h1>PokeRogue Helper</h1>
        <p className="en-lead">
          A utility hub for PokeRogue players. Browse the Pokédex, check base stats and abilities,
          look up egg moves and passive abilities, explore biome encounters, experiment with fusion
          combinations, and find team ideas for endless mode.
        </p>
        <div className="en-actions">
          <Link to="/" className="en-primary-btn">
            Open the Chinese Pokédex Tool
          </Link>
        </div>
        <p className="en-note">
          The main tool is currently available in Chinese only. English version is coming soon.
        </p>
      </section>

      <section className="en-features">
        <h2>What you can do here</h2>
        <ul>
          <li>
            <strong>Pokédex:</strong> Search every Pokémon by name, type, generation, biome,
            rarity, starter cost and base-stat total.
          </li>
          <li>
            <strong>Stats &amp; Abilities:</strong> View base stats, regular and hidden abilities,
            passive abilities, and type matchups for each Pokémon.
          </li>
          <li>
            <strong>Moves:</strong> Check level-up and egg moves with power, accuracy, type
            and effect descriptions.
          </li>
          <li>
            <strong>Biomes:</strong> See which Pokémon appear in each biome, their rarity,
            time of day and boss status.
          </li>
          <li>
            <strong>Items:</strong> Browse the shop item pool, tiers and effects.
          </li>
          <li>
            <strong>Team Builder:</strong> Analyze type coverage, defensive weaknesses,
            role distribution and team gaps.
          </li>
        </ul>
      </section>

      <section className="en-coming-soon">
        <h2>English version coming soon</h2>
        <p>
          We are working on a fully localized English interface. For now, all game data and the
          interactive tools are accessible through the Chinese site. Click the button above to try
          them out.
        </p>
      </section>
    </div>
  )
}
