import React from "react";
import { useTimeline } from "./useTimeline";
import { TimelineEvent } from "./TimelineEvent";
import { TimelineFilters } from "./TimelineFilters";
import { TimelineNavigation } from "./TimelineNavigation";

interface Props {
  patientId: string;
}

export const TimelineView: React.FC<Props> = ({ patientId }) => {
  const timeline = useTimeline(patientId);

  if (timeline.state.kind === "loading") {
    return <div style={styles.container}><p>Loading timeline...</p></div>;
  }

  if (timeline.state.kind === "error") {
    return <div style={styles.container}><p style={{ color: "#b91c1c" }}>Error: {timeline.state.message}</p></div>;
  }

  if (timeline.state.kind !== "loaded") {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Patient Timeline</h2>
        <TimelineNavigation
          eventCount={timeline.filteredEvents.length}
          onRefresh={timeline.refresh}
        />
      </div>

      <TimelineFilters
        filters={timeline.filters}
        onToggleType={timeline.toggleEventType}
        onSetDateRange={timeline.setDateRange}
        onSetSearch={timeline.setSearchQuery}
        onClear={timeline.clearFilters}
      />

      {timeline.filteredEvents.length === 0 ? (
        <p style={styles.empty}>No events match your filters.</p>
      ) : (
        <div style={styles.timeline}>
          {Array.from(timeline.eventsByDate.entries()).map(([date, events]) => (
            <div key={date} style={styles.dateGroup}>
              <div style={styles.dateSeparator}>{date}</div>
              {events.map(event => (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  isSelected={timeline.selectedEventId === event.id}
                  onSelect={() => timeline.setSelectedEventId(event.id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 24, maxWidth: 960, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { margin: 0, fontSize: 24, fontWeight: 700 },
  timeline: { display: "flex", flexDirection: "column", gap: 16 },
  dateGroup: { display: "flex", flexDirection: "column", gap: 8 },
  dateSeparator: {
    fontSize: 12,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 6,
    marginBottom: 8
  },
  empty: { color: "#64748b", fontStyle: "italic", textAlign: "center", padding: 32 }
};
