import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import HomePage from '../pages/HomePage'
import PokemonListPage from '../pages/PokemonListPage'
import PokemonDetailPage from '../pages/PokemonDetailPage'
import BiomeListPage from '../pages/BiomeListPage'
import BiomeDetailPage from '../pages/BiomeDetailPage'
import ItemListPage from '../pages/ItemListPage'
import ItemDetailPage from '../pages/ItemDetailPage'
import MoveListPage from '../pages/MoveListPage'
import MoveDetailPage from '../pages/MoveDetailPage'
import AbilityListPage from '../pages/AbilityListPage'
import AbilityDetailPage from '../pages/AbilityDetailPage'
import NaturePage from '../pages/NaturePage'
import NatureDetailPage from '../pages/NatureDetailPage'
import TypeMatchupPage from '../pages/TypeMatchupPage'
import TypeDetailPage from '../pages/TypeDetailPage'
import BiomeMapPage from '../pages/BiomeMapPage'
import DataReportPage from '../pages/DataReportPage'
import TeamBuilderPage from '../pages/TeamBuilderPage'
import FeedbackPage from '../pages/FeedbackPage'
import NotFoundPage from '../pages/NotFoundPage'
import EnLandingPage from '../pages/EnLandingPage'

export const routes = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'pokemon', element: <PokemonListPage /> },
      { path: 'pokemon/:id', element: <PokemonDetailPage /> },
      { path: 'biomes', element: <BiomeListPage /> },
      { path: 'biome/:id', element: <BiomeDetailPage /> },
      { path: 'items', element: <ItemListPage /> },
      { path: 'item/:id', element: <ItemDetailPage /> },
      { path: 'moves', element: <MoveListPage /> },
      { path: 'move/:id', element: <MoveDetailPage /> },
      { path: 'abilities', element: <AbilityListPage /> },
      { path: 'ability/:id', element: <AbilityDetailPage /> },
      { path: 'natures', element: <NaturePage /> },
      { path: 'nature/:id', element: <NatureDetailPage /> },
      { path: 'types', element: <TypeMatchupPage /> },
      { path: 'type/:id', element: <TypeDetailPage /> },
      { path: 'map', element: <BiomeMapPage /> },
      { path: 'report', element: <DataReportPage /> },
      { path: 'team', element: <TeamBuilderPage /> },
      { path: 'feedback', element: <FeedbackPage /> },
      { path: 'en', element: <EnLandingPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)

export function getStaticPaths(): string[] {
  return routes[0].children
    ?.filter(r => r.path && r.path !== '*')
    .map(r => {
      if (r.index) return '/'
      return `/${r.path}`
    }) || []
}
