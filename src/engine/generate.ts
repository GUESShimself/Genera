import type { Params, Element as El, HSLTuple } from "../types";
import { createRNG, createNoise, lerp, rand, randInt, pick, clamp, TAU } from "../utils/math";
import { genPalette, colorPool } from "../utils/color";
import { makeShape } from "./shapes";
import { renderEl } from "./renderer";
import { drawBackground } from "./background";
import { drawBeadChain, drawTypoScatter, drawTangles } from "./effects";
import { drawLightRays, drawClouds, drawBlooms, drawRibbons } from "./atmosphere";

export function generate(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  params: Params,
  seed: number,
): void {
  const rng = createRNG(seed);
  const noise = createNoise(seed);

  const {
    density, complexity, organicness, sizeMin, sizeMax,
    opacityMin, opacityMax, rotationSpread, strokeRatio,
    paletteMode, layout, noiseScale, noiseInfluence,
    colorStrategy, oscillatorFreq, oscillatorAmp,
    symmetryMode, layerCount, layerFade,
    lightAngle, lightIntensity, gradientShapes,
    beadChains, typoScatter, bgStyle,
    atmoClouds, atmoRibbons, atmoBlooms, atmoRays,
    tangles, outlineWeight,
  } = params;

  const palette = genPalette(rng, paletteMode);
  const getColor = colorPool(palette, rng);

  drawBackground(ctx, w, h, palette, rng, false, bgStyle);

  // Atmosphere: back layers (rays → clouds → blooms)
  if (atmoRays > 0) drawLightRays(ctx, rng, w, h, lightAngle, atmoRays);
  if (atmoClouds > 0) drawClouds(ctx, rng, w, h, palette, atmoClouds);
  if (atmoBlooms > 0) drawBlooms(ctx, rng, w, h, palette, atmoBlooms);

  const count = Math.floor(25 + density * 975);
  const layers = Math.max(1, Math.round(layerCount));
  const lightRad = (lightAngle / 360) * TAU;

  for (let layer = 0; layer < layers; layer++) {
    const layerOp = layers === 1 ? 1 : 1 - (layer / layers) * layerFade;
    const shapePool = Array.from({ length: randInt(3, 8, rng) }, () =>
      makeShape(rng, complexity, organicness),
    );

    const clusters = Array.from({ length: randInt(2, 5, rng) }, () => ({
      x: rand(w * 0.12, w * 0.88, rng),
      y: rand(h * 0.12, h * 0.88, rng),
      spread: rand(50, Math.min(w, h) * 0.4, rng),
    }));

    const els: El[] = [];
    const n = Math.floor(count / layers);

    for (let i = 0; i < n; i++) {
      const shape = pick(shapePool, rng);
      const t = i / n;

      // Position
      let x: number, y: number;
      if (layout === "grid") {
        const cols = Math.ceil(Math.sqrt(n * (w / h)));
        const rows = Math.ceil(n / cols);
        const cw = w / cols;
        const ch = h / rows;
        x = (i % cols) * cw + cw / 2 + rand(-cw * 0.3, cw * 0.3, rng) * noiseInfluence;
        y =
          Math.floor(i / cols) * ch +
          ch / 2 +
          rand(-ch * 0.3, ch * 0.3, rng) * noiseInfluence;
      } else if (layout === "radial") {
        const rings = Math.ceil(Math.sqrt(n / 3));
        const ring = Math.floor(rng() * rings);
        const r = (ring / rings) * Math.min(w, h) * 0.45 + rand(-15, 15, rng);
        const a = rand(0, TAU, rng);
        x = w / 2 + Math.cos(a) * r;
        y = h / 2 + Math.sin(a) * r;
      } else if (layout === "noise") {
        let bx: number, by: number, att = 0;
        do {
          bx = rand(0, w, rng);
          by = rand(0, h, rng);
          att++;
        } while (noise(bx * noiseScale * 0.01, by * noiseScale * 0.01) < rng() * 0.65 && att < 20);
        x = bx;
        y = by;
      } else if (layout === "cluster") {
        const cl = pick(clusters, rng);
        const a = rand(0, TAU, rng);
        const d = rand(0, cl.spread, rng) * rng();
        x = cl.x + Math.cos(a) * d;
        y = cl.y + Math.sin(a) * d;
      } else if (layout === "burst") {
        // Dense in center, sparse at edges — power-curve radial distribution
        const a = rand(0, TAU, rng);
        const maxR = Math.min(w, h) * 0.48;
        const r = maxR * Math.pow(rng(), 0.35); // heavily center-weighted
        x = w / 2 + Math.cos(a) * r + rand(-10, 10, rng);
        y = h / 2 + Math.sin(a) * r + rand(-10, 10, rng);
      } else {
        x = rand(-30, w + 30, rng);
        y = rand(-30, h + 30, rng);
      }

      // Noise modulation
      const nv = noise(x * noiseScale * 0.008, y * noiseScale * 0.008);
      const nv2 = noise(x * noiseScale * 0.012 + 100, y * noiseScale * 0.012 + 100);
      const flowAngle = nv * TAU * 2;
      x += Math.cos(flowAngle) * noiseInfluence * 45;
      y += Math.sin(flowAngle) * noiseInfluence * 45;

      // Color
      let color: HSLTuple;
      if (colorStrategy === "noise") {
        const idx = Math.floor(nv * palette.length) % palette.length;
        const nxt = (idx + 1) % palette.length;
        const bl = (nv * palette.length) % 1;
        color = [
          lerp(palette[idx]![0], palette[nxt]![0], bl),
          lerp(palette[idx]![1], palette[nxt]![1], bl),
          lerp(palette[idx]![2], palette[nxt]![2], bl),
        ];
      } else if (colorStrategy === "field") {
        const atrs = palette.map((c, j) => ({
          x: (((j * 137.5) % 360) / 360) * w,
          y: (((j * 97.3 + 50) % 360) / 360) * h,
          c,
        }));
        let tw = 0;
        const bl: HSLTuple = [0, 0, 0];
        atrs.forEach((a) => {
          const d = Math.hypot(x - a.x, y - a.y);
          const inf = 1 / (1 + d * 0.004);
          bl[0] += a.c[0] * inf;
          bl[1] += a.c[1] * inf;
          bl[2] += a.c[2] * inf;
          tw += inf;
        });
        color = [bl[0] / tw, bl[1] / tw, bl[2] / tw];
      } else {
        color = getColor();
      }

      // Oscillator
      const osc = Math.sin(t * oscillatorFreq * TAU) * oscillatorAmp;
      const baseSize = lerp(sizeMin, sizeMax, rng()) * (0.8 + nv2 * 0.5);
      const size = Math.max(2, baseSize + osc * 20);
      const opacity = clamp(
        lerp(opacityMin, opacityMax, rng()) * layerOp + osc * 0.08,
        0.02,
        1,
      );
      const rot =
        flowAngle * rotationSpread + (rng() - 0.5) * (1 - rotationSpread) * TAU;
      const isStrokeOnly = rng() < strokeRatio;
      const elLw = rand(0.8, 2.5, rng);

      els.push({
        shape,
        x,
        y,
        rot,
        size,
        color,
        opacity,
        strokeOnly: isStrokeOnly,
        lw: elLw,
      });

      // Symmetry
      if (symmetryMode === "bilateral" || symmetryMode === "quad") {
        els.push({ shape, x: w - x, y, rot: -rot, size, color, opacity, strokeOnly: isStrokeOnly, lw: elLw });
      }
      if (symmetryMode === "quad") {
        els.push({ shape, x, y: h - y, rot: -rot, size, color, opacity, strokeOnly: isStrokeOnly, lw: elLw });
        els.push({ shape, x: w - x, y: h - y, rot, size, color, opacity, strokeOnly: isStrokeOnly, lw: elLw });
      }
      if (symmetryMode === "rotational") {
        const cx2 = w / 2;
        const cy2 = h / 2;
        for (let s = 1; s < 4; s++) {
          const a = (s / 4) * TAU;
          const dx = x - cx2;
          const dy = y - cy2;
          els.push({
            shape,
            x: cx2 + dx * Math.cos(a) - dy * Math.sin(a),
            y: cy2 + dx * Math.sin(a) + dy * Math.cos(a),
            rot: rot + a,
            size,
            color,
            opacity,
            strokeOnly: isStrokeOnly,
            lw: elLw,
          });
        }
      }
    }

    // Depth sort
    els.sort((a, b) => a.size - b.size);
    els.forEach((el) => renderEl(ctx, el, lightRad, lightIntensity, gradientShapes, outlineWeight));
  }

  // Bead chains
  const chainCount = Math.round(beadChains * 8);
  for (let i = 0; i < chainCount; i++) {
    drawBeadChain(ctx, rng, noise, w, h, getColor(), lightRad, lightIntensity, gradientShapes);
  }

  // Tangled lines
  const tangleCount = Math.round(tangles * 12);
  if (tangleCount > 0) drawTangles(ctx, rng, noise, w, h, palette, tangleCount, outlineWeight);

  // Typographic scatter
  const typoCount = Math.round(typoScatter * 80);
  if (typoCount > 0) drawTypoScatter(ctx, rng, w, h, palette, typoCount);

  // Atmosphere: front layer (ribbons weave over composition)
  if (atmoRibbons > 0) drawRibbons(ctx, rng, w, h, palette, atmoRibbons);
}
