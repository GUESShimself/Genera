import type { Theme } from "../types";

interface SegOption<T extends string> {
  value: T;
  label: string;
}

interface SegProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: SegOption<T>[];
  label?: string;
  theme: Theme;
}

export function Seg<T extends string>({ value, onChange, options, label, theme }: SegProps<T>) {
  const dk = theme === "dark";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      {label && (
        <span
          style={{
            fontSize: 6,
            color: dk ? "#555" : "#aaa",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontFamily: "'DM Mono',monospace",
          }}
        >
          {label}
        </span>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: "2px 5px",
              fontSize: 7,
              fontFamily: "'DM Mono',monospace",
              border: `1px solid ${dk ? "#333" : "#aaa"}`,
              borderRadius: 2,
              cursor: "pointer",
              background: value === o.value ? (dk ? "#e89040" : "#b85520") : dk ? "#18181c" : "#c4c0b8",
              color: value === o.value ? (dk ? "#111" : "#fff") : dk ? "#888" : "#666",
              letterSpacing: "0.04em",
              transition: "all 0.1s ease",
              lineHeight: 1,
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
