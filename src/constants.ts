import type {
  Params,
  PaletteMode,
  LayoutMode,
  ColorStrategy,
  SymmetryMode,
  BgStyle,
  BrushType,
  SegOption,
} from "./types";

export const DEF: Params = {
  density: 0.35,
  complexity: 0.5,
  organicness: 0.3,
  sizeMin: 4,
  sizeMax: 80,
  opacityMin: 0.1,
  opacityMax: 0.88,
  rotationSpread: 0.5,
  strokeRatio: 0.2,
  paletteMode: "warm",
  layout: "cluster",
  noiseScale: 1,
  noiseInfluence: 0.3,
  colorStrategy: "pool",
  oscillatorFreq: 0,
  oscillatorAmp: 0,
  symmetryMode: "none",
  layerCount: 2,
  layerFade: 0.3,
  lightAngle: 315,
  lightIntensity: 0.5,
  gradientShapes: true,
  beadChains: 0.3,
  typoScatter: 0.2,
  bgStyle: "gradient",
  atmoClouds: 0.3,
  atmoRibbons: 0.2,
  atmoBlooms: 0.15,
  atmoRays: 0,
  tangles: 0.3,
  outlineWeight: 0.5,
};

export const PALS: SegOption<PaletteMode>[] = [
  { value: "analogous", label: "ANA" },
  { value: "complementary", label: "CMP" },
  { value: "triadic", label: "TRI" },
  { value: "warm", label: "WRM" },
  { value: "neon", label: "NEO" },
  { value: "mono", label: "MON" },
];

export const LAYS: SegOption<LayoutMode>[] = [
  { value: "scatter", label: "SCAT" },
  { value: "grid", label: "GRID" },
  { value: "radial", label: "RAD" },
  { value: "noise", label: "NSE" },
  { value: "cluster", label: "CLST" },
  { value: "burst", label: "BRST" },
];

export const COLS: SegOption<ColorStrategy>[] = [
  { value: "pool", label: "POOL" },
  { value: "noise", label: "GRAD" },
  { value: "field", label: "ATTR" },
];

export const SYMS: SegOption<SymmetryMode>[] = [
  { value: "none", label: "—" },
  { value: "bilateral", label: "BI" },
  { value: "quad", label: "QD" },
  { value: "rotational", label: "RT" },
];

export const BGS: SegOption<BgStyle>[] = [
  { value: "flat", label: "FLAT" },
  { value: "subtle", label: "SUB" },
  { value: "gradient", label: "GRD" },
];

export const BRUSHES: SegOption<BrushType>[] = [
  { value: "scatter", label: "SCAT" },
  { value: "chain", label: "CHAIN" },
  { value: "spray", label: "SPRAY" },
  { value: "eraser", label: "ERAS" },
];
