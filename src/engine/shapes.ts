import type { RNG, Shape } from "../types";
import { rand, randInt, TAU } from "../utils/math";

export function makeShape(rng: RNG, complex: number, organic: number): Shape {
  const t = rng();
  if (t < 0.14) return { type: "circle" };
  if (t < 0.24) {
    const sides = randInt(3, 3 + Math.floor(complex * 8), rng);
    const pts: [number, number][] = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * TAU - Math.PI / 2;
      const w = 1 + (rng() - 0.5) * organic * 0.6;
      pts.push([Math.cos(a) * w, Math.sin(a) * w]);
    }
    return { type: "poly", pts };
  }
  if (t < 0.34) {
    const arms = randInt(3, 6 + Math.floor(complex * 5), rng);
    const inner = rand(0.25, 0.5, rng);
    const pts: [number, number][] = [];
    for (let i = 0; i < arms * 2; i++) {
      const a = (i / (arms * 2)) * TAU - Math.PI / 2;
      const r = i % 2 === 0 ? 1 : inner;
      pts.push([
        Math.cos(a) * r * (1 + (rng() - 0.5) * organic * 0.3),
        Math.sin(a) * r * (1 + (rng() - 0.5) * organic * 0.3),
      ]);
    }
    return { type: "poly", pts };
  }
  if (t < 0.44) {
    const segs = randInt(3, 5 + Math.floor(complex * 3), rng);
    const cp = [];
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * TAU;
      const na = ((i + 1) / segs) * TAU;
      const ma = (a + na) / 2;
      cp.push({
        x: Math.cos(a) * (1 + (rng() - 0.5) * organic),
        y: Math.sin(a) * (1 + (rng() - 0.5) * organic),
        cpx: Math.cos(ma) * rand(0.5, 1.4, rng) * (0.4 + organic * 0.6),
        cpy: Math.sin(ma) * rand(0.5, 1.4, rng) * (0.4 + organic * 0.6),
      });
    }
    return { type: "blob", cp };
  }
  if (t < 0.52) {
    const rc = randInt(2, 3 + Math.floor(complex * 3), rng);
    return {
      type: "rings",
      rings: Array.from({ length: rc }, (_, i) => ({
        r: (i + 1) / rc,
        lw: rand(0.02, 0.07, rng),
      })),
    };
  }
  if (t < 0.60) {
    const rc = randInt(2, 5, rng);
    return { type: "target", rings: rc };
  }
  if (t < 0.66) {
    const pts: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      pts.push([Math.cos(a), Math.sin(a)]);
    }
    return { type: "poly", pts };
  }
  if (t < 0.72) {
    return { type: "cross", thick: rand(0.1, 0.25, rng) };
  }
  // Cloud cluster — group of overlapping circles forming a bubbly shape
  if (t < 0.86) {
    const count = randInt(3, 6 + Math.floor(complex * 4), rng);
    const circles: { cx: number; cy: number; r: number }[] = [];
    // Start with a central circle
    circles.push({ cx: 0, cy: 0, r: rand(0.4, 0.7, rng) });
    for (let i = 1; i < count; i++) {
      // Place each circle adjacent to an existing one
      const parent = circles[Math.floor(rng() * circles.length)]!;
      const angle = rand(0, TAU, rng);
      const r = rand(0.25, 0.65, rng) * (1 + organic * 0.3);
      const dist = parent.r + r * rand(0.3, 0.7, rng);
      circles.push({
        cx: parent.cx + Math.cos(angle) * dist,
        cy: parent.cy + Math.sin(angle) * dist,
        r,
      });
    }
    return { type: "cloudCluster", circles };
  }
  // Petal / leaf — teardrop shape
  return {
    type: "petal",
    bulge: rand(0.4, 0.9, rng) * (0.6 + organic * 0.4),
    taper: rand(0.15, 0.4, rng),
  };
}
