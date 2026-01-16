import type { EvidenceRef } from "@medatlas/schemas/types";

export type TimelineEventType =
  | "encounter" | "observation" | "study"
  | "lab" | "medication" | "condition" | "finding";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  title: string;
  summary?: string;
  evidence: EvidenceRef[];
  relatedNodes?: string[];
}

export interface TimelineResponse {
  patientId: string;
  events: TimelineEvent[];
  dateRange: { start: string; end: string };
}

export interface TimelineFilters {
  eventTypes: TimelineEventType[];
  dateRange: { start: Date | null; end: Date | null };
  searchQuery: string;
}

export interface EventTypeConfig {
  type: TimelineEventType;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export const EVENT_TYPE_CONFIGS: Record<TimelineEventType, EventTypeConfig> = {
  encounter: { type: "encounter", label: "Encounter", color: "#2563eb", bgColor: "#dbeafe", icon: "EN" },
  observation: { type: "observation", label: "Observation", color: "#16a34a", bgColor: "#dcfce7", icon: "OB" },
  study: { type: "study", label: "Study", color: "#0f766e", bgColor: "#ccfbf1", icon: "ST" },
  lab: { type: "lab", label: "Lab", color: "#ea580c", bgColor: "#ffedd5", icon: "LB" },
  medication: { type: "medication", label: "Medication", color: "#dc2626", bgColor: "#fee2e2", icon: "RX" },
  condition: { type: "condition", label: "Condition", color: "#ca8a04", bgColor: "#fef9c3", icon: "DX" },
  finding: { type: "finding", label: "Finding", color: "#0891b2", bgColor: "#cffafe", icon: "FD" }
};

export const ALL_EVENT_TYPES: TimelineEventType[] = Object.keys(EVENT_TYPE_CONFIGS) as TimelineEventType[];
