import React from "react";
import type { TimelineFilters as FilterState, TimelineEventType } from "./types";
import { EVENT_TYPE_CONFIGS, ALL_EVENT_TYPES } from "./types";

interface TimelineFiltersProps {
  filters: FilterState;
  onToggleEventType: (type: TimelineEventType) => void;
  onSetDateRange: (start: Date | null, end: Date | null) => void;
  onSetSearchQuery: (query: string) => void;
  onClearFilters: () => void;
  onSelectAll: () => void;
  onClearEventTypes: () => void;
  totalEvents: number;
  filteredCount: number;
}

/**
 * Timeline filter controls
 */
export const TimelineFilters: React.FC<TimelineFiltersProps> = ({
  filters,
  onToggleEventType,
  onSetDateRange,
  onSetSearchQuery,
  onClearFilters,
  onSelectAll,
  onClearEventTypes,
  totalEvents,
  filteredCount,
}) => {
  const hasActiveFilters =
    filters.eventTypes.length !== ALL_EVENT_TYPES.length ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null ||
    filters.searchQuery !== "";

  return (
    <div
      style={{
        padding: 16,
        backgroundColor: "white",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        marginBottom: 16,
      }}
    >
      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search events..."
          value={filters.searchQuery}
          onChange={(e) => onSetSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            fontSize: 14,
            outline: "none",
            transition: "border-color 0.15s ease",
            boxSizing: "border-box",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#3b82f6";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e5e7eb";
          }}
        />
      </div>

      {/* Event type filters */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Event Types
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onSelectAll}
              style={{
                padding: "2px 8px",
                borderRadius: 4,
                border: "1px solid #e5e7eb",
                backgroundColor: "white",
                color: "#6b7280",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              All
            </button>
            <button
              onClick={onClearEventTypes}
              style={{
                padding: "2px 8px",
                borderRadius: 4,
                border: "1px solid #e5e7eb",
                backgroundColor: "white",
                color: "#6b7280",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              None
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {ALL_EVENT_TYPES.map((type) => {
            const config = EVENT_TYPE_CONFIGS[type];
            const isSelected = filters.eventTypes.includes(type);

            return (
              <button
                key={type}
                onClick={() => onToggleEventType(type)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 12px",
                  borderRadius: 20,
                  border: `1px solid ${isSelected ? config.color : "#e5e7eb"}`,
                  backgroundColor: isSelected ? config.bgColor : "white",
                  color: isSelected ? config.color : "#6b7280",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{config.icon}</span>
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date range filters */}
      <div style={{ marginBottom: 16 }}>
        <span
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: "#6b7280",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 8,
          }}
        >
          Date Range
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="date"
            value={
              filters.dateRange.start
                ? filters.dateRange.start.toISOString().split("T")[0]
                : ""
            }
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value) : null;
              onSetDateRange(date, filters.dateRange.end);
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              fontSize: 13,
              color: "#374151",
            }}
          />
          <span style={{ color: "#9ca3af" }}>to</span>
          <input
            type="date"
            value={
              filters.dateRange.end
                ? filters.dateRange.end.toISOString().split("T")[0]
                : ""
            }
            onChange={(e) => {
              const date = e.target.value ? new Date(e.target.value) : null;
              onSetDateRange(filters.dateRange.start, date);
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              fontSize: 13,
              color: "#374151",
            }}
          />
        </div>
      </div>

      {/* Filter status and clear */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 12,
          borderTop: "1px solid #f3f4f6",
        }}
      >
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          Showing {filteredCount} of {totalEvents} events
        </span>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              backgroundColor: "white",
              color: "#6b7280",
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            ✕ Clear filters
          </button>
        )}
      </div>
    </div>
  );
};
