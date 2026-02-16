import type { RNG, NoiseFn } from "../types";

// ─── PRNG ────────────────────────────────────────────────────────────
export function createRNG(seed: number): RNG {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── 2D Noise ────────────────────────────────────────────────────────
export function createNoise(seed: number): NoiseFn {
  const rng = createRNG(seed);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [p[i], p[j]] = [p[j]!, p[i]!];
  }
  const perm = [...p, ...p];
  const g2: [number, number][] = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1],
  ];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lrp = (a: number, b: number, t: number) => a + t * (b - a);
  const dot = (g: [number, number], x: number, y: number) => g[0] * x + g[1] * y;

  return (x: number, y: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const u = fade(xf);
    const v = fade(yf);
    const aa = perm[perm[X]! + Y]!;
    const ab = perm[perm[X]! + Y + 1]!;
    const ba = perm[perm[X + 1]! + Y]!;
    const bb = perm[perm[X + 1]! + Y + 1]!;
    return (
      lrp(
        lrp(dot(g2[aa % 8]!, xf, yf), dot(g2[ba % 8]!, xf - 1, yf), u),
        lrp(dot(g2[ab % 8]!, xf, yf - 1), dot(g2[bb % 8]!, xf - 1, yf - 1), u),
        v,
      ) * 0.5 + 0.5
    );
  };
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const rand = (lo: number, hi: number, rng: RNG): number => lerp(lo, hi, rng());
export const randInt = (lo: number, hi: number, rng: RNG): number =>
  Math.floor(rand(lo, hi + 1, rng));
export const pick = <T>(a: T[], rng: RNG): T => a[Math.floor(rng() * a.length)]!;
export const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));
export const TAU = Math.PI * 2;
