// Option catalogs for the DogMaker questionnaire. Product copy is English.

export interface Opt { id: string; label: string }

export const FURS: Opt[] = [
  { id: 'curly', label: 'Curly' },
  { id: 'shaggy', label: 'Shaggy' },
  { id: 'smooth', label: 'Smooth' },
  { id: 'fluffy', label: 'Fluffy' },
  { id: 'dreads', label: 'Dreads' },
  { id: 'silky', label: 'Silky' },
]

export const EARS: Opt[] = [
  { id: 'floppy', label: 'Floppy' },
  { id: 'pointy', label: 'Pointy' },
  { id: 'round', label: 'Round' },
  { id: 'spaniel', label: 'Spaniel' },
]

export const COLORS: { hex: string; label: string }[] = [
  // — naturalistic —
  { label: 'Classic', hex: '#c98a5e' }, { label: 'Chocolate', hex: '#6b4a2f' }, { label: 'Golden', hex: '#e0aa55' }, { label: 'Black', hex: '#4b443c' },
  { label: 'Cream', hex: '#ead8bd' }, { label: 'Caramel', hex: '#a9713f' }, { label: 'Apricot', hex: '#dd9a6e' }, { label: 'Fawn', hex: '#cbab83' },
  { label: 'Red', hex: '#b15a36' }, { label: 'Grey', hex: '#9a9a9a' }, { label: 'White', hex: '#f2ece2' }, { label: 'Silver', hex: '#8f99a6' },
  { label: 'Espresso', hex: '#3d2a1a' }, { label: 'Mustard', hex: '#c7a13a' }, { label: 'Slate', hex: '#6f7782' }, { label: 'Sand', hex: '#d8c399' },
  // — pastels —
  { label: 'Pink', hex: '#e6a0b0' }, { label: 'Mint', hex: '#9fccb6' }, { label: 'Sky', hex: '#9db9dd' }, { label: 'Lavender', hex: '#b3a3d1' },
  // — bright / silly —
  { label: 'Bubblegum', hex: '#ff8fb1' }, { label: 'Lime', hex: '#bfe05f' }, { label: 'Tangerine', hex: '#ff9b3d' }, { label: 'Sunshine', hex: '#ffd84d' },
  { label: 'Aqua', hex: '#5fd0d0' }, { label: 'Plum', hex: '#9266b8' }, { label: 'Coral', hex: '#ff7e63' }, { label: 'Hot pink', hex: '#ff4d8d' },
]

/** Spot pattern shapes — applied as a 2nd colour on the body. `null` = no spots at all. */
export const SPOT_PATTERNS: { id: string | null; label: string }[] = [
  { id: null, label: 'No spots' },
  { id: 'blobs', label: 'Blobs' },
  { id: 'dots', label: 'Dots' },
  { id: 'patches', label: 'Patches' },
  { id: 'splash', label: 'Splash' },
  { id: 'stripes', label: 'Stripes' },
  { id: 'cheetah', label: 'Cheetah' },
  { id: 'hearts', label: 'Hearts' },
  { id: 'stars', label: 'Stars' },
]

/** Available spot colours. Picked separately from the pattern. */
export const SPOT_COLORS: { label: string; hex: string }[] = [
  // — natural —
  { label: 'Brown', hex: '#6b4a2f' },
  { label: 'Caramel', hex: '#a9713f' },
  { label: 'Grey', hex: '#7d756e' },
  { label: 'Black', hex: '#2f2a26' },
  { label: 'Cream', hex: '#ead8bd' },
  { label: 'White', hex: '#f4ecdc' },
  // — bright / silly —
  { label: 'Pink', hex: '#ff8fb1' },
  { label: 'Hot pink', hex: '#ff4d8d' },
  { label: 'Blue', hex: '#5aa6e6' },
  { label: 'Sky', hex: '#9db9dd' },
  { label: 'Yellow', hex: '#ffd84d' },
  { label: 'Orange', hex: '#ff9b3d' },
  { label: 'Green', hex: '#7cc24a' },
  { label: 'Mint', hex: '#7fd6b8' },
  { label: 'Purple', hex: '#9266b8' },
  { label: 'Aqua', hex: '#5fd0d0' },
  { label: 'Coral', hex: '#ff7e63' },
  { label: 'Red', hex: '#e24b4a' },
]

