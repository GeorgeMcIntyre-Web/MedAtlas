import { useState, useEffect, useCallback } from "react";
import type { CrossModalAlignment, EvidenceChain, SourceArtifact } from "./types";

const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8787";

export interface CrossModalState {
  alignments: CrossModalAlignment[];
  selectedAlignment: CrossModalAlignment | null;
  evidenceChain: EvidenceChain | null;
  sourceArtifacts: SourceArtifact[];
  loading: boolean;
  error: string | null;
}

export function useCrossModal(patientId: string) {
  const [state, setState] = useState<CrossModalState>({
    alignments: [],
    selectedAlignment: null,
    evidenceChain: null,
    sourceArtifacts: [],
    loading: false,
    error: null
  });

  const fetchAlignments = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(`${apiBase}/alignment/findings?patientId=${patientId}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setState(prev => ({ ...prev, alignments: data.alignments ?? [], loading: false }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Unknown error",
        loading: false
      }));
    }
  }, [patientId]);

  const selectAlignment = useCallback(async (alignment: CrossModalAlignment) => {
    setState(prev => ({ ...prev, selectedAlignment: alignment, loading: true }));
    try {
      const res = await fetch(`${apiBase}/evidence-chain/${alignment.findingId}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setState(prev => ({
        ...prev,
        evidenceChain: data.chain,
        sourceArtifacts: data.sourceArtifacts ?? [],
        loading: false
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Unknown error",
        loading: false
      }));
    }
  }, []);

  useEffect(() => { void fetchAlignments(); }, [fetchAlignments]);

  return { ...state, fetchAlignments, selectAlignment };
}
