# DogMaker 🐶

A tiny PWA that builds a dog from drawn options and saves it as a transparent PNG sticker.
Pieces are composited as hand-drawn-style SVG; pick options, hit Download, share the link.

## Develop

```bash
npm install
npm run dev        # local dev server
npm test           # run unit tests
npm run build      # production build into dist/
npm run preview    # serve the production build
```

Visit `#gallery` (e.g. `http://localhost:5173/DogMaker/#gallery`) to QA every option.

## Deploy (GitHub Pages)

1. Create a GitHub repo named **DogMaker** and push `main`
   (the `base` in `vite.config.ts` must match the repo name; change both together if you rename).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` builds, tests, and deploys. The site URL is `https://<user>.github.io/DogMaker/`.

## Add new art

1. Add the SVG fragment to `src/catalog/parts.ts` (authored in the `-30 -10 260 260` grid;
   recolorable shapes use `fill="currentColor"`, ink uses `fill="#2e2018"`).
2. Register it as an `Option` in the right `Category` in `src/catalog/index.ts`.
3. It appears in the UI automatically and composites with everything else.
