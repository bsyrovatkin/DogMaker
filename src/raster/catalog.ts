// Option catalogs for the DogMaker questionnaire. Product copy is English.

export interface Opt { id: string; label: string }

export const FURS: Opt[] = [
  { id: 'curly', label: 'Curly' },
  { id: 'shaggy', label: 'Shaggy' },
  { id: 'smooth', label: 'Smooth' },
  { id: 'fluffy', label: 'Fluffy' },
]

export const EARS: Opt[] = [
  { id: 'floppy', label: 'Floppy' },
  { id: 'pointy', label: 'Pointy' },
  { id: 'round', label: 'Round' },
]

export const COLORS: { hex: string; label: string }[] = [
  { label: 'Classic', hex: '#c98a5e' }, { label: 'Chocolate', hex: '#6b4a2f' }, { label: 'Golden', hex: '#e0aa55' }, { label: 'Black', hex: '#4b443c' },
  { label: 'Cream', hex: '#ead8bd' }, { label: 'Caramel', hex: '#a9713f' }, { label: 'Apricot', hex: '#dd9a6e' }, { label: 'Fawn', hex: '#cbab83' }, // note: 'Black' lightened to a charcoal so the face reads
  { label: 'Red', hex: '#b15a36' }, { label: 'Grey', hex: '#9a9a9a' }, { label: 'White', hex: '#f2ece2' }, { label: 'Silver', hex: '#8f99a6' },
  { label: 'Pink', hex: '#e6a0b0' }, { label: 'Mint', hex: '#9fccb6' }, { label: 'Sky', hex: '#9db9dd' }, { label: 'Lavender', hex: '#b3a3d1' },
]

export const SPOTS: { label: string; hex: string | null }[] = [
  { label: 'No spots', hex: null },
  { label: 'Brown', hex: '#6b4a2f' },
  { label: 'Caramel', hex: '#a9713f' },
  { label: 'Grey', hex: '#7d756e' },
  { label: 'Black', hex: '#2f2a26' },
  { label: 'Cream', hex: '#ead8bd' },
]

export const EYES: Opt[] = [
  { id: 'dots', label: 'Dot' }, { id: 'big', label: 'Big' }, { id: 'sparkle', label: 'Sparkle' },
  { id: 'happy', label: 'Happy' }, { id: 'sleepy', label: 'Sleepy' }, { id: 'wide', label: 'Wide' },
]

export const MUZZLES: { id: string; label: string; pink?: boolean }[] = [
  { id: 'smile', label: 'Smile' },
  { id: 'tongue', label: 'Tongue', pink: true },
  { id: 'o', label: 'Surprised', pink: true },
  { id: 'calm', label: 'Calm' },
]

export const SIZES: { v: number; label: string }[] = [
  { v: 0.72, label: 'Tiny' }, { v: 0.86, label: 'Small' }, { v: 1, label: 'Normal' }, { v: 1.12, label: 'Big' },
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
  spot: string | null
  eyes: string
  muzzle: string
  size: number
  accessories: string[]
  ground: string | null
  name: string
}

export const DEFAULT_CONFIG: MakerConfig = {
  fur: 'curly', ears: 'floppy', color: '#c98a5e', spot: null,
  eyes: 'dots', muzzle: 'smile', size: 1, accessories: [], ground: 'grass', name: '',
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
    spot: pick(SPOTS).hex,
    eyes: pick(EYES).id,
    muzzle: pick(MUZZLES).id,
    size: pick(SIZES).v,
    accessories,
    ground: pick(GROUNDS).id,
    name: '',
  }
}
