import { useCallback } from "react";
import type { Theme } from "../types";
import { clamp } from "../utils/math";

interface KnobProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  size?: number;
  theme: Theme;
}

export function Knob({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  label,
  size = 42,
  theme,
}: KnobProps) {
  const handleDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const sy = e.clientY;
      const sv = value;
      const range = max - min;
      const onM = (e2: PointerEvent) =>
        onChange(clamp(Math.round((sv + (sy - e2.clientY) * 0.004 * range) / step) * step, min, max));
      const onU = () => {
        window.removeEventListener("pointermove", onM);
        window.removeEventListener("pointerup", onU);
      };
      window.addEventListener("pointermove", onM);
      window.addEventListener("pointerup", onU);
    },
    [value, min, max, step, onChange],
  );

  const norm = (value - min) / (max - min);
  const angle = -135 + norm * 270;
  const dk = theme === "dark";
  const acc = dk ? "#e89040" : "#b85520";
  const trk = dk ? "#1e1e24" : "#c8c4bc";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, userSelect: "none" }}>
      <div
        onPointerDown={handleDown}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle at 38% 33%,${dk ? "#35353a" : "#e5e2dc"},${dk ? "#26262a" : "#d5d2ca"})`,
          border: `1.5px solid ${dk ? "#3a3a40" : "#b5b0a8"}`,
          position: "relative",
          cursor: "ns-resize",
          boxShadow: dk
            ? "0 2px 8px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 2px 6px rgba(0,0,0,0.12),inset 0 1px 0 rgba(255,255,255,0.5)",
          touchAction: "none",
        }}
      >
        <svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0 }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 4}
            fill="none"
            stroke={trk}
            strokeWidth="2"
            strokeDasharray={`${(270 / 360) * Math.PI * (size - 8)} ${(90 / 360) * Math.PI * (size - 8)}`}
            transform={`rotate(135,${size / 2},${size / 2})`}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 4}
            fill="none"
            stroke={acc}
            strokeWidth="2"
            strokeDasharray={`${(norm * 270 / 360) * Math.PI * (size - 8)} ${((360 - norm * 270) / 360) * Math.PI * (size - 8)}`}
            transform={`rotate(135,${size / 2},${size / 2})`}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 2,
            height: size * 0.28,
            background: acc,
            borderRadius: 1,
            transformOrigin: "50% 0%",
            transform: `translate(-50%,0) rotate(${angle}deg) translateY(-${size * 0.1}px)`,
          }}
        />
      </div>
      <span
        style={{
          fontSize: 7,
          color: dk ? "#666" : "#999",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          fontFamily: "'DM Mono',monospace",
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 8,
          color: dk ? "#aaa" : "#666",
          fontFamily: "'DM Mono',monospace",
          lineHeight: 1,
        }}
      >
        {typeof value === "number"
          ? Number.isInteger(value) || step >= 1
            ? Math.round(value)
            : value.toFixed(2)
          : value}
      </span>
    </div>
  );
}
