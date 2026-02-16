import type { RNG, HSLTuple } from "../types";
import { hsla } from "../utils/color";
import { rand, randInt, pick, TAU, lerp } from "../utils/math";

// ─── Soft Clouds ────────────────────────────────────────────────────
export function drawClouds(
  ctx: CanvasRenderingContext2D,
  rng: RNG,
  w: number,
  h: number,
  palette: HSLTuple[],
  intensity: number,
): void {
  const count = Math.round(intensity * 8);
  const minDim = Math.min(w, h);
  const maxDim = Math.max(w, h);

  for (let i = 0; i < count; i++) {
    const c = pick(palette, rng);
    const cx = rand(w * -0.1, w * 1.1, rng);
    const cy = rand(h * -0.1, h * 1.1, rng);
    const radius = rand(minDim * 0.2, maxDim * 0.6, rng);
    const alpha = rand(0.06, 0.18, rng) * intensity;
    const sat = c[1] * 0.4;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(0, hsla(c[0], sat, c[2], alpha));
    grad.addColorStop(0.4, hsla(c[0], sat * 0.8, c[2], alpha * 0.6));
    grad.addColorStop(0.7, hsla(c[0], sat * 0.5, c[2], alpha * 0.2));
    grad.addColorStop(1, "transparent");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}

// ─── Aurora Ribbons ─────────────────────────────────────────────────
export function drawRibbons(
  ctx: CanvasRenderingContext2D,
  rng: RNG,
  w: number,
  h: number,
  palette: HSLTuple[],
  intensity: number,
): void {
  const count = Math.round(intensity * 5);

  for (let i = 0; i < count; i++) {
    const c = pick(palette, rng);
    const sat = c[1] * 0.5;
    const baseWidth = rand(20, 80, rng);
    const cpCount = randInt(3, 5, rng);

    // Generate bezier control points spanning the canvas
    const pts: { x: number; y: number }[] = [];
    for (let j = 0; j < cpCount; j++) {
      pts.push({
        x: rand(w * -0.1, w * 1.1, rng),
        y: rand(h * -0.1, h * 1.1, rng),
      });
    }

    // Multiple overlapping passes for soft glow
    const passes = randInt(5, 8, rng);
    for (let p = 0; p < passes; p++) {
      const passOpacity = lerp(0.12, 0.02, p / passes) * intensity;
      const passWidth = baseWidth * lerp(0.3, 2.5, p / passes);

      ctx.save();
      ctx.globalAlpha = passOpacity;
      ctx.lineWidth = passWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = hsla(c[0], sat, c[2], 1);

      // First pass gets shadow blur for extra softness
      if (p === 0) {
        ctx.shadowBlur = rand(20, 60, rng);
        ctx.shadowColor = hsla(c[0], sat, c[2], 0.3);
      }

      ctx.beginPath();
      ctx.moveTo(pts[0]!.x, pts[0]!.y);

      if (pts.length === 3) {
        ctx.quadraticCurveTo(pts[1]!.x, pts[1]!.y, pts[2]!.x, pts[2]!.y);
      } else {
        // Use pairs of points as control + end points for bezier curves
        for (let j = 1; j < pts.length - 1; j += 2) {
          const cp = pts[j]!;
          const end = pts[j + 1] ?? pts[j]!;
          ctx.quadraticCurveTo(cp.x, cp.y, end.x, end.y);
        }
        // If odd remaining point, line to it
        if (pts.length % 2 === 0) {
          const last = pts[pts.length - 1]!;
          ctx.lineTo(last.x, last.y);
        }
      }

      ctx.stroke();
      ctx.restore();
    }
  }
}

// ─── Ink Blooms ─────────────────────────────────────────────────────
export function drawBlooms(
  ctx: CanvasRenderingContext2D,
  rng: RNG,
  w: number,
  h: number,
  palette: HSLTuple[],
  intensity: number,
): void {
  const clusterCount = Math.round(intensity * 6);

  for (let i = 0; i < clusterCount; i++) {
    const c = pick(palette, rng);
    const cx = rand(w * 0.05, w * 0.95, rng);
    const cy = rand(h * 0.05, h * 0.95, rng);
    const clusterRadius = rand(30, Math.min(w, h) * 0.2, rng);
    const circleCount = randInt(8, 25, rng);
    const sat = c[1] * 0.5;

    for (let j = 0; j < circleCount; j++) {
      // Gaussian-like distribution: sum of two uniform randoms
      const dx = (rng() + rng() - 1) * clusterRadius;
      const dy = (rng() + rng() - 1) * clusterRadius;
      const r = rand(10, 60, rng);
      const alpha = rand(0.03, 0.08, rng) * intensity;

      const grad = ctx.createRadialGradient(cx + dx, cy + dy, 0, cx + dx, cy + dy, r);
      grad.addColorStop(0, hsla(c[0], sat, c[2], alpha));
      grad.addColorStop(0.5, hsla(c[0], sat * 0.7, c[2], alpha * 0.5));
      grad.addColorStop(1, "transparent");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  }
}

// ─── Volumetric Light Rays ──────────────────────────────────────────
export function drawLightRays(
  ctx: CanvasRenderingContext2D,
  rng: RNG,
  w: number,
  h: number,
  lightAngle: number,
  intensity: number,
): void {
  const count = Math.round(intensity * 12);
  if (count === 0) return;

  const lightRad = (lightAngle / 360) * TAU;
  // Light source position: on the edge of the canvas in the light direction
  const sourceX = w / 2 + Math.cos(lightRad) * Math.max(w, h) * 0.6;
  const sourceY = h / 2 + Math.sin(lightRad) * Math.max(w, h) * 0.6;
  const maxLen = Math.hypot(w, h) * 1.2;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (let i = 0; i < count; i++) {
    // Angle spread around the light direction (rays point inward)
    const rayAngle = lightRad + Math.PI + rand(-0.5, 0.5, rng);
    const spread = rand(0.01, 0.06, rng); // half-angle of the triangle
    const length = rand(maxLen * 0.4, maxLen, rng);
    const alpha = rand(0.02, 0.05, rng) * intensity;

    // Triangle vertices: source, and two points at the far end
    const endX = sourceX + Math.cos(rayAngle) * length;
    const endY = sourceY + Math.sin(rayAngle) * length;
    const leftX = endX + Math.cos(rayAngle + Math.PI / 2) * length * spread;
    const leftY = endY + Math.sin(rayAngle + Math.PI / 2) * length * spread;
    const rightX = endX + Math.cos(rayAngle - Math.PI / 2) * length * spread;
    const rightY = endY + Math.sin(rayAngle - Math.PI / 2) * length * spread;

    // Linear gradient from source (visible) to end (transparent)
    const grad = ctx.createLinearGradient(sourceX, sourceY, endX, endY);
    grad.addColorStop(0, `rgba(255,248,230,${alpha})`);
    grad.addColorStop(0.3, `rgba(255,240,210,${alpha * 0.6})`);
    grad.addColorStop(1, "transparent");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(sourceX, sourceY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}
