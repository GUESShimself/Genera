import type { Element } from "../types";
import { hsl } from "../utils/color";
import { clamp, TAU } from "../utils/math";

export function renderEl(
  ctx: CanvasRenderingContext2D,
  el: Element,
  lightAngle: number,
  lightIntensity: number,
  gradientShapes: boolean,
  outlineWeight: number = 0,
): void {
  const { shape, x, y, rot, size, color, opacity, strokeOnly, lw } = el;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = clamp(opacity, 0, 1);

  const [h, s, l] = color;
  const half = size / 2;

  const lightDx = Math.cos(lightAngle);
  const lightDy = Math.sin(lightAngle);
  const highlightL = Math.min(97, l + lightIntensity * 25);
  const shadowL = Math.max(5, l - lightIntensity * 20);

  // Fill+stroke combined (Davis style outlines)
  const drawOutline = outlineWeight > 0 && !strokeOnly;
  const outlineLw = Math.max(0.5, outlineWeight * 3);
  const outlineColor = hsl(h, s * 0.7, Math.max(5, l - 25));

  const makeFill = (): string | CanvasGradient => {
    if (!gradientShapes || strokeOnly) return hsl(h, s, l);
    const offX = lightDx * half * 0.3 * lightIntensity;
    const offY = lightDy * half * 0.3 * lightIntensity;
    const grad = ctx.createRadialGradient(offX, offY, 0, 0, 0, half);
    grad.addColorStop(0, hsl(h, Math.min(100, s * 1.1), highlightL));
    grad.addColorStop(0.5, hsl(h, s, l));
    grad.addColorStop(1, hsl(h, s * 0.8, shadowL));
    return grad;
  };

  const makeStroke = () => hsl(h, s, Math.min(90, l + 12));

  const fillAndOutline = () => {
    if (strokeOnly) {
      ctx.strokeStyle = makeStroke();
      ctx.lineWidth = lw;
      ctx.stroke();
    } else {
      ctx.fillStyle = makeFill();
      ctx.fill();
      if (drawOutline) {
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = outlineLw;
        ctx.stroke();
      }
    }
  };

  if (shape.type === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, half, 0, TAU);
    fillAndOutline();
  } else if (shape.type === "poly") {
    ctx.beginPath();
    shape.pts.forEach(([px, py], i) =>
      i === 0 ? ctx.moveTo(px * half, py * half) : ctx.lineTo(px * half, py * half),
    );
    ctx.closePath();
    fillAndOutline();
  } else if (shape.type === "blob") {
    ctx.beginPath();
    ctx.moveTo(shape.cp[0]!.x * half, shape.cp[0]!.y * half);
    for (let i = 0; i < shape.cp.length; i++) {
      const n = shape.cp[(i + 1) % shape.cp.length]!;
      ctx.quadraticCurveTo(
        shape.cp[i]!.cpx * half,
        shape.cp[i]!.cpy * half,
        n.x * half,
        n.y * half,
      );
    }
    ctx.closePath();
    fillAndOutline();
  } else if (shape.type === "rings") {
    shape.rings.forEach((ring) => {
      ctx.beginPath();
      ctx.arc(0, 0, ring.r * half, 0, TAU);
      ctx.strokeStyle = hsl(h, s, l);
      ctx.lineWidth = ring.lw * size;
      ctx.stroke();
    });
  } else if (shape.type === "target") {
    for (let i = shape.rings; i >= 1; i--) {
      const r = (i / shape.rings) * half;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      const tl = i % 2 === 0 ? Math.min(95, l + 20) : Math.max(10, l - 15);
      if (gradientShapes && !strokeOnly) {
        const offX = lightDx * r * 0.2 * lightIntensity;
        const offY = lightDy * r * 0.2 * lightIntensity;
        const g = ctx.createRadialGradient(offX, offY, 0, 0, 0, r);
        g.addColorStop(0, hsl(h, s, Math.min(97, tl + lightIntensity * 15)));
        g.addColorStop(1, hsl(h, s * 0.9, tl));
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = hsl(h, s, tl);
      }
      ctx.fill();
      ctx.strokeStyle = hsl(h, s * 0.6, Math.max(5, tl - 10));
      ctx.lineWidth = drawOutline ? outlineLw : 0.8;
      ctx.stroke();
    }
  } else if (shape.type === "cross") {
    const t = shape.thick * size;
    ctx.fillStyle = hsl(h, s, l);
    ctx.fillRect(-half, -t / 2, size, t);
    ctx.fillRect(-t / 2, -half, t, size);
    if (drawOutline) {
      ctx.strokeStyle = outlineColor;
      ctx.lineWidth = outlineLw;
      ctx.strokeRect(-half, -t / 2, size, t);
      ctx.strokeRect(-t / 2, -half, t, size);
    }
  } else if (shape.type === "cloudCluster") {
    const fill = makeFill();
    for (const c of shape.circles) {
      ctx.beginPath();
      ctx.arc(c.cx * half, c.cy * half, c.r * half, 0, TAU);
      if (strokeOnly) {
        ctx.strokeStyle = makeStroke();
        ctx.lineWidth = lw;
        ctx.stroke();
      } else {
        ctx.fillStyle = fill;
        ctx.fill();
        // Cloud clusters always get outlines for the bubbly Davis look
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = Math.max(0.5, outlineLw * 0.7);
        ctx.stroke();
      }
    }
  } else if (shape.type === "petal") {
    const tipY = -half;
    const baseY = half * shape.taper;
    const bulgeX = half * shape.bulge;
    ctx.beginPath();
    ctx.moveTo(0, tipY);
    ctx.bezierCurveTo(bulgeX * 0.6, tipY * 0.5, bulgeX, baseY * 0.2, 0, baseY);
    ctx.bezierCurveTo(-bulgeX, baseY * 0.2, -bulgeX * 0.6, tipY * 0.5, 0, tipY);
    ctx.closePath();
    fillAndOutline();
  }

  ctx.restore();
}
