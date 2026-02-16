import type { RNG, NoiseFn, HSLTuple } from "../types";
import { hsl } from "../utils/color";
import { rand, randInt, pick, clamp, TAU } from "../utils/math";

// ─── Bead Chain Trail ────────────────────────────────────────────────
export function drawBeadChain(
  ctx: CanvasRenderingContext2D,
  rng: RNG,
  noise: NoiseFn,
  w: number,
  h: number,
  color: HSLTuple,
  lightAngle: number,
  lightIntensity: number,
  gradientShapes: boolean,
): void {
  const [ch, cs, cl] = color;
  const startX = rand(0, w, rng);
  const startY = rand(0, h, rng);
  const beadCount = randInt(15, 80, rng);
  const beadSize = rand(2, 6, rng);
  const spacing = rand(5, 12, rng);
  const baseAngle = rand(0, TAU, rng);
  const curvature = rand(0.02, 0.12, rng);

  let cx = startX;
  let cy = startY;
  let angle = baseAngle;

  for (let i = 0; i < beadCount; i++) {
    const n = noise(cx * 0.008, cy * 0.008);
    angle += (n - 0.5) * curvature * 2;

    ctx.save();
    ctx.globalAlpha = clamp(0.6 + (i / beadCount) * 0.3, 0, 1);

    if (gradientShapes) {
      const offX = Math.cos(lightAngle) * beadSize * 0.2 * lightIntensity;
      const offY = Math.sin(lightAngle) * beadSize * 0.2 * lightIntensity;
      const g = ctx.createRadialGradient(cx + offX, cy + offY, 0, cx, cy, beadSize);
      g.addColorStop(0, hsl(ch, cs, Math.min(97, cl + 20)));
      g.addColorStop(1, hsl(ch, cs * 0.8, Math.max(10, cl - 10)));
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = hsl(ch, cs, cl);
    }

    ctx.beginPath();
    ctx.arc(cx, cy, beadSize * (0.6 + rng() * 0.4), 0, TAU);
    ctx.fill();
    ctx.restore();

    cx += Math.cos(angle) * spacing;
    cy += Math.sin(angle) * spacing;
  }
}

// ─── Tangled Lines ──────────────────────────────────────────────────
export function drawTangles(
  ctx: CanvasRenderingContext2D,
  rng: RNG,
  noise: NoiseFn,
  w: number,
  h: number,
  palette: HSLTuple[],
  count: number,
  outlineWeight: number,
): void {
  for (let i = 0; i < count; i++) {
    const color = pick(palette, rng);
    const [ch, cs, cl] = color;

    // Each tangle is a flowing bezier path with many segments
    const segs = randInt(8, 30, rng);
    let cx = rand(w * -0.1, w * 1.1, rng);
    let cy = rand(h * -0.1, h * 1.1, rng);
    let angle = rand(0, TAU, rng);

    const lineWidth = rand(0.5, 2.5 + outlineWeight * 2, rng);
    const drift = rand(30, 120, rng);

    ctx.save();
    ctx.globalAlpha = clamp(rand(0.3, 0.85, rng), 0, 1);
    ctx.strokeStyle = hsl(ch, cs * 0.9, cl);
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy);

    for (let j = 0; j < segs; j++) {
      const nv = noise(cx * 0.006, cy * 0.006);
      angle += (nv - 0.5) * 1.8 + (rng() - 0.5) * 0.6;

      const stepLen = drift * (0.5 + rng());
      const cp1x = cx + Math.cos(angle + rng() * 0.8) * stepLen * 0.6;
      const cp1y = cy + Math.sin(angle + rng() * 0.8) * stepLen * 0.6;
      const nx = cx + Math.cos(angle) * stepLen;
      const ny = cy + Math.sin(angle) * stepLen;
      const cp2x = nx - Math.cos(angle + rng() * 0.8) * stepLen * 0.3;
      const cp2y = ny - Math.sin(angle + rng() * 0.8) * stepLen * 0.3;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, nx, ny);
      cx = nx;
      cy = ny;
    }
    ctx.stroke();

    // Optionally add a darker outline pass for the Davis style
    if (outlineWeight > 0.2) {
      ctx.strokeStyle = hsl(ch, cs * 0.6, Math.max(5, cl - 20));
      ctx.lineWidth = lineWidth + outlineWeight * 1.5;
      ctx.globalAlpha *= 0.3;
      ctx.stroke();
    }

    ctx.restore();

    // Scatter small nodes/dots at some vertices
    const nodeChance = 0.3 + outlineWeight * 0.3;
    cx = rand(w * -0.1, w * 1.1, rng);
    cy = rand(h * -0.1, h * 1.1, rng);
    angle = rand(0, TAU, rng);
    for (let j = 0; j < segs; j++) {
      const nv = noise(cx * 0.006, cy * 0.006);
      angle += (nv - 0.5) * 1.8 + (rng() - 0.5) * 0.6;
      const stepLen = drift * (0.5 + rng());
      cx += Math.cos(angle) * stepLen;
      cy += Math.sin(angle) * stepLen;

      if (rng() < nodeChance) {
        const nr = rand(1.5, 5, rng);
        ctx.save();
        ctx.globalAlpha = rand(0.4, 0.9, rng);
        ctx.beginPath();
        ctx.arc(cx, cy, nr, 0, TAU);
        ctx.fillStyle = hsl(ch, cs, Math.min(95, cl + 15));
        ctx.fill();
        if (outlineWeight > 0) {
          ctx.strokeStyle = hsl(ch, cs * 0.7, Math.max(5, cl - 20));
          ctx.lineWidth = Math.max(0.3, outlineWeight);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }
}

// ─── Typographic Scatter ─────────────────────────────────────────────
export function drawTypoScatter(
  ctx: CanvasRenderingContext2D,
  rng: RNG,
  w: number,
  h: number,
  palette: HSLTuple[],
  count: number,
): void {
  const chars = ["×", "+", "•", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const sizes = [8, 10, 12, 14, 18, 22, 28];

  for (let i = 0; i < count; i++) {
    const x = rand(-20, w + 20, rng);
    const y = rand(-20, h + 20, rng);
    const char = pick(chars, rng);
    const sz = pick(sizes, rng);
    const c = pick(palette, rng);
    const op = rand(0.15, 0.65, rng);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rand(-0.4, 0.4, rng));
    ctx.globalAlpha = op;
    ctx.font = `${sz}px 'DM Mono', monospace`;
    ctx.fillStyle = hsl(c[0], c[1], c[2]);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
}
