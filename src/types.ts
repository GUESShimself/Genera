// ─── Utility Types ──────────────────────────────────────────────────
export type RNG = () => number;
export type NoiseFn = (x: number, y: number) => number;
export type HSLTuple = [h: number, s: number, l: number];

// ─── Shape Types ────────────────────────────────────────────────────
export type ShapeCircle = { type: "circle" };
export type ShapePoly = { type: "poly"; pts: [number, number][] };
export type ShapeBlob = {
  type: "blob";
  cp: { x: number; y: number; cpx: number; cpy: number }[];
};
export type ShapeRings = {
  type: "rings";
  rings: { r: number; lw: number }[];
};
export type ShapeTarget = { type: "target"; rings: number };
export type ShapeCross = { type: "cross"; thick: number };
export type ShapeCloudCluster = {
  type: "cloudCluster";
  circles: { cx: number; cy: number; r: number }[];
};
export type ShapePetal = { type: "petal"; bulge: number; taper: number };

export type Shape =
  | ShapeCircle
  | ShapePoly
  | ShapeBlob
  | ShapeRings
  | ShapeTarget
  | ShapeCross
  | ShapeCloudCluster
  | ShapePetal;

// ─── Render Element ─────────────────────────────────────────────────
export interface Element {
  shape: Shape;
  x: number;
  y: number;
  rot: number;
  size: number;
  color: HSLTuple;
  opacity: number;
  strokeOnly: boolean;
  lw: number;
}

// ─── Drawing Types ──────────────────────────────────────────────────
export type BrushType = "scatter" | "chain" | "spray" | "eraser";

export interface DrawPoint {
  x: number;
  y: number;
}

// ─── Generation Parameters ──────────────────────────────────────────
export type PaletteMode =
  | "analogous"
  | "complementary"
  | "triadic"
  | "warm"
  | "neon"
  | "mono";
export type LayoutMode = "scatter" | "grid" | "radial" | "noise" | "cluster" | "burst";
export type ColorStrategy = "pool" | "noise" | "field";
export type SymmetryMode = "none" | "bilateral" | "quad" | "rotational";
export type BgStyle = "flat" | "subtle" | "gradient";

export interface Params {
  density: number;
  complexity: number;
  organicness: number;
  sizeMin: number;
  sizeMax: number;
  opacityMin: number;
  opacityMax: number;
  rotationSpread: number;
  strokeRatio: number;
  paletteMode: PaletteMode;
  layout: LayoutMode;
  noiseScale: number;
  noiseInfluence: number;
  colorStrategy: ColorStrategy;
  oscillatorFreq: number;
  oscillatorAmp: number;
  symmetryMode: SymmetryMode;
  layerCount: number;
  layerFade: number;
  lightAngle: number;
  lightIntensity: number;
  gradientShapes: boolean;
  beadChains: number;
  typoScatter: number;
  bgStyle: BgStyle;
  atmoClouds: number;
  atmoRibbons: number;
  atmoBlooms: number;
  atmoRays: number;
  tangles: number;
  outlineWeight: number;
}

// ─── UI Types ───────────────────────────────────────────────────────
export interface SegOption<T extends string> {
  value: T;
  label: string;
}

export type Theme = "dark" | "light";
