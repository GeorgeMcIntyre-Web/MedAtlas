/**
 * Cross-Modal Alignment Hook
 * 
 * React hook for fetching and managing cross-modal alignment data.
 */

import { useState, useEffect, useCallback } from "react";
import type { 
  CrossModalAlignment, 
  EvidenceChain, 
  SourceArtifact,
  AlignmentResponse,
  EvidenceChainResponse,
  FindingInfo
} from "./types.js";

const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8787";

/**
 * State for alignment data
 */
interface AlignmentState {
  alignments: CrossModalAlignment[];
  isLoading: boolean;
  error: string | null;
}

/**
 * State for evidence chain data
 */
interface EvidenceChainState {
  chain: EvidenceChain | null;
  sourceArtifacts: SourceArtifact[];
  isLoading: boolean;
  error: string | null;
}

/**
 * State for findings list
 */
interface FindingsState {
  findings: FindingInfo[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for fetching cross-modal alignments
 */
export function useAlignments(findingId: string | null) {
  const [state, setState] = useState<AlignmentState>({
    alignments: [],
    isLoading: false,
    error: null
  });

  const fetchAlignments = useCallback(async () => {
    if (!findingId) {
      setState({ alignments: [], isLoading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiBase}/alignment/${encodeURIComponent(findingId)}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: AlignmentResponse = await response.json();
      setState({
        alignments: data.alignments,
        isLoading: false,
        error: null
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch alignments";
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message
      }));
    }
  }, [findingId]);

  useEffect(() => {
    fetchAlignments();
  }, [fetchAlignments]);

  return {
    ...state,
    refetch: fetchAlignments
  };
}

/**
 * Hook for fetching evidence chains
 */
export function useEvidenceChain(nodeId: string | null, maxDepth: number = 5) {
  const [state, setState] = useState<EvidenceChainState>({
    chain: null,
    sourceArtifacts: [],
    isLoading: false,
    error: null
  });

  const fetchChain = useCallback(async () => {
    if (!nodeId) {
      setState({ chain: null, sourceArtifacts: [], isLoading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(
        `${apiBase}/evidence-chain/${encodeURIComponent(nodeId)}?maxDepth=${maxDepth}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: EvidenceChainResponse = await response.json();
      setState({
        chain: data.chain,
        sourceArtifacts: data.sourceArtifacts,
        isLoading: false,
        error: null
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch evidence chain";
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message
      }));
    }
  }, [nodeId, maxDepth]);

  useEffect(() => {
    fetchChain();
  }, [fetchChain]);

  return {
    ...state,
    refetch: fetchChain
  };
}

/**
 * Hook for fetching available findings
 */
export function useFindings() {
  const [state, setState] = useState<FindingsState>({
    findings: [],
    isLoading: false,
    error: null
  });

  const fetchFindings = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiBase}/alignment/findings`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: { findings: FindingInfo[] } = await response.json();
      setState({
        findings: data.findings,
        isLoading: false,
        error: null
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch findings";
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message
      }));
    }
  }, []);

  useEffect(() => {
    fetchFindings();
  }, [fetchFindings]);

  return {
    ...state,
    refetch: fetchFindings
  };
}

/**
 * Hook for managing cross-modal view state
 */
export function useCrossModalView() {
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { findings, isLoading: findingsLoading, error: findingsError } = useFindings();
  const { alignments, isLoading: alignmentsLoading, error: alignmentsError } = useAlignments(selectedFindingId);
  const { chain, sourceArtifacts, isLoading: chainLoading, error: chainError } = useEvidenceChain(selectedNodeId);

  return {
    // Selection state
    selectedFindingId,
    setSelectedFindingId,
    selectedNodeId,
    setSelectedNodeId,

    // Findings
    findings,
    findingsLoading,
    findingsError,

    // Alignments
    alignments,
    alignmentsLoading,
    alignmentsError,

    // Evidence chain
    chain,
    sourceArtifacts,
    chainLoading,
    chainError,

    // Combined loading state
    isLoading: findingsLoading || alignmentsLoading || chainLoading,
    error: findingsError || alignmentsError || chainError
  };
}
