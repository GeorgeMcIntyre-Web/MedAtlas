/**
 * Demo API Types
 * 
 * Request and response types for the demo API endpoints.
 */

import type { MedAtlasOutput } from "@medatlas/schemas/types";

/**
 * Demo case info
 */
export interface DemoCaseInfo {
  caseId: string;
  title: string;
  description: string;
  modalities: string[];
  createdAt: string;
}

/**
 * Demo cases list response
 */
export interface DemoCasesResponse {
  cases: DemoCaseInfo[];
  totalCount: number;
}

/**
 * Demo case response
 */
export interface DemoCaseResponse {
  caseInfo: DemoCaseInfo;
  output: MedAtlasOutput;
  graphStats?: {
    nodeCount: number;
    edgeCount: number;
  };
}

/**
 * Generate demo request
 */
export interface GenerateDemoRequest {
  scenario?: "pulmonary" | "cardiac" | "inflammation" | "random";
  includeGraph?: boolean;
}

/**
 * Generate demo response
 */
export interface GenerateDemoResponse {
  caseInfo: DemoCaseInfo;
  output: MedAtlasOutput;
  message: string;
}
