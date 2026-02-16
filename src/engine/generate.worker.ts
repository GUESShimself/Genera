import { generate } from "./generate";
import type { Params } from "../types";

interface GenerateMessage {
  id: number;
  w: number;
  h: number;
  params: Params;
  seed: number;
}

self.onmessage = (e: MessageEvent<GenerateMessage>) => {
  const { id, w, h, params, seed } = e.data;

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // OffscreenCanvasRenderingContext2D has the same Canvas 2D API surface
  generate(ctx as unknown as CanvasRenderingContext2D, w, h, params, seed);

  const bitmap = canvas.transferToImageBitmap();
  (postMessage as (msg: unknown, transfer: Transferable[]) => void)(
    { id, bitmap },
    [bitmap],
  );
};
