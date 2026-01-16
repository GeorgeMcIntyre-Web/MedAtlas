import React from "react";

interface Props {
  type: "imaging" | "lab" | "text";
  label: string;
}

const COLORS: Record<Props["type"], { fg: string; bg: string }> = {
  imaging: { fg: "#0f766e", bg: "#ccfbf1" },
  lab: { fg: "#b45309", bg: "#ffedd5" },
  text: { fg: "#4338ca", bg: "#e0e7ff" }
};

export const ModalityLink: React.FC<Props> = ({ type, label }) => {
  const palette = COLORS[type];
  return (
    <span
      style={{
        ...styles.tag,
        color: palette.fg,
        backgroundColor: palette.bg
      }}
    >
      {label}
    </span>
  );
};

const styles: Record<string, React.CSSProperties> = {
  tag: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.4
  }
};
