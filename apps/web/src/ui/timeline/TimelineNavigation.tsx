import React from "react";

interface Props {
  eventCount: number;
  onRefresh: () => void;
}

export const TimelineNavigation: React.FC<Props> = ({ eventCount, onRefresh }) => {
  return (
    <div style={styles.container}>
      <span style={styles.count}>{eventCount} event{eventCount !== 1 ? "s" : ""}</span>
      <button onClick={onRefresh} style={styles.btn}>Refresh</button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", alignItems: "center", gap: 16 },
  count: { fontSize: 14, color: "#475569" },
  btn: {
    padding: "6px 12px",
    backgroundColor: "#0f172a",
    color: "white",
    border: "none",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 12,
    letterSpacing: 0.5
  }
};
