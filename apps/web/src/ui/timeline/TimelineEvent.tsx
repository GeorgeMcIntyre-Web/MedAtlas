import React, { useState } from "react";
import type { TimelineEvent as TimelineEventType } from "./types";
import { EVENT_TYPE_CONFIGS } from "./types";

interface TimelineEventProps {
  event: TimelineEventType;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

/**
 * Format a timestamp for display
 */
function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Individual timeline event card
 */
export const TimelineEvent: React.FC<TimelineEventProps> = ({
  event,
  isSelected,
  onSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = EVENT_TYPE_CONFIGS[event.type];

  const handleClick = () => {
    onSelect(event.id);
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: "flex",
        gap: 16,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {/* Timeline line and dot */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: 24,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: isSelected ? config.color : "#e5e7eb",
            border: `2px solid ${config.color}`,
            transition: "all 0.2s ease",
          }}
        />
        <div
          style={{
            flex: 1,
            width: 2,
            backgroundColor: "#e5e7eb",
            marginTop: 4,
          }}
        />
      </div>

      {/* Event card */}
      <div
        style={{
          flex: 1,
          marginBottom: 16,
          padding: 16,
          borderRadius: 12,
          backgroundColor: isSelected ? config.bgColor : "white",
          border: `1px solid ${isSelected ? config.color : "#e5e7eb"}`,
          boxShadow: isSelected
            ? `0 4px 12px ${config.color}20`
            : "0 1px 3px rgba(0,0,0,0.05)",
          transition: "all 0.2s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Event type badge */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 12,
                backgroundColor: config.bgColor,
                color: config.color,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
            </span>
          </div>

          {/* Time */}
          <span
            style={{
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            {formatTime(event.timestamp)}
          </span>
        </div>

        {/* Title */}
        <h4
          style={{
            margin: 0,
            marginBottom: 4,
            fontSize: 15,
            fontWeight: 600,
            color: "#111827",
          }}
        >
          {event.title}
        </h4>

        {/* Summary */}
        {event.summary && (
          <p
            style={{
              margin: 0,
              marginBottom: 8,
              fontSize: 14,
              color: "#4b5563",
              lineHeight: 1.5,
            }}
          >
            {event.summary}
          </p>
        )}

        {/* Evidence count badge */}
        {event.evidence.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 8,
                backgroundColor: "#f3f4f6",
                color: "#6b7280",
                fontSize: 11,
              }}
            >
              📎 {event.evidence.length} evidence source
              {event.evidence.length !== 1 ? "s" : ""}
            </span>

            {event.relatedNodes && event.relatedNodes.length > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 8,
                  backgroundColor: "#f3f4f6",
                  color: "#6b7280",
                  fontSize: 11,
                }}
              >
                🔗 {event.relatedNodes.length} related
              </span>
            )}
          </div>
        )}

        {/* Expanded details */}
        {isExpanded && isSelected && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <h5
              style={{
                margin: 0,
                marginBottom: 8,
                fontSize: 12,
                fontWeight: 600,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Evidence Sources
            </h5>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {event.evidence.map((ref, i) => (
                <button
                  key={`${ref.source}-${ref.id}-${i}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Handle evidence click - show details or link to source
                    console.log("Evidence clicked:", ref);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    borderRadius: 6,
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    color: "#374151",
                    fontSize: 12,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#f9fafb";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{ref.source}</span>
                  <span style={{ color: "#9ca3af" }}>:</span>
                  <span style={{ fontFamily: "monospace", fontSize: 11 }}>
                    {ref.id}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
