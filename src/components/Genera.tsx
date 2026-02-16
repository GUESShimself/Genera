import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Params, Theme, BrushType } from "../types";
import { clamp } from "../utils/math";
import { getPaletteForDrawing } from "../engine/drawing";
import { DEF, PALS, LAYS, COLS, SYMS, BGS, BRUSHES } from "../constants";
import { Knob } from "./Knob";
import { Seg } from "./Seg";
import { DrawCanvas } from "./DrawCanvas";
import type { DrawCanvasHandle } from "./DrawCanvas";

export function Genera() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawCanvasRef = useRef<DrawCanvasHandle>(null);
  const [seed, setSeed] = useState(42);
  const [params, setParams] = useState<Params>(DEF);
  const [size, setSize] = useState({ w: 600, h: 600 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );
  const dk = theme === "dark";

  // Draw mode state
  const [drawMode, setDrawMode] = useState(false);
  const [brushType, setBrushType] = useState<BrushType>("scatter");
  const [brushSize, setBrushSize] = useState(30);
  const [drawOpacity, setDrawOpacity] = useState(0.7);

  // Palette for drawing (derived from current params + seed)
  const drawPalette = useMemo(
    () => getPaletteForDrawing(params.paletteMode, seed),
    [params.paletteMode, seed],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    const onR = () => {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setSize({ w: Math.floor(r.width), h: Math.floor(r.height) });
      }
    };
    onR();
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  // Worker + bitmap caching
  const workerRef = useRef<Worker | null>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const requestIdRef = useRef(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bitmapVersion, setBitmapVersion] = useState(0);

  // Create worker on mount
  useEffect(() => {
    const w = new Worker(new URL("../engine/generate.worker.ts", import.meta.url), {
      type: "module",
    });
    w.onmessage = (e: MessageEvent<{ id: number; bitmap: ImageBitmap }>) => {
      const { id, bitmap } = e.data;
      // Ignore stale results
      if (id !== requestIdRef.current) {
        bitmap.close();
        return;
      }
      bitmapRef.current?.close();
      bitmapRef.current = bitmap;
      setIsGenerating(false);
      setBitmapVersion((v) => v + 1);
    };
    workerRef.current = w;
    return () => {
      w.terminate();
      bitmapRef.current?.close();
    };
  }, []);

  // Effect A: dispatch generation to worker (only on param/seed/size changes)
  useEffect(() => {
    const w = workerRef.current;
    if (!w) return;
    const id = ++requestIdRef.current;
    setIsGenerating(true);
    w.postMessage({ id, w: size.w, h: size.h, params, seed });
  }, [seed, params, size]);

  // Effect B: composite cached bitmap to display canvas (instant)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = size.w * dpr;
    c.height = size.h * dpr;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = dk ? "#08080a" : "#e5e2da";
    ctx.fillRect(0, 0, size.w, size.h);
    if (bitmapRef.current) {
      ctx.save();
      ctx.translate(size.w / 2 + pan.x, size.h / 2 + pan.y);
      ctx.scale(zoom, zoom);
      ctx.translate(-size.w / 2, -size.h / 2);
      ctx.drawImage(bitmapRef.current, 0, 0, size.w, size.h);
      ctx.restore();
    }
  }, [bitmapVersion, zoom, pan, size, dk]);

  const up = <K extends keyof Params>(k: K, v: Params[K]) =>
    setParams((p) => ({ ...p, [k]: v }));

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => clamp(z * (e.deltaY < 0 ? 1.08 : 0.92), 0.25, 6));
  }, []);

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 1 || e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setIsPanning(true);
        panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      }
    },
    [pan],
  );

  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isPanning && panStart.current) {
        setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
      }
    },
    [isPanning],
  );

  const handleCanvasPointerUp = useCallback(() => {
    setIsPanning(false);
    panStart.current = null;
  }, []);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Info dialog state
  const [infoOpen, setInfoOpen] = useState<string | null>(null);

  // Theme colors
  const panelBg = dk ? "rgba(14,14,18,0.97)" : "rgba(232,229,222,0.97)";
  const border = dk ? "#28282e" : "#c0bbb2";
  const txt = dk ? "#777" : "#888";
  const hdr = dk ? "#ddd" : "#333";
  const acc = dk ? "#e89040" : "#b85520";

  const sectionInfo: Record<string, string> = {
    "Draw Tools": "Paint directly on the canvas.\n\nSCAT — stamps random shapes from the palette.\nCHAIN — draws bead chains along your stroke.\nSPRAY — emits fine dots in a spray pattern.\nERAS — erases drawn marks.\n\nSize controls the brush radius; Opacity controls transparency.",
    "Structure": "Density — how many shapes are generated.\nComplex — increases polygon sides, blob segments, and ring counts.\nOrganic — adds irregularity and wobble to shapes.",
    "Layout": "How shapes are distributed across the canvas.\n\nSCAT — random placement.\nGRID — arranged in rows and columns with jitter.\nRAD — placed in concentric rings from center.\nNSE — noise-guided placement (clustered in high-noise areas).\nCLST — grouped into random clusters.\nBRST — dense in the center, sparse at edges.",
    "Noise Field": "A 2D Perlin noise field modulates position and flow.\n\nScale — frequency of the noise (higher = more turbulent).\nInfluence — how strongly noise pushes shapes off their positions.",
    "Symmetry": "Mirrors or rotates the composition.\n\nBI — left/right bilateral mirror.\nQD — four-way (horizontal + vertical).\nRT — four-fold rotational symmetry around center.",
    "Layers": "Shapes are drawn in multiple depth layers.\n\nCount — number of layers (1-5).\nFade — how much back layers fade in opacity, creating atmospheric depth.",
    "Oscillator": "Applies a sine-wave modulation across all elements.\n\nFreq — oscillation frequency (cycles across the composition).\nAmp — strength of the effect on size and opacity.",
    "Size": "Min / Max — the range of shape sizes in pixels. Shapes are randomly sized within this range, further modulated by noise.",
    "Opacity": "Min / Max — the transparency range for shapes. Lower values create more ghostly, layered compositions.",
    "Render": "Rotate — how much shapes align with the noise flow field vs. random rotation.\nStroke — ratio of stroke-only (outline) shapes vs. filled shapes.",
    "Lighting": "Simulates directional light on shapes.\n\nAngle — direction the light comes from (degrees).\nIntensity — strength of highlights and shadows.\nGRAD/FLAT — toggle between radial gradient fills and flat color fills.",
    "Details": "Outline — adds darker outlines to filled shapes (Davis-style).\nTangles — flowing bezier line networks woven through the composition.\nChains — bead chain trails that follow noise-guided paths.\nTypo — scatters small typographic characters (numbers, symbols).",
    "Atmosphere": "Ethereal background/foreground effects.\n\nClouds — large, soft, translucent color washes.\nRibbons — glowing bezier curves that weave over the composition.\nBlooms — clustered transparent circles, like watercolor bleeds.\nRays — volumetric light rays from the light source direction.",
    "Color": "Palette mode — the color harmony algorithm (analogous, complementary, triadic, warm, neon, monochrome).\nStrategy — how colors are assigned: POOL (random from palette), GRAD (noise-mapped gradient), ATTR (spatial attraction fields).\nBackground — flat, subtle gradient, or rich multi-point gradient.",
  };

  const sec = (t: string) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 6,
        color: acc,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        fontFamily: "'DM Mono',monospace",
        borderBottom: `1px solid ${border}`,
        paddingBottom: 2,
        marginBottom: 1,
        marginTop: 5,
        position: "relative",
      }}
    >
      {t}
      {sectionInfo[t] && (
        <button
          onClick={() => setInfoOpen(infoOpen === t ? null : t)}
          style={{
            width: 8,
            height: 8,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: `1px solid ${infoOpen === t ? acc : (dk ? "#444" : "#bbb")}`,
            borderRadius: 2,
            color: infoOpen === t ? acc : (dk ? "#555" : "#aaa"),
            cursor: "pointer",
            fontSize: 6,
            padding: 0,
            lineHeight: 1,
            fontFamily: "system-ui, sans-serif",
            flexShrink: 0,
          }}
          title={`Info: ${t}`}
        >
          i
        </button>
      )}
      {infoOpen === t && sectionInfo[t] && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: -4,
            marginTop: 4,
            zIndex: 100,
            fontSize: 7,
            lineHeight: 1.5,
            color: dk ? "#bbb" : "#444",
            fontFamily: "'DM Mono',monospace",
            background: dk ? "#1a1a20" : "#f5f2ec",
            border: `1px solid ${dk ? "#3a3a42" : "#b0aba2"}`,
            borderRadius: 4,
            padding: "6px 8px",
            whiteSpace: "pre-line",
            boxShadow: dk
              ? "0 4px 16px rgba(0,0,0,0.5)"
              : "0 4px 16px rgba(0,0,0,0.12)",
            textTransform: "none",
            letterSpacing: "0",
          }}
        >
          {sectionInfo[t]}
        </div>
      )}
    </div>
  );

  const smallBtn = (label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "3px 0",
        fontSize: 7,
        fontFamily: "'DM Mono',monospace",
        background: "transparent",
        color: txt,
        border: `1px solid ${border}`,
        borderRadius: 2,
        cursor: "pointer",
        letterSpacing: "0.1em",
      }}
    >
      {label}
    </button>
  );

  const pnl: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "8px 8px",
    background: panelBg,
    backdropFilter: "blur(12px)",
    minWidth: 118,
    maxWidth: 132,
    overflowY: "auto",
    overflowX: "hidden",
    scrollbarWidth: "thin",
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: dk ? "#08080a" : "#e5e2da",
        fontFamily: "'DM Mono',monospace",
        overflow: "hidden",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap"
        rel="stylesheet"
      />

      {/* Click-away backdrop for tooltips */}
      {infoOpen && (
        <div
          onClick={() => setInfoOpen(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99,
          }}
        />
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "5px 12px",
          borderBottom: `1px solid ${border}`,
          background: panelBg,
          backdropFilter: "blur(12px)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: hdr, letterSpacing: "0.06em" }}>
            GENERA
          </span>
          <span style={{ fontSize: 7, color: txt, letterSpacing: "0.06em" }}>
            V3 · GENERATIVE ART PLAYGROUND
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 7, color: txt }}>
            SEED {seed}{isGenerating ? " ..." : ""}
          </span>
          <span style={{ fontSize: 7, color: txt }}>×{zoom.toFixed(1)}</span>
          <button
            onClick={resetView}
            style={{
              padding: "2px 6px",
              fontSize: 7,
              fontFamily: "'DM Mono',monospace",
              background: "transparent",
              color: txt,
              border: `1px solid ${border}`,
              borderRadius: 2,
              cursor: "pointer",
            }}
          >
            ⌂
          </button>
          <button
            onClick={() => setDrawMode((d) => !d)}
            style={{
              padding: "2px 10px",
              fontSize: 8,
              fontFamily: "'DM Mono',monospace",
              background: drawMode ? acc : "transparent",
              color: drawMode ? (dk ? "#111" : "#fff") : txt,
              border: drawMode ? "none" : `1px solid ${border}`,
              borderRadius: 3,
              cursor: "pointer",
              letterSpacing: "0.08em",
              fontWeight: 500,
            }}
          >
            DRAW
          </button>
          <button
            onClick={() => setSeed(Math.floor(Math.random() * 999999))}
            style={{
              padding: "2px 10px",
              fontSize: 8,
              fontFamily: "'DM Mono',monospace",
              background: acc,
              color: dk ? "#111" : "#fff",
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
              letterSpacing: "0.08em",
              fontWeight: 500,
            }}
          >
            GENERATE
          </button>
          <button
            onClick={() => setTheme(dk ? "light" : "dark")}
            style={{
              padding: "2px 7px",
              fontSize: 8,
              fontFamily: "'DM Mono',monospace",
              background: "transparent",
              color: txt,
              border: `1px solid ${border}`,
              borderRadius: 2,
              cursor: "pointer",
            }}
          >
            {dk ? "◐" : "◑"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Panel */}
        <div style={{ ...pnl, borderRight: `1px solid ${border}` }}>
          {/* Draw tools (shown when draw mode active) */}
          {drawMode && (
            <>
              {sec("Draw Tools")}

              <Seg value={brushType} onChange={(v) => setBrushType(v)} options={BRUSHES} theme={theme} />
              <Knob value={brushSize} onChange={setBrushSize} min={5} max={150} step={1} label="Size" theme={theme} />
              <Knob value={drawOpacity} onChange={setDrawOpacity} min={0.1} max={1} step={0.01} label="Opacity" theme={theme} />
              <div style={{ display: "flex", gap: 3 }}>
                {smallBtn("UNDO", () => drawCanvasRef.current?.undo())}
                {smallBtn("CLEAR", () => drawCanvasRef.current?.clear())}
              </div>
            </>
          )}

          {sec("Structure")}

          <Knob value={params.density} onChange={(v) => up("density", v)} label="Density" theme={theme} />
          <Knob value={params.complexity} onChange={(v) => up("complexity", v)} label="Complex" theme={theme} />
          <Knob value={params.organicness} onChange={(v) => up("organicness", v)} label="Organic" theme={theme} />

          {sec("Layout")}

          <Seg value={params.layout} onChange={(v) => up("layout", v)} options={LAYS} theme={theme} />

          {sec("Noise Field")}

          <Knob value={params.noiseScale} onChange={(v) => up("noiseScale", v)} min={0.1} max={5} step={0.1} label="Scale" theme={theme} />
          <Knob value={params.noiseInfluence} onChange={(v) => up("noiseInfluence", v)} label="Influence" theme={theme} />

          {sec("Symmetry")}

          <Seg value={params.symmetryMode} onChange={(v) => up("symmetryMode", v)} options={SYMS} theme={theme} />

          {sec("Layers")}

          <Knob value={params.layerCount} onChange={(v) => up("layerCount", v)} min={1} max={5} step={1} label="Count" theme={theme} />
          <Knob value={params.layerFade} onChange={(v) => up("layerFade", v)} label="Fade" theme={theme} />

          {sec("Oscillator")}

          <Knob value={params.oscillatorFreq} onChange={(v) => up("oscillatorFreq", v)} min={0} max={10} step={0.1} label="Freq" theme={theme} />
          <Knob value={params.oscillatorAmp} onChange={(v) => up("oscillatorAmp", v)} label="Amp" theme={theme} />
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          onPointerLeave={handleCanvasPointerUp}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 4,
            position: "relative",
            cursor: isPanning ? "grabbing" : drawMode ? "crosshair" : "default",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", width: size.w, height: size.h }}>
            <canvas
              ref={canvasRef}
              style={{
                width: size.w,
                height: size.h,
                borderRadius: 2,
                boxShadow: dk ? "0 0 50px rgba(0,0,0,0.6)" : "0 0 40px rgba(0,0,0,0.08)",
              }}
            />
            <DrawCanvas
              ref={drawCanvasRef}
              width={size.w}
              height={size.h}
              zoom={zoom}
              pan={pan}
              active={drawMode}
              brushType={brushType}
              brushSize={brushSize}
              opacity={drawOpacity}
              palette={drawPalette}
              complexity={params.complexity}
              organicness={params.organicness}
              lightAngle={params.lightAngle}
              lightIntensity={params.lightIntensity}
              gradientShapes={params.gradientShapes}
              isDark={dk}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ ...pnl, borderLeft: `1px solid ${border}` }}>
          {sec("Size")}

          <Knob value={params.sizeMin} onChange={(v) => up("sizeMin", Math.min(v, params.sizeMax - 2))} min={1} max={120} step={1} label="Min" theme={theme} />
          <Knob value={params.sizeMax} onChange={(v) => up("sizeMax", Math.max(v, params.sizeMin + 2))} min={4} max={500} step={1} label="Max" theme={theme} />

          {sec("Opacity")}

          <Knob value={params.opacityMin} onChange={(v) => up("opacityMin", Math.min(v, params.opacityMax - 0.05))} label="Min α" theme={theme} />
          <Knob value={params.opacityMax} onChange={(v) => up("opacityMax", Math.max(v, params.opacityMin + 0.05))} label="Max α" theme={theme} />

          {sec("Render")}

          <Knob value={params.rotationSpread} onChange={(v) => up("rotationSpread", v)} label="Rotate" theme={theme} />
          <Knob value={params.strokeRatio} onChange={(v) => up("strokeRatio", v)} label="Stroke" theme={theme} />

          {sec("Lighting")}

          <Knob value={params.lightAngle} onChange={(v) => up("lightAngle", v)} min={0} max={360} step={1} label="Angle" theme={theme} />
          <Knob value={params.lightIntensity} onChange={(v) => up("lightIntensity", v)} label="Intensity" theme={theme} />
          <Seg
            value={params.gradientShapes ? "on" : "off"}
            onChange={(v) => up("gradientShapes", v === "on")}
            options={[{ value: "on", label: "GRAD" }, { value: "off", label: "FLAT" }]}
            label="Fills"
            theme={theme}
          />

          {sec("Details")}

          <Knob value={params.outlineWeight} onChange={(v) => up("outlineWeight", v)} label="Outline" theme={theme} />
          <Knob value={params.tangles} onChange={(v) => up("tangles", v)} label="Tangles" theme={theme} />
          <Knob value={params.beadChains} onChange={(v) => up("beadChains", v)} label="Chains" theme={theme} />
          <Knob value={params.typoScatter} onChange={(v) => up("typoScatter", v)} label="Typo" theme={theme} />

          {sec("Atmosphere")}

          <Knob value={params.atmoClouds} onChange={(v) => up("atmoClouds", v)} label="Clouds" theme={theme} />
          <Knob value={params.atmoRibbons} onChange={(v) => up("atmoRibbons", v)} label="Ribbons" theme={theme} />
          <Knob value={params.atmoBlooms} onChange={(v) => up("atmoBlooms", v)} label="Blooms" theme={theme} />
          <Knob value={params.atmoRays} onChange={(v) => up("atmoRays", v)} label="Rays" theme={theme} />

          {sec("Color")}

          <Seg value={params.paletteMode} onChange={(v) => up("paletteMode", v)} options={PALS} theme={theme} />
          <Seg value={params.colorStrategy} onChange={(v) => up("colorStrategy", v)} options={COLS} label="Strategy" theme={theme} />
          <Seg value={params.bgStyle} onChange={(v) => up("bgStyle", v)} options={BGS} label="Background" theme={theme} />

          <div style={{ marginTop: "auto", paddingTop: 6, borderTop: `1px solid ${border}` }}>
            <button
              onClick={() => {
                setParams(DEF);
                resetView();
              }}
              style={{
                width: "100%",
                padding: "3px 0",
                fontSize: 7,
                fontFamily: "'DM Mono',monospace",
                background: "transparent",
                color: txt,
                border: `1px solid ${border}`,
                borderRadius: 2,
                cursor: "pointer",
                letterSpacing: "0.1em",
              }}
            >
              RESET ALL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
