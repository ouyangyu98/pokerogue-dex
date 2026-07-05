// Atlas / sprite utilities for PokeRogue texture atlases

export interface AtlasFrame {
  filename: string
  frame: { x: number; y: number; w: number; h: number }
  sourceSize: { w: number; h: number }
  spriteSourceSize: { x: number; y: number; w: number; h: number }
}

export interface TextureAtlas {
  imageUrl: string
  width: number
  height: number
  frames: Record<string, AtlasFrame>
}

export const DEFAULT_ICON_SOURCE_SIZE = { w: 40, h: 30 }
export const DEFAULT_SPRITE_SOURCE_SIZE = { w: 37, h: 38 }

export function normalizeFrameName(filename: string) {
  return filename.replace(/\.png$/i, '')
}

function getCacheBuster(raw: any): string {
  // Use the TexturePacker smartupdate hash so the image URL changes whenever
  // the atlas is repacked. This prevents stale cached PNGs from being paired
  // with fresh JSON frame coordinates, which causes sprite corruption.
  const smartupdate = raw.meta?.smartupdate || ''
  const match = smartupdate.match(/:([a-f0-9]{32}):/)
  return match ? match[1].slice(0, 12) : ''
}

export function buildTextureAtlas(raw: any, imageBaseUrl: string): TextureAtlas | null {
  const texture = raw.textures?.[0]
  if (!texture || !Array.isArray(texture.frames)) return null

  const cacheBuster = getCacheBuster(raw)
  const query = cacheBuster ? `?v=${cacheBuster}` : ''

  return {
    imageUrl: `${imageBaseUrl}/${texture.image}${query}`,
    width: texture.size.w,
    height: texture.size.h,
    frames: Object.fromEntries(texture.frames.map((frame: any) => [normalizeFrameName(frame.filename), frame])),
  }
}

export function getAtlasSpriteStyle(
  atlas: TextureAtlas,
  frame: AtlasFrame,
  sourceSize: { w: number; h: number },
  pixelSize: number,
) {
  const scale = pixelSize / Math.max(sourceSize.w, sourceSize.h)
  // Compensate for spriteSourceSize offset so trimmed sprites render
  // at the correct position within their logical source canvas.
  const offsetX = frame.spriteSourceSize?.x || 0
  const offsetY = frame.spriteSourceSize?.y || 0
  return {
    width: `${Math.round(sourceSize.w * scale)}px`,
    height: `${Math.round(sourceSize.h * scale)}px`,
    backgroundImage: `url(${atlas.imageUrl})`,
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: `${Math.round(-(frame.frame.x + offsetX) * scale)}px ${Math.round(-(frame.frame.y + offsetY) * scale)}px`,
    backgroundSize: `${Math.round(atlas.width * scale)}px ${Math.round(atlas.height * scale)}px`,
    imageRendering: 'pixelated' as const,
    flex: '0 0 auto' as const,
  }
}

export function getFirstAtlasFrame(atlas?: TextureAtlas | null) {
  if (!atlas) return null
  return Object.values(atlas.frames)[0] || null
}

export function getPokemonIconAtlasKey(generation: number) {
  return `pokemon_icons_${generation}`
}

export function getPokemonIconFrame(
  numericId: number,
  generation: number,
  iconAtlases: Record<string, TextureAtlas>,
  fallbackAtlases?: Record<string, TextureAtlas>,
) {
  // Primary: look in the Pokémon's own generation atlas
  const primaryAtlas = iconAtlases[getPokemonIconAtlasKey(generation)]
  if (primaryAtlas) {
    const frame = primaryAtlas.frames[String(numericId)]
    if (frame) return { atlas: primaryAtlas, frame }
  }

  // Fallback 1: search all other loaded generation atlases.
  // Some legendaries (e.g. Arceus 493, Giratina 487) are missing from
  // their gen's icon set but may exist in another.
  for (const [key, atlas] of Object.entries(iconAtlases)) {
    if (key === getPokemonIconAtlasKey(generation)) continue
    const frame = atlas.frames[String(numericId)]
    if (frame) return { atlas, frame }
  }

  // Fallback 2: check individually-loaded sprite atlases (per-pokemon sprites
  // used as icon fallback when the icon set has gaps).
  if (fallbackAtlases) {
    const fbAtlas = fallbackAtlases[String(numericId)]
    if (fbAtlas) {
      const frame = getPokemonSpriteFrame(fbAtlas)
      if (frame) return { atlas: fbAtlas, frame }
    }
  }

  return { atlas: primaryAtlas || null, frame: null }
}

export function getPokemonSpriteFrame(atlas?: TextureAtlas | null) {
  if (!atlas) return null
  return atlas.frames['0001'] || getFirstAtlasFrame(atlas)
}
