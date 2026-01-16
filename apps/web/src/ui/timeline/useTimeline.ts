import { useState, useEffect, useMemo, useCallback } from "react";
import type { TimelineResponse, TimelineEvent, TimelineFilters, TimelineEventType } from "./types";
import { ALL_EVENT_TYPES } from "./types";

const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8787";

export type TimelineState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; data: TimelineResponse }
  | { kind: "error"; message: string };

const DEFAULT_FILTERS: TimelineFilters = {
  eventTypes: [...ALL_EVENT_TYPES],
  dateRange: { start: null, end: null },
  searchQuery: ""
};

export function useTimeline(patientId: string) {
  const [state, setState] = useState<TimelineState>({ kind: "idle" });
  const [filters, setFilters] = useState<TimelineFilters>(DEFAULT_FILTERS);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch(`${apiBase}/graph/timeline/${patientId}`);
      if (!res.ok) {
        setState({ kind: "error", message: `API error: ${res.status}` });
        return;
      }
      const data = await res.json() as TimelineResponse;
      setState({ kind: "loaded", data });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  }, [patientId]);

  useEffect(() => { void fetchTimeline(); }, [fetchTimeline]);

  const filteredEvents = useMemo(() => {
    if (state.kind !== "loaded") return [];
    return state.data.events.filter(event => {
      if (!filters.eventTypes.includes(event.type as TimelineEventType)) return false;
      const eventDate = new Date(event.timestamp);
      if (filters.dateRange.start && eventDate < filters.dateRange.start) return false;
      if (filters.dateRange.end && eventDate > filters.dateRange.end) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        if (!event.title.toLowerCase().includes(q) && !event.summary?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [state, filters]);

  const eventsByDate = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    for (const event of filteredEvents) {
      const date = new Date(event.timestamp).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      const existing = groups.get(date) ?? [];
      existing.push(event);
      groups.set(date, existing);
    }
    return groups;
  }, [filteredEvents]);

  const toggleEventType = useCallback((type: TimelineEventType) => {
    setFilters(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(type)
        ? prev.eventTypes.filter(t => t !== type)
        : [...prev.eventTypes, type]
    }));
  }, []);

  const setDateRange = useCallback((start: Date | null, end: Date | null) => {
    setFilters(prev => ({ ...prev, dateRange: { start, end } }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  return {
    state,
    filters,
    filteredEvents,
    eventsByDate,
    selectedEventId,
    refresh: fetchTimeline,
    setSelectedEventId,
    toggleEventType,
    setDateRange,
    setSearchQuery,
    clearFilters
  };
}
