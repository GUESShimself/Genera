import { useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import type { BrushType, HSLTuple, DrawPoint } from "../types";
import { interpolatePoints, paintAtPoint, resetPointSeed } from "../engine/drawing";
import type { BrushContext } from "../engine/drawing";

export interface DrawCanvasHandle {
  undo: () => void;
  clear: () => void;
}

interface DrawCanvasProps {
  width: number;
  height: number;
  zoom: number;
  pan: { x: number; y: number };
  active: boolean;
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

const MAX_UNDO = 20;

export const DrawCanvas = forwardRef<DrawCanvasHandle, DrawCanvasProps>(
  function DrawCanvas(props, ref) {
    const {
      width, height, zoom, pan, active,
      brushType, brushSize, opacity, palette,
      complexity, organicness, lightAngle, lightIntensity,
      gradientShapes, isDark,
    } = props;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const undoStack = useRef<ImageData[]>([]);
    const isDrawing = useRef(false);
    const lastPoint = useRef<DrawPoint | null>(null);

    // Resize canvas when dimensions change
    useEffect(() => {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = window.devicePixelRatio || 1;

      // Save current content before resize
      const ctx = c.getContext("2d", { willReadFrequently: true });
      let savedData: ImageData | null = null;
      if (ctx && c.width > 0 && c.height > 0) {
        savedData = ctx.getImageData(0, 0, c.width, c.height);
      }

      c.width = width * dpr;
      c.height = height * dpr;

      if (ctx) {
        ctx.scale(dpr, dpr);
        // Restore saved content if dimensions match
        if (savedData && savedData.width === c.width && savedData.height === c.height) {
          ctx.putImageData(savedData, 0, 0);
        }
      }
    }, [width, height]);

    const getCtx = useCallback(() => {
      const c = canvasRef.current;
      if (!c) return null;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      return ctx;
    }, []);

    const saveUndoSnapshot = useCallback(() => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      const data = ctx.getImageData(0, 0, c.width, c.height);
      undoStack.current.push(data);
      if (undoStack.current.length > MAX_UNDO) {
        undoStack.current.shift();
      }
    }, []);

    useImperativeHandle(ref, () => ({
      undo: () => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        const snap = undoStack.current.pop();
        if (snap) {
          ctx.putImageData(snap, 0, 0);
        }
      },
      clear: () => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        saveUndoSnapshot();
        ctx.clearRect(0, 0, width, height);
        undoStack.current = [];
      },
    }), [width, height, saveUndoSnapshot]);

    // Convert pointer coords to canvas-space (accounting for zoom/pan)
    const pointerToCanvas = useCallback(
      (e: React.PointerEvent): DrawPoint => {
        const c = canvasRef.current;
        if (!c) return { x: 0, y: 0 };
        const rect = c.getBoundingClientRect();
        // Pointer position relative to the canvas element's display area
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        // Account for zoom and pan: the canvas content is transformed
        // Display coords → canvas content coords
        const canvasX = (px - width / 2 - pan.x) / zoom + width / 2;
        const canvasY = (py - height / 2 - pan.y) / zoom + height / 2;
        return { x: canvasX, y: canvasY };
      },
      [width, height, zoom, pan],
    );

    const makeBrushContext = useCallback((): BrushContext => ({
      brushType,
      brushSize: brushSize / zoom, // Scale brush with zoom so it feels consistent
      opacity,
      palette,
      complexity,
      organicness,
      lightAngle,
      lightIntensity,
      gradientShapes,
      isDark,
    }), [brushType, brushSize, zoom, opacity, palette, complexity, organicness, lightAngle, lightIntensity, gradientShapes, isDark]);

    const handlePointerDown = useCallback(
      (e: React.PointerEvent) => {
        if (!active) return;
        // Allow ctrl/cmd+drag for panning even in draw mode
        if (e.ctrlKey || e.metaKey) return;
        if (e.button !== 0) return;

        e.preventDefault();
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        isDrawing.current = true;
        resetPointSeed();
        saveUndoSnapshot();

        const ctx = getCtx();
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.scale(1, 1);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.restore();

        const point = pointerToCanvas(e);
        lastPoint.current = point;

        // Apply zoom transform for drawing
        ctx.save();
        ctx.resetTransform();
        const d = window.devicePixelRatio || 1;
        ctx.scale(d, d);

        const bc = makeBrushContext();
        paintAtPoint(ctx, point, bc);
        ctx.restore();
      },
      [active, saveUndoSnapshot, getCtx, pointerToCanvas, makeBrushContext],
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent) => {
        if (!isDrawing.current || !active) return;
        if (e.ctrlKey || e.metaKey) return;

        const ctx = getCtx();
        if (!ctx) return;

        const point = pointerToCanvas(e);
        const bc = makeBrushContext();
        const spacing = Math.max(2, bc.brushSize * 0.3);

        if (lastPoint.current) {
          const pts = interpolatePoints(lastPoint.current, point, spacing);

          ctx.save();
          ctx.resetTransform();
          const d = window.devicePixelRatio || 1;
          ctx.scale(d, d);

          for (const p of pts) {
            paintAtPoint(ctx, p, bc);
          }
          ctx.restore();
        }

        lastPoint.current = point;
      },
      [active, getCtx, pointerToCanvas, makeBrushContext],
    );

    const handlePointerUp = useCallback(() => {
      isDrawing.current = false;
      lastPoint.current = null;
    }, []);

    return (
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          borderRadius: 2,
          pointerEvents: active ? "auto" : "none",
          cursor: active ? "crosshair" : "default",
          touchAction: "none",
        }}
      />
    );
  },
);
