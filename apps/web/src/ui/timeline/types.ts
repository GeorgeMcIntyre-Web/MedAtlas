import type { EvidenceRef } from "@medatlas/schemas/types";

/**
 * Timeline event types
 */
export type TimelineEventType =
  | "encounter"
  | "observation"
  | "study"
  | "lab"
  | "medication"
  | "condition";

/**
 * Timeline event data from API
 */
export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  title: string;
  summary?: string;
  evidence: EvidenceRef[];
  relatedNodes?: string[];
}

/**
 * Timeline API response
 */
export interface TimelineResponse {
  patientId: string;
  events: TimelineEvent[];
  dateRange: {
    start: string;
    end: string;
  };
  metadata?: {
    totalEvents: number;
    generated?: boolean;
    message?: string;
  };
}

/**
 * Filter state for timeline
 */
export interface TimelineFilters {
  eventTypes: TimelineEventType[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  searchQuery: string;
}

/**
 * Event type display configuration
 */
export interface EventTypeConfig {
  type: TimelineEventType;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

/**
 * Default event type configurations
 */
export const EVENT_TYPE_CONFIGS: Record<TimelineEventType, EventTypeConfig> = {
  encounter: {
    type: "encounter",
    label: "Encounter",
    color: "#2563eb",
    bgColor: "#dbeafe",
    icon: "🏥",
  },
  observation: {
    type: "observation",
    label: "Observation",
    color: "#16a34a",
    bgColor: "#dcfce7",
    icon: "📊",
  },
  study: {
    type: "study",
    label: "Study",
    color: "#9333ea",
    bgColor: "#f3e8ff",
    icon: "🔬",
  },
  lab: {
    type: "lab",
    label: "Lab",
    color: "#ea580c",
    bgColor: "#ffedd5",
    icon: "🧪",
  },
  medication: {
    type: "medication",
    label: "Medication",
    color: "#dc2626",
    bgColor: "#fee2e2",
    icon: "💊",
  },
  condition: {
    type: "condition",
    label: "Condition",
    color: "#ca8a04",
    bgColor: "#fef9c3",
    icon: "⚠️",
  },
};

/**
 * All event types for filtering
 */
export const ALL_EVENT_TYPES: TimelineEventType[] = [
  "encounter",
  "observation",
  "study",
  "lab",
  "medication",
  "condition",
];
