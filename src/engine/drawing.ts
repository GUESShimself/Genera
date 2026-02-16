import type { HSLTuple, BrushType, DrawPoint, PaletteMode } from "../types";
import { createRNG, rand, pick, TAU } from "../utils/math";
import { hsl, genPalette, colorPool } from "../utils/color";
import { makeShape } from "./shapes";
import { renderEl } from "./renderer";

export interface BrushContext {
  brushType: BrushType;
  brushSize: number;
  opacity: number;
  palette: HSLTuple[];
  complexity: number;
  organicness: number;
  lightAngle: number;
  lightIntensity: number;
  gradientShapes: boolean;
  isDark: boolean;
}

// ─── Point interpolation ────────────────────────────────────────────
export function interpolatePoints(
  from: DrawPoint,
  to: DrawPoint,
  spacing: number,
): DrawPoint[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < spacing) return [to];

  const steps = Math.ceil(dist / spacing);
  const pts: DrawPoint[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    pts.push({ x: from.x + dx * t, y: from.y + dy * t });
  }
  return pts;
}

// ─── Scatter Brush ──────────────────────────────────────────────────
function paintScatter(
  ctx: CanvasRenderingContext2D,
  point: DrawPoint,
  bc: BrushContext,
  seed: number,
): void {
  const rng = createRNG(seed);
  const getColor = colorPool(bc.palette, rng);
  const shapeCount = Math.max(1, Math.round(1 + rng() * 2));
  const lightRad = (bc.lightAngle / 360) * TAU;

  for (let i = 0; i < shapeCount; i++) {
    const shape = makeShape(rng, bc.complexity, bc.organicness);
    const size = bc.brushSize * rand(0.3, 1, rng);
    const offsetX = (rng() - 0.5) * bc.brushSize * 0.5;
    const offsetY = (rng() - 0.5) * bc.brushSize * 0.5;

    renderEl(
      ctx,
      {
        shape,
        x: point.x + offsetX,
        y: point.y + offsetY,
        rot: rand(0, TAU, rng),
        size,
        color: getColor(),
        opacity: bc.opacity * rand(0.5, 1, rng),
        strokeOnly: rng() < 0.2,
        lw: rand(0.8, 2.5, rng),
      },
      lightRad,
      bc.lightIntensity,
      bc.gradientShapes,
    );
  }
}

// ─── Bead Chain Brush ───────────────────────────────────────────────
function paintChain(
  ctx: CanvasRenderingContext2D,
  point: DrawPoint,
  bc: BrushContext,
  seed: number,
): void {
  const rng = createRNG(seed);
  const c = pick(bc.palette, rng);
  const [ch, cs, cl] = c;
  const beadSize = bc.brushSize * rand(0.08, 0.2, rng);

  ctx.save();
  ctx.globalAlpha = bc.opacity * rand(0.6, 1, rng);

  if (bc.gradientShapes) {
    const lightRad = (bc.lightAngle / 360) * TAU;
    const offX = Math.cos(lightRad) * beadSize * 0.2 * bc.lightIntensity;
    const offY = Math.sin(lightRad) * beadSize * 0.2 * bc.lightIntensity;
    const g = ctx.createRadialGradient(
      point.x + offX, point.y + offY, 0,
      point.x, point.y, beadSize,
    );
    g.addColorStop(0, hsl(ch, cs, Math.min(97, cl + 20)));
    g.addColorStop(1, hsl(ch, cs * 0.8, Math.max(10, cl - 10)));
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = hsl(ch, cs, cl);
  }

  ctx.beginPath();
  ctx.arc(point.x, point.y, beadSize * (0.7 + rng() * 0.3), 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ─── Spray Brush ────────────────────────────────────────────────────
function paintSpray(
  ctx: CanvasRenderingContext2D,
  point: DrawPoint,
  bc: BrushContext,
  seed: number,
): void {
  const rng = createRNG(seed);
  const count = Math.max(3, Math.round(bc.brushSize * 0.3));
  const radius = bc.brushSize / 2;

  for (let i = 0; i < count; i++) {
    const angle = rand(0, TAU, rng);
    const dist = rand(0, radius, rng) * rng(); // bias toward center
    const px = point.x + Math.cos(angle) * dist;
    const py = point.y + Math.sin(angle) * dist;
    const c = pick(bc.palette, rng);
    const dotSize = rand(1, 4, rng);

    ctx.save();
    ctx.globalAlpha = bc.opacity * rand(0.15, 0.5, rng);
    ctx.fillStyle = hsl(c[0], c[1], c[2]);
    ctx.beginPath();
    ctx.arc(px, py, dotSize, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
}

// ─── Eraser ─────────────────────────────────────────────────────────
function paintEraser(
  ctx: CanvasRenderingContext2D,
  point: DrawPoint,
  bc: BrushContext,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.globalAlpha = bc.opacity;
  ctx.beginPath();
  ctx.arc(point.x, point.y, bc.brushSize / 2, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ─── Main brush dispatch ────────────────────────────────────────────
let _pointSeed = 0;

export function resetPointSeed(): void {
  _pointSeed = Math.floor(Math.random() * 999999);
}

export function paintAtPoint(
  ctx: CanvasRenderingContext2D,
  point: DrawPoint,
  bc: BrushContext,
): void {
  _pointSeed++;
  switch (bc.brushType) {
    case "scatter":
      paintScatter(ctx, point, bc, _pointSeed);
      break;
    case "chain":
      paintChain(ctx, point, bc, _pointSeed);
      break;
    case "spray":
      paintSpray(ctx, point, bc, _pointSeed);
      break;
    case "eraser":
      paintEraser(ctx, point, bc);
      break;
  }
}

// ─── Palette helper for drawing ─────────────────────────────────────
export function getPaletteForDrawing(paletteMode: PaletteMode, seed: number): HSLTuple[] {
  const rng = createRNG(seed);
  return genPalette(rng, paletteMode);
}
