import type { RNG, HSLTuple, BgStyle } from "../types";
import { hsla } from "../utils/color";
import { rand, randInt, pick, lerp } from "../utils/math";

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  palette: HSLTuple[],
  rng: RNG,
  isDark: boolean,
  bgStyle: BgStyle,
): void {
  if (bgStyle === "flat") {
    ctx.fillStyle = isDark ? "#0c0c0e" : "#f5f2ec";
    ctx.fillRect(0, 0, w, h);
    return;
  }

  ctx.fillStyle = isDark ? "#0c0c0e" : "#f5f2ec";
  ctx.fillRect(0, 0, w, h);

  const points = randInt(2, 4, rng);
  for (let i = 0; i < points; i++) {
    const cx = rand(w * 0.1, w * 0.9, rng);
    const cy = rand(h * 0.1, h * 0.9, rng);
    const radius = rand(Math.min(w, h) * 0.3, Math.max(w, h) * 0.8, rng);
    const c = pick(palette, rng);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    grad.addColorStop(
      0,
      hsla(
        c[0],
        c[1] * 0.6,
        isDark ? c[2] * 0.25 : lerp(c[2], 95, 0.7),
        bgStyle === "subtle" ? 0.15 : 0.35,
      ),
    );
    grad.addColorStop(
      0.6,
      hsla(
        c[0],
        c[1] * 0.3,
        isDark ? c[2] * 0.12 : lerp(c[2], 95, 0.85),
        bgStyle === "subtle" ? 0.06 : 0.15,
      ),
    );
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
}
