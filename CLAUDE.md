# Genera V3

Generative art playground inspired by Joshua Davis / praystation. Canvas 2D rendering with a parameter-driven UI, direct drawing mode, and atmospheric effects.

## Tech Stack

- **Runtime**: Vite + React 19 + TypeScript
- **Rendering**: HTML Canvas 2D (no WebGL, no external graphics libraries)
- **Fonts**: DM Mono (loaded from Google Fonts)

## Commands

- `npm install` — install dependencies
- `npm run dev` — start dev server with HMR
- `npm run build` — type-check and production build
- `npm run preview` — preview production build

## Project Structure

```
src/
├── main.tsx              Entry point
├── App.tsx               Root component
├── types.ts              Shared TypeScript types
├── constants.ts          Default params and UI option lists
├── utils/
│   ├── math.ts           PRNG (mulberry32), 2D Perlin noise, lerp/clamp/pick helpers
│   └── color.ts          HSL string helpers, palette generation, weighted color pool
├── engine/
│   ├── shapes.ts         Shape factory (circle, poly, blob, rings, target, cross)
│   ├── renderer.ts       Single-element Canvas renderer with gradient lighting
│   ├── background.ts     Multi-point radial gradient background
│   ├── effects.ts        Bead chain trails, typographic scatter overlays
│   ├── atmosphere.ts     Ethereal elements: soft clouds, aurora ribbons, ink blooms, light rays
│   ├── drawing.ts        Brush rendering (scatter, chain, spray, eraser), point interpolation
│   └── generate.ts       Main composition engine — orchestrates all generation
└── components/
    ├── Knob.tsx           Rotary knob control (pointer-drag interaction)
    ├── Seg.tsx            Segmented button selector
    ├── DrawCanvas.tsx     Overlay canvas for direct drawing mode (undo, pointer handling)
    └── GeneraV3.tsx       Main app: canvas, panels, state management
```

## Architecture Notes

- All randomness flows through a seeded PRNG (`createRNG`), making every output fully reproducible from its seed.
- The `generate()` function is the main entry point for rendering. It takes a Canvas context, dimensions, a `Params` object, and a seed, and draws the entire composition.
- **Render layer order**: background → light rays → clouds → blooms → main shapes → bead chains → typo scatter → ribbons.
- **Drawing mode** uses a separate overlay canvas (`DrawCanvas`) stacked on top of the generation canvas. Drawing persists across regeneration. Undo via ImageData snapshots (up to 20 steps).
- **Brush types**: scatter (stamps shapes from the shape pool), bead chain (beads along cursor), spray (random dots in radius), eraser (destination-out compositing).
- UI state lives in `GeneraV3.tsx` using React `useState`. Parameter changes trigger a full re-render of the canvas via `useEffect`.
- No external state management library — the app is intentionally simple and self-contained.

## Conventions

- Inline styles throughout (no CSS files) — matches the original single-file design.
- Engine code (`src/engine/`, `src/utils/`) is pure functions with no React dependency.
- Types are centralized in `src/types.ts` — import from there rather than defining inline.
