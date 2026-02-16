# Genera

A generative art playground inspired by [Joshua Davis](https://joshuadavis.com/) and the praystation aesthetic. Create rich, layered compositions using algorithmic shape generation, noise-driven layouts, atmospheric effects, and direct canvas painting.

Built with React, TypeScript, HTML Canvas 2D, and Vite.

## Features

### Algorithmic Generation
- **10 shape types** — circles, polygons, stars, blobs, rings, targets, crosses, hexagons, cloud clusters, and petals
- **6 layout modes** — scatter, grid, radial, noise-guided, cluster, and burst
- **6 palette modes** — analogous, complementary, triadic, warm, neon, monochrome
- **3 color strategies** — random pool, noise-mapped gradient, spatial attraction fields
- **Symmetry** — bilateral, quad, and rotational
- **Multi-layer depth** with configurable fade
- **Perlin noise field** for position modulation and flow alignment
- **Sine-wave oscillator** for rhythmic size/opacity variation

### Rendering
- Directional lighting with radial gradient fills
- Fill + stroke combined outlines (Davis-style)
- Bead chain trails, flowing tangled line networks, typographic scatter
- Seeded PRNG for reproducible outputs

### Atmosphere
- Soft translucent clouds
- Glowing aurora ribbons
- Watercolor ink blooms
- Volumetric light rays

### Direct Drawing
- Paint on top of generated compositions with 4 brush types:
  - **Scatter** — stamps shapes from the palette
  - **Chain** — bead chains along your stroke
  - **Spray** — fine dot spray pattern
  - **Eraser** — remove drawn marks
- Configurable brush size and opacity
- Undo stack (20 levels) and clear
- Drawings persist across regeneration

### Performance
- Generation runs in a **Web Worker** (non-blocking UI)
- Zoom/pan uses cached bitmap compositing (no re-generation)

### UI
- Dark/light theme with system preference detection
- Rotary knob and segmented button controls
- Info tooltips on every section explaining what each control does
- Scroll to zoom, ctrl/cmd+drag to pan

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |

## Project Structure

```
src/
  types.ts              Type definitions (shapes, params, UI)
  constants.ts          Default params, segment options
  utils/
    math.ts             PRNG, Perlin noise, lerp, clamp
    color.ts            HSL helpers, palette generation
  engine/
    shapes.ts           Shape factory (10 types)
    renderer.ts         Canvas 2D shape rendering
    background.ts       Multi-point gradient backgrounds
    effects.ts          Bead chains, tangles, typographic scatter
    atmosphere.ts       Clouds, ribbons, blooms, light rays
    generate.ts         Main composition engine
    generate.worker.ts  Web Worker wrapper
    drawing.ts          Brush rendering for draw mode
  components/
    GeneraV3.tsx        Main app (state, layout, controls)
    DrawCanvas.tsx      Drawing overlay canvas
    Knob.tsx            Rotary knob control
    Seg.tsx             Segmented button selector
  main.tsx              Entry point
  App.tsx               Root component
```

## Tech Stack

- **React 19** + **TypeScript 5.7**
- **Vite 6** (dev server + bundler)
- **HTML Canvas 2D** (no WebGL)
- **Web Workers** + **OffscreenCanvas** for non-blocking generation

## License

MIT