export const EYES: { id: string; label: string; colored?: boolean }[] = [
  { id: 'dots', label: 'Dot' }, { id: 'big', label: 'Big' }, { id: 'sparkle', label: 'Sparkle' },
  { id: 'happy', label: 'Happy' }, { id: 'sleepy', label: 'Sleepy' }, { id: 'wide', label: 'Wide' },
  // pre-coloured eyes — drawn as-is (not inkified)
  { id: 'heart', label: 'Heart', colored: true }, { id: 'star', label: 'Star', colored: true },
  { id: 'angry', label: 'Angry', colored: true }, { id: 'grumpy', label: 'Grumpy', colored: true },
]

export const MUZZLES: { id: string; label: string; pink?: boolean; colored?: boolean }[] = [
  { id: 'smile', label: 'Smile' },
  { id: 'tongue', label: 'Tongue', pink: true },
  { id: 'o', label: 'Surprised', pink: true },
  { id: 'calm', label: 'Calm' },
  // pre-coloured mouths — drawn as-is (not inkified)
  { id: 'grin', label: 'Grin', colored: true },
  { id: 'fang', label: 'Fang', colored: true },
  { id: 'frown', label: 'Frown', colored: true },
  { id: 'kiss', label: 'Kiss', colored: true },
]

export const SIZES: { v: number; label: string }[] = [
  { v: 0.72, label: 'Tiny' }, { v: 0.86, label: 'Small' }, { v: 1, label: 'Normal' }, { v: 1.12, label: 'Big' },
]

/** Body width — horizontal stretch of the whole dog (accessories follow automatically). */
export const BODIES: { v: number; label: string }[] = [
  { v: 0.82, label: 'Thin' }, { v: 1, label: 'Normal' }, { v: 1.14, label: 'Chubby' }, { v: 1.26, label: 'Chonky' },
]

export const ACCESSORIES: { id: string | null; label: string }[] = [
  { id: null, label: 'None' },
  { id: 'beanie', label: 'Beanie' }, { id: 'partyhat', label: 'Party' }, { id: 'crown', label: 'Crown' },
  { id: 'bow', label: 'Bow' }, { id: 'glasses', label: 'Glasses' }, { id: 'bandana', label: 'Bandana' },
  { id: 'collar', label: 'Collar' }, { id: 'scarf', label: 'Scarf' }, { id: 'tie', label: 'Tie' }, { id: 'wings', label: 'Wings' },
  { id: 'spacewhite', label: 'Space' }, { id: 'spaceblue', label: 'Astro' }, { id: 'hardhat', label: 'Helmet' }, { id: 'melon', label: 'Melon' },
]

export const GROUNDS: { id: string | null; label: string }[] = [
  { id: null, label: 'None' },
  { id: 'grass', label: 'Grass' }, { id: 'flowers', label: 'Flowers' }, { id: 'cloud', label: 'Cloud' },
  { id: 'pillow', label: 'Pillow' }, { id: 'mat', label: 'Mat' }, { id: 'wood', label: 'Wood' },
]

export interface MakerConfig {
  fur: string
  ears: string
  color: string
  /** Pattern shape id (see SPOT_PATTERNS). `null` = no spots. */
  spotPattern: string | null
  /** Spot fill colour (used only when spotPattern is set). */
  spotColor: string
  eyes: string
  muzzle: string
  size: number
  /** Horizontal body stretch (see BODIES). 1 = normal. */
  body: number
  accessories: string[]
  ground: string | null
  name: string
}

export const DEFAULT_CONFIG: MakerConfig = {
  fur: 'curly', ears: 'floppy', color: '#c98a5e',
  spotPattern: null, spotColor: SPOT_COLORS[0].hex,
  eyes: 'dots', muzzle: 'smile', size: 1, body: 1, accessories: [], ground: 'grass', name: '',
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

const ACC_IDS = ACCESSORIES.map((a) => a.id).filter((id): id is string => !!id)

export function randomConfig(): MakerConfig {
  const accessories: string[] = []
  if (Math.random() < 0.75) {
    accessories.push(pick(ACC_IDS))
    if (Math.random() < 0.4) { const s = pick(ACC_IDS); if (!accessories.includes(s)) accessories.push(s) }
  }
  return {
    fur: pick(FURS).id,
    ears: pick(EARS).id,
    color: pick(COLORS).hex,
    spotPattern: pick(SPOT_PATTERNS).id,
    spotColor: pick(SPOT_COLORS).hex,
    eyes: pick(EYES).id,
    muzzle: pick(MUZZLES).id,
    size: pick(SIZES).v,
    body: pick(BODIES).v,
    accessories,
    ground: pick(GROUNDS).id,
    name: '',
  }
}
