import React from "react";
import type { TimelineFilters as TFilters, TimelineEventType } from "./types";
import { EVENT_TYPE_CONFIGS, ALL_EVENT_TYPES } from "./types";

interface Props {
  filters: TFilters;
  onToggleType: (type: TimelineEventType) => void;
  onSetDateRange: (start: Date | null, end: Date | null) => void;
  onSetSearch: (query: string) => void;
  onClear: () => void;
}

const formatDateInput = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : "");

export const TimelineFilters: React.FC<Props> = ({
  filters,
  onToggleType,
  onSetDateRange,
  onSetSearch,
  onClear
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <input
          type="text"
          placeholder="Search events..."
          value={filters.searchQuery}
          onChange={(e) => onSetSearch(e.target.value)}
          style={styles.search}
        />
        <button onClick={onClear} style={styles.clearBtn}>Clear</button>
      </div>

      <div style={styles.row}>
        <input
          type="date"
          value={formatDateInput(filters.dateRange.start)}
          onChange={(e) => {
            const value = e.target.value ? new Date(e.target.value) : null;
            onSetDateRange(value, filters.dateRange.end);
          }}
          style={styles.dateInput}
        />
        <input
          type="date"
          value={formatDateInput(filters.dateRange.end)}
          onChange={(e) => {
            const value = e.target.value ? new Date(e.target.value) : null;
            onSetDateRange(filters.dateRange.start, value);
          }}
          style={styles.dateInput}
        />
      </div>

      <div style={styles.types}>
        {ALL_EVENT_TYPES.map(type => {
          const cfg = EVENT_TYPE_CONFIGS[type];
          const active = filters.eventTypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => onToggleType(type)}
              style={{
                ...styles.typeBtn,
                backgroundColor: active ? cfg.bgColor : "#f1f5f9",
                color: active ? cfg.color : "#94a3b8",
                borderColor: active ? cfg.color : "transparent"
              }}
            >
              <span style={styles.typeIcon}>{cfg.icon}</span>
              {cfg.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.3)"
  },
  row: { display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  search: {
    flex: 1,
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    fontSize: 14,
    backgroundColor: "white"
  },
  clearBtn: {
    padding: "10px 16px",
    backgroundColor: "#1f2937",
    color: "white",
    border: "none",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 12,
    letterSpacing: 0.5
  },
  dateInput: {
    padding: "8px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 12,
    backgroundColor: "white"
  },
  types: { display: "flex", flexWrap: "wrap", gap: 8 },
  typeBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    border: "2px solid",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    transition: "all 0.2s"
  },
  typeIcon: {
    fontSize: 10,
    letterSpacing: 0.5
  }
};
