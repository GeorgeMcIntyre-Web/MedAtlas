import React, { useState } from "react";
import type { TimelineEvent as TEvent } from "./types";
import { EVENT_TYPE_CONFIGS } from "./types";

interface Props {
  event: TEvent;
  isSelected: boolean;
  onSelect: () => void;
}

export const TimelineEvent: React.FC<Props> = ({ event, isSelected, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const config = EVENT_TYPE_CONFIGS[event.type] ?? EVENT_TYPE_CONFIGS.observation;

  const time = new Date(event.timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });

  return (
    <div
      onClick={onSelect}
      style={{
        ...styles.card,
        borderLeft: `4px solid ${config.color}`,
        backgroundColor: isSelected ? config.bgColor : "white"
      }}
    >
      <div style={styles.header}>
        <span style={{ ...styles.badge, backgroundColor: config.bgColor, color: config.color }}>
          <span style={styles.icon}>{config.icon}</span>
          {config.label}
        </span>
        <span style={styles.time}>{time}</span>
      </div>

      <h4 style={styles.title}>{event.title}</h4>

      {event.summary && <p style={styles.summary}>{event.summary}</p>}

      <div style={styles.footer}>
        <span style={styles.evidence}>
          {event.evidence.length} evidence source{event.evidence.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          style={styles.expandBtn}
        >
          {expanded ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {expanded && (
        <div style={styles.details}>
          <strong>Evidence:</strong>
          <ul>
            {event.evidence.map((ev, i) => (
              <li key={`${ev.source}-${ev.id}-${i}`}>{ev.source}: {ev.id}</li>
            ))}
          </ul>
          {event.relatedNodes && event.relatedNodes.length > 0 && (
            <>
              <strong>Related:</strong>
              <p>{event.relatedNodes.join(", ")}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    padding: 16,
    borderRadius: 12,
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
    transition: "all 0.2s"
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  badge: { display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 },
  icon: { fontSize: 10, letterSpacing: 0.4 },
  time: { fontSize: 12, color: "#64748b" },
  title: { margin: "0 0 4px", fontSize: 16, fontWeight: 600 },
  summary: { margin: 0, fontSize: 14, color: "#475569" },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  evidence: { fontSize: 12, color: "#94a3b8" },
  expandBtn: {
    background: "none",
    border: "none",
    color: "#0f172a",
    cursor: "pointer",
    fontSize: 12,
    padding: 0
  },
  details: { marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0", fontSize: 13 }
};
