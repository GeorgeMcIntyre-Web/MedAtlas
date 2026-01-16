import React from "react";

interface TimelineNavigationProps {
  currentIndex: number;
  totalEvents: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToDate: (date: Date) => void;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Timeline navigation controls
 */
export const TimelineNavigation: React.FC<TimelineNavigationProps> = ({
  currentIndex,
  totalEvents,
  onPrevious,
  onNext,
  onGoToDate,
  dateRange,
}) => {
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < totalEvents - 1;

  const handleJumpToToday = () => {
    onGoToDate(new Date());
  };

  const handleJumpToStart = () => {
    if (dateRange?.start) {
      onGoToDate(new Date(dateRange.start));
    }
  };

  const handleJumpToEnd = () => {
    if (dateRange?.end) {
      onGoToDate(new Date(dateRange.end));
    }
  };

  const buttonStyle = (enabled: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    backgroundColor: enabled ? "white" : "#f9fafb",
    color: enabled ? "#374151" : "#9ca3af",
    fontSize: 13,
    fontWeight: 500,
    cursor: enabled ? "pointer" : "not-allowed",
    transition: "all 0.15s ease",
  });

  const smallButtonStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid #e5e7eb",
    backgroundColor: "white",
    color: "#6b7280",
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.15s ease",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        backgroundColor: "white",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        marginBottom: 16,
      }}
    >
      {/* Main navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          style={buttonStyle(hasPrevious)}
          onMouseOver={(e) => {
            if (hasPrevious) {
              e.currentTarget.style.backgroundColor = "#f9fafb";
              e.currentTarget.style.borderColor = "#d1d5db";
            }
          }}
          onMouseOut={(e) => {
            if (hasPrevious) {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }
          }}
        >
          ← Previous
        </button>

        <div style={{ textAlign: "center" }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {currentIndex >= 0 ? currentIndex + 1 : 0} of {totalEvents}
          </span>
          <span
            style={{
              display: "block",
              fontSize: 11,
              color: "#9ca3af",
              marginTop: 2,
            }}
          >
            events
          </span>
        </div>

        <button
          onClick={onNext}
          disabled={!hasNext}
          style={buttonStyle(hasNext)}
          onMouseOver={(e) => {
            if (hasNext) {
              e.currentTarget.style.backgroundColor = "#f9fafb";
              e.currentTarget.style.borderColor = "#d1d5db";
            }
          }}
          onMouseOut={(e) => {
            if (hasNext) {
              e.currentTarget.style.backgroundColor = "white";
              e.currentTarget.style.borderColor = "#e5e7eb";
            }
          }}
        >
          Next →
        </button>
      </div>

      {/* Quick jump buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          paddingTop: 8,
          borderTop: "1px solid #f3f4f6",
        }}
      >
        <button
          onClick={handleJumpToStart}
          style={smallButtonStyle}
          title="Jump to earliest event"
        >
          ⏮ Earliest
        </button>
        <button
          onClick={handleJumpToToday}
          style={smallButtonStyle}
          title="Jump to today"
        >
          📅 Today
        </button>
        <button
          onClick={handleJumpToEnd}
          style={smallButtonStyle}
          title="Jump to latest event"
        >
          Latest ⏭
        </button>
      </div>

      {/* Date range indicator */}
      {dateRange && (
        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "#9ca3af",
          }}
        >
          Timeline: {new Date(dateRange.start).toLocaleDateString()} -{" "}
          {new Date(dateRange.end).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};
