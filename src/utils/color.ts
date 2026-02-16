import type { RNG, HSLTuple, PaletteMode } from "../types";
import { rand, randInt, pick } from "./math";

// ─── HSL helpers ─────────────────────────────────────────────────────
export const hsl = (h: number, s: number, l: number): string =>
  `hsl(${h},${s}%,${l}%)`;
export const hsla = (h: number, s: number, l: number, a: number): string =>
  `hsla(${h},${s}%,${l}%,${a})`;

// ─── Color Palette ───────────────────────────────────────────────────
export function genPalette(rng: RNG, mode: PaletteMode): HSLTuple[] {
  const bh = rand(0, 360, rng);
  const m: Record<string, () => HSLTuple[]> = {
    analogous: () =>
      Array.from({ length: 7 }, (_, i) => [
        (bh + i * 20 - 60 + 360) % 360,
        rand(50, 92, rng),
        rand(38, 72, rng),
      ]),
    complementary: () => {
      const c = (bh + 180) % 360;
      return [
        [bh, rand(60, 90, rng), rand(42, 65, rng)],
        [bh, rand(45, 75, rng), rand(58, 78, rng)],
        [c, rand(60, 90, rng), rand(42, 65, rng)],
        [c, rand(45, 75, rng), rand(55, 75, rng)],
        [(bh + 90) % 360, rand(35, 55, rng), rand(50, 70, rng)],
        [(bh + 270) % 360, rand(40, 65, rng), rand(48, 68, rng)],
        [bh, rand(20, 40, rng), rand(15, 30, rng)],
      ];
    },
    triadic: () =>
      [0, 120, 240, 60, 180, 300, 30].map((o) => [
        (bh + o) % 360,
        rand(48, 88, rng),
        rand(40, 68, rng),
      ]),
    warm: () => {
      const hs = [
        rand(0, 15, rng), rand(15, 40, rng), rand(35, 55, rng),
        rand(40, 60, rng), rand(0, 10, rng), rand(45, 65, rng),
        rand(20, 35, rng),
      ];
      return hs.map((h) => [h, rand(55, 95, rng), rand(40, 70, rng)]);
    },
    neon: () =>
      Array.from({ length: 7 }, (_, i) => [
        (bh + i * 51) % 360,
        rand(88, 100, rng),
        rand(50, 64, rng),
      ]),
    mono: () =>
      Array.from({ length: 7 }, (_, i) => [bh, rand(30, 90, rng), 12 + i * 11]),
  };
  return (m[mode] || m["analogous"])!();
}

// Weighted color pool
export function colorPool(colors: HSLTuple[], rng: RNG): () => HSLTuple {
  const ex: HSLTuple[] = [];
  colors.forEach((c) => {
    const w = randInt(1, 6, rng);
    for (let i = 0; i < w; i++) ex.push(c);
  });
  return () => pick(ex, rng);
}
