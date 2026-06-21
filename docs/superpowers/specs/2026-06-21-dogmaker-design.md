# DogMaker — Design (v1)

**Date:** 2026-06-21
**Status:** Approved for planning
**Author:** Brainstormed with the project owner

> A dog-character maker built from a child's hand-drawn "dog creation algorithm".
> You pick options, get a finished dog, and save it as a transparent PNG sticker.
> The whole point is to **preserve the hand-drawn style** while making every option combinable.

---

## 1. Goal & audience

A small **"friends & family" product**:

- Runs in the browser on phones and tablets (installable PWA).
- Shareable by a link — friends/relatives open it and play on their own devices.
- **No accounts, no backend, no database.** Everything runs client-side.
- Hosted for free on **GitHub Pages**.

Out of scope for v1: user accounts, server storage, analytics, monetization, app-store packaging.

---

## 2. Art approach (the core constraint)

The app is a **layered compositor**. To preserve the drawing style while allowing any
combination of options, each option is re-created **once** as a clean **vector (SVG) piece**
in the child's hand-drawn style, on a **fixed shared grid** so pieces always line up.

- **Standardized:** every piece is authored on the same canvas (e.g. `200 × 240`) with
  consistent anchor points, so layers stack cleanly.
- **All combinations work:** pieces are stacked at runtime; whole dogs are never pre-drawn.
- **Recolor for free:** recolorable regions use `fill="currentColor"`; the dark linework is
  fixed. Color comes from the palette, not redrawn per color.
- **Style preserved:** a shared SVG "wobble" filter (`feTurbulence` + `feDisplacementMap`)
  keeps clean paths looking hand-drawn. Pieces are traced from the child's actual drawings.
- **Trade-off:** this is a faithful *re-creation* of her drawings, not a literal pencil scan.
  New options are traced once and added to the catalog; the child can keep designing pieces.

---

## 3. v1 scope

### Categories in v1 ("Core Dog")

A complete, recognizable, cute dog that can be saved as a sticker:

| Category   | v1 option count | Notes |
|------------|-----------------|-------|
| Body type  | 4               | Silhouette incl. base body + default ear mounting points |
| Size       | 5               | tiny / small / normal / big / giant — pure scale transform |
| Fur        | 5               | short / fluffy / corded / shaggy / spiky textures |
| Colour     | 8 + custom      | Classic palette + a custom color picker ("other…") |
| Ears       | 5               | Drawn to the body's ear anchor points |
| Eyes       | 6               | |
| Nose       | 4               | |
| Mouth      | 4               | |

Counts are a starting target to bound the artwork and can be adjusted during production.

### Later packs (engine already supports them; art added in waves)

- **Pack 2 — Personality:** mood/expression, eyebrows, tongue, cheeks, colour spots, extras, outline style.
- **Pack 3 — Dress-up:** collar, bow, glasses, hats, flower, held treat, clothing.
- **Pack 4 — Fantasy & themes:** wings, costumes, event skins, classic skins.
- **Pack 5 — Scenes:** backgrounds the dog sits on/in (cloud, grass, pillow, lava, donut…).

---

## 4. Architecture

Client-only static PWA. No server. State lives in the browser; sharing is via URL.

### 4.1 Data model

```ts
// One selected option id per category, plus a color.
type DogConfig = {
  bodyType: string
  size: string
  fur: string
  color: string      // hex; from palette or custom picker
  ears: string
  eyes: string
  nose: string
  mouth: string
}
```

### 4.2 Asset catalog (the extension point)

```ts
type Option = {
  id: string
  label: string
  svg: string          // SVG fragment authored on the shared 200×240 grid
  // recolorable shapes use fill="currentColor"; linework is fixed dark
}

type Category = {
  key: keyof DogConfig
  label: string
  zIndex: number       // fixed layer order
  options: Option[]
  recolorable?: boolean // whether this layer follows DogConfig.color
}

type Catalog = Category[]
```

Adding options or whole new packs = **append to the catalog data**. No engine changes.

### 4.3 Layer order (z-index)

