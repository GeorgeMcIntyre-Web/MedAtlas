import { useState, useEffect, useMemo, useCallback } from "react";
import type {
  TimelineResponse,
  TimelineEvent,
  TimelineFilters,
  TimelineEventType,
} from "./types";
import { ALL_EVENT_TYPES } from "./types";

const apiBase =
  (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8787";

/**
 * Timeline loading state
 */
export type TimelineState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; data: TimelineResponse }
  | { kind: "error"; message: string };

/**
 * Default filter state
 */
const DEFAULT_FILTERS: TimelineFilters = {
  eventTypes: [...ALL_EVENT_TYPES],
  dateRange: {
    start: null,
    end: null,
  },
  searchQuery: "",
};

/**
 * Hook for fetching and managing timeline data
 */
export function useTimeline(patientId: string) {
  const [state, setState] = useState<TimelineState>({ kind: "idle" });
  const [filters, setFilters] = useState<TimelineFilters>(DEFAULT_FILTERS);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Fetch timeline data
  const fetchTimeline = useCallback(async () => {
    setState({ kind: "loading" });

    try {
      const res = await fetch(`${apiBase}/graph/timeline/${patientId}`);

      if (!res.ok) {
        setState({ kind: "error", message: `API error: ${res.status}` });
        return;
      }

      const data = (await res.json()) as TimelineResponse;
      setState({ kind: "loaded", data });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState({ kind: "error", message });
    }
  }, [patientId]);

  // Fetch on mount and when patientId changes
  useEffect(() => {
    void fetchTimeline();
  }, [fetchTimeline]);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    if (state.kind !== "loaded") return [];

    return state.data.events.filter((event) => {
      // Filter by event type
      if (!filters.eventTypes.includes(event.type)) {
        return false;
      }

      // Filter by date range
      const eventDate = new Date(event.timestamp);
      if (filters.dateRange.start && eventDate < filters.dateRange.start) {
        return false;
      }
      if (filters.dateRange.end && eventDate > filters.dateRange.end) {
        return false;
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesSummary = event.summary?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSummary) {
          return false;
        }
      }

      return true;
    });
  }, [state, filters]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();

    for (const event of filteredEvents) {
      const date = new Date(event.timestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const existing = groups.get(date) ?? [];
      existing.push(event);
      groups.set(date, existing);
    }

    return groups;
  }, [filteredEvents]);

  // Navigation helpers
  const currentEventIndex = useMemo(() => {
    if (!selectedEventId) return -1;
    return filteredEvents.findIndex((e) => e.id === selectedEventId);
  }, [filteredEvents, selectedEventId]);

  const goToNextEvent = useCallback(() => {
    if (filteredEvents.length === 0) return;
    const nextIndex = Math.min(
      currentEventIndex + 1,
      filteredEvents.length - 1
    );
    setSelectedEventId(filteredEvents[nextIndex].id);
  }, [filteredEvents, currentEventIndex]);

  const goToPreviousEvent = useCallback(() => {
    if (filteredEvents.length === 0) return;
    const prevIndex = Math.max(currentEventIndex - 1, 0);
    setSelectedEventId(filteredEvents[prevIndex].id);
  }, [filteredEvents, currentEventIndex]);

  const goToDate = useCallback(
    (date: Date) => {
      const targetTime = date.getTime();
      let closestEvent: TimelineEvent | null = null;
      let closestDiff = Infinity;

      for (const event of filteredEvents) {
        const eventTime = new Date(event.timestamp).getTime();
        const diff = Math.abs(eventTime - targetTime);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestEvent = event;
        }
      }

      if (closestEvent) {
        setSelectedEventId(closestEvent.id);
      }
    },
    [filteredEvents]
  );

  // Filter update helpers
  const toggleEventType = useCallback((type: TimelineEventType) => {
    setFilters((prev) => {
      const types = prev.eventTypes.includes(type)
        ? prev.eventTypes.filter((t) => t !== type)
        : [...prev.eventTypes, type];
      return { ...prev, eventTypes: types };
    });
  }, []);

  const setDateRange = useCallback(
    (start: Date | null, end: Date | null) => {
      setFilters((prev) => ({
        ...prev,
        dateRange: { start, end },
      }));
    },
    []
  );

  const setSearchQuery = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const selectAllEventTypes = useCallback(() => {
    setFilters((prev) => ({ ...prev, eventTypes: [...ALL_EVENT_TYPES] }));
  }, []);

  const clearEventTypes = useCallback(() => {
    setFilters((prev) => ({ ...prev, eventTypes: [] }));
  }, []);

  return {
    // State
    state,
    filters,
    filteredEvents,
    eventsByDate,
    selectedEventId,
    currentEventIndex,

    // Actions
    refresh: fetchTimeline,
    setSelectedEventId,
    goToNextEvent,
    goToPreviousEvent,
    goToDate,

    // Filter actions
    toggleEventType,
    setDateRange,
    setSearchQuery,
    clearFilters,
    selectAllEventTypes,
    clearEventTypes,
  };
}
