import React from "react";
import { useTimeline } from "./useTimeline";
import { TimelineEvent } from "./TimelineEvent";
import { TimelineFilters } from "./TimelineFilters";
import { TimelineNavigation } from "./TimelineNavigation";

interface TimelineViewProps {
  patientId: string;
}

/**
 * Loading skeleton for timeline
 */
const TimelineSkeleton: React.FC = () => (
  <div style={{ padding: 16 }}>
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 24,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#e5e7eb",
              animation: "pulse 1.5s ease-in-out infinite",
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
        <div
          style={{
            flex: 1,
            height: 100,
            borderRadius: 12,
            backgroundColor: "#f3f4f6",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
    ))}
    <style>
      {`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}
    </style>
  </div>
);

/**
 * Error display component
 */
const TimelineError: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <div
    style={{
      padding: 32,
      textAlign: "center",
      backgroundColor: "#fef2f2",
      borderRadius: 12,
      border: "1px solid #fecaca",
    }}
  >
    <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
    <h3 style={{ margin: 0, marginBottom: 8, color: "#991b1b" }}>
      Error Loading Timeline
    </h3>
    <p style={{ margin: 0, marginBottom: 16, color: "#b91c1c" }}>{message}</p>
    <button
      onClick={onRetry}
      style={{
        padding: "10px 20px",
        borderRadius: 8,
        border: "none",
        backgroundColor: "#dc2626",
        color: "white",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      Try Again
    </button>
  </div>
);

/**
 * Empty state component
 */
const TimelineEmpty: React.FC<{ hasFilters: boolean; onClearFilters: () => void }> = ({
  hasFilters,
  onClearFilters,
}) => (
  <div
    style={{
      padding: 48,
      textAlign: "center",
      backgroundColor: "#f9fafb",
      borderRadius: 12,
      border: "1px dashed #d1d5db",
    }}
  >
    <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
    <h3 style={{ margin: 0, marginBottom: 8, color: "#374151" }}>
      {hasFilters ? "No Matching Events" : "No Events Found"}
    </h3>
    <p style={{ margin: 0, marginBottom: 16, color: "#6b7280" }}>
      {hasFilters
        ? "Try adjusting your filters to see more events."
        : "This patient has no timeline events yet."}
    </p>
    {hasFilters && (
      <button
        onClick={onClearFilters}
        style={{
          padding: "10px 20px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
          backgroundColor: "white",
          color: "#374151",
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Clear Filters
      </button>
    )}
  </div>
);

/**
 * Main Timeline View component
 */
export const TimelineView: React.FC<TimelineViewProps> = ({ patientId }) => {
  const {
    state,
    filters,
    filteredEvents,
    eventsByDate,
    selectedEventId,
    currentEventIndex,
    refresh,
    setSelectedEventId,
    goToNextEvent,
    goToPreviousEvent,
    goToDate,
    toggleEventType,
    setDateRange,
    setSearchQuery,
    clearFilters,
    selectAllEventTypes,
    clearEventTypes,
  } = useTimeline(patientId);

  // Loading state
  if (state.kind === "loading") {
    return (
      <div>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Patient Timeline</h2>
        <TimelineSkeleton />
      </div>
    );
  }

  // Error state
  if (state.kind === "error") {
    return (
      <div>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Patient Timeline</h2>
        <TimelineError message={state.message} onRetry={refresh} />
      </div>
    );
  }

  // Idle state (shouldn't happen, but handle it)
  if (state.kind === "idle") {
    return (
      <div>
        <h2 style={{ marginTop: 0, marginBottom: 16 }}>Patient Timeline</h2>
        <p>Initializing...</p>
      </div>
    );
  }

  // Loaded state
  const totalEvents = state.data.events.length;
  const hasFilters =
    filters.eventTypes.length !== 6 ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null ||
    filters.searchQuery !== "";

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Patient Timeline</h2>
          <p style={{ margin: 0, marginTop: 4, color: "#6b7280", fontSize: 14 }}>
            Patient ID: {patientId}
          </p>
        </div>
        <button
          onClick={refresh}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            backgroundColor: "white",
            color: "#374151",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Navigation */}
      <TimelineNavigation
        currentIndex={currentEventIndex}
        totalEvents={filteredEvents.length}
        onPrevious={goToPreviousEvent}
        onNext={goToNextEvent}
        onGoToDate={goToDate}
        dateRange={state.data.dateRange}
      />

      {/* Filters */}
      <TimelineFilters
        filters={filters}
        onToggleEventType={toggleEventType}
        onSetDateRange={setDateRange}
        onSetSearchQuery={setSearchQuery}
        onClearFilters={clearFilters}
        onSelectAll={selectAllEventTypes}
        onClearEventTypes={clearEventTypes}
        totalEvents={totalEvents}
        filteredCount={filteredEvents.length}
      />

      {/* Timeline */}
      {filteredEvents.length === 0 ? (
        <TimelineEmpty hasFilters={hasFilters} onClearFilters={clearFilters} />
      ) : (
        <div style={{ paddingLeft: 8 }}>
          {Array.from(eventsByDate.entries()).map(([date, events]) => (
            <div key={date} style={{ marginBottom: 24 }}>
              {/* Date separator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    backgroundColor: "#f3f4f6",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  {date}
                </div>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: "#e5e7eb",
                  }}
                />
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  {events.length} event{events.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Events for this date */}
              {events.map((event) => (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  isSelected={selectedEventId === event.id}
                  onSelect={setSelectedEventId}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Mock data notice */}
      {state.data.metadata?.generated && (
        <div
          style={{
            marginTop: 24,
            padding: 12,
            backgroundColor: "#fef3c7",
            borderRadius: 8,
            border: "1px solid #fcd34d",
            fontSize: 12,
            color: "#92400e",
            textAlign: "center",
          }}
        >
          ⚠️ {state.data.metadata.message ?? "Displaying mock data for development"}
        </div>
      )}
    </div>
  );
};