Fixed back-to-front stacking, independent of selection order:

```
body shape → fur texture → ears → (head/body already in body) → eyes → nose → mouth → [future: accessories/wings/etc.]
```

(Exact ordering finalized during art production; wings render behind body, head accessories in front.)

### 4.4 Renderer (core)

`DogRenderer(config, catalog) → composed SVG`

- Picks the selected `Option.svg` per category, stacks them by `zIndex`.
- Applies `DogConfig.color` to recolorable layers via `currentColor`.
- Wraps everything in the shared wobble filter.
- **The same renderer drives both the live preview and the export**, so the saved sticker
  is pixel-identical to what's on screen.

### 4.5 UI components

Responsive shell, **tablet-first**, two panes:

- **`StagePanel` (left, fixed):** live dog preview + `🎲 Random` + `⬇ Download`.
- **`OptionsPanel` (right, vertical scroll):** a `CategorySection` per category, each rendering
  `OptionTile`s. Selected tile is highlighted.
- Selecting a tile updates `DogConfig` → preview re-renders.
- **Phone:** the two panes stack (preview + buttons on top, scrollable categories below).
- **Tablet/desktop:** side-by-side as above.

### 4.6 Export

`exportSticker(config)`:

1. Render the composed SVG at **1024 × 1024, transparent background**.
2. Serialize SVG → `Image` → draw onto an offscreen `<canvas>` → `canvas.toBlob('image/png')`.
3. Share/save: **Web Share API** with the PNG file (iOS: "Save Image" to Photos / send to a
   messenger; Android: same + download). **Fallback:** trigger a normal file download.

### 4.7 Sharing & persistence

- `encodeConfig(config)` / `decodeConfig(str)`: compact serialization into the **URL hash**.
- On load: if the hash holds a config, hydrate from it (someone opened a shared dog).
- "Share" builds the dog URL and offers it via Web Share / clipboard.
- Otherwise, the last `DogConfig` is saved to **localStorage** and restored on next visit.

### 4.8 PWA

`vite-plugin-pwa`:

- Web app manifest (name, icons, theme color) → installable on the home screen.
- Service worker precaches the app shell + all SVG assets → **works fully offline**.

---

## 5. Asset production pipeline

How content grows over time:

1. Child draws a new piece (or we work from existing drawings).
2. We **trace it to an SVG fragment** on the shared `200 × 240` grid, aligned to the standard
   anchor points, with recolorable regions set to `fill="currentColor"` and fixed dark linework.
3. Register it: add the `Option` to the right `Category` in the catalog.
4. It immediately appears in the UI and composites with everything else.

A **gallery/QA page** renders every option (and a few random dogs) for visual review.

---

## 6. Error handling

- **Unknown option id** (from URL or localStorage) → fall back to that category's default. Never crash.
- **Web Share unavailable / fails** → download fallback.
- **Render/serialize failure on export** → friendly message, app stays usable.
- **Offline** → all core features work with no network.

---

## 7. Testing

- **Unit**
  - `encode/decodeConfig` round-trips losslessly.
  - Renderer produces the correct ordered set of layers for a given config.
  - `exportSticker` returns a non-empty PNG blob of exactly 1024 × 1024.
  - Bad/unknown option id falls back to the category default.
- **Visual / manual**
  - Gallery page showing all options and several random dogs for art QA.
- **Optional light E2E**
  - Select options → preview updates → Download triggers a share/download.

---

## 8. Tech stack

- **Build/UI:** Vite + TypeScript + React.
- **PWA:** `vite-plugin-pwa` (installable + offline).
- **Rendering:** inline SVG for preview; SVG → canvas for PNG export.
- **State:** a single `DogConfig` in app state; localStorage for persistence; URL hash for sharing.
- **Hosting:** GitHub Pages (static, free). Build configured with the correct base path.

---

## 9. Explicitly out of scope for v1

Later packs (Personality, Dress-up, Fantasy/themes, Scenes), background/scene export,
accounts, server features, analytics, and native app-store builds.
