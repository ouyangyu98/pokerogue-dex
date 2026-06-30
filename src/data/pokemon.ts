/**
 * Pokemon data types - shared between frontend and data generation scripts.
 * This file re-exports from src/types/index.ts to provide a stable import path
 * for both the Vite frontend and Node.js scripts.
 */

export type {
  Pokemon,
  PokemonFormEntry,
  PokemonTypeKey,
  MoveEntry,
  EggMoveEntry,
  EvolutionEntry,
  BiomeRef,
  Biome,
  BiomeEncounter,
  SmogonSet,
  DataReport,
  CoverageItem,
  TypeMatchupItem,
} from '../types/index'

export { PokemonTypeNames } from '../types/index'
