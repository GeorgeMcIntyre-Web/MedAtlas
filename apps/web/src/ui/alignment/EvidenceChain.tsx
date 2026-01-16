/**
 * EvidenceChain Component
 * 
 * Visualizes an evidence chain as a connected series of nodes.
 */

import React from "react";
import type { EvidenceChain as EvidenceChainType, SourceArtifact } from "./types.js";

interface EvidenceChainProps {
  chain: EvidenceChainType;
  sourceArtifacts?: SourceArtifact[];
  onNodeClick?: (nodeId: string) => void;
  onArtifactClick?: (artifact: SourceArtifact) => void;
}

/**
 * Colors for different node types
 */
const nodeTypeColors: Record<string, string> = {
  finding: "#F44336",
  imaging: "#E91E63",
  study: "#E91E63",
  note: "#3F51B5",
  text: "#3F51B5",
  lab: "#009688",
  condition: "#FF9800",
  medication: "#00BCD4",
  symptom: "#9C27B0",
  patient: "#607D8B"
};

/**
 * Get color for a node type
 */
const getNodeColor = (nodeType?: string): string => {
  if (!nodeType) return "#607D8B";
  return nodeTypeColors[nodeType.toLowerCase()] || "#607D8B";
};

export const EvidenceChainView: React.FC<EvidenceChainProps> = ({
  chain,
  sourceArtifacts = [],
  onNodeClick,
  onArtifactClick
}) => {
  if (chain.chain.length === 0) {
    return (
      <div style={{ padding: 16, color: "#666", textAlign: "center" }}>
        No evidence chain available
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Chain title */}
      <div style={{ fontWeight: 600, color: "#333" }}>
        Evidence Chain from: {chain.rootLabel || chain.rootNodeId}
      </div>

      {/* Chain visualization */}
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: 0,
        padding: 16,
        background: "#f5f5f5",
        borderRadius: 12
      }}>
        {chain.chain.map((step, index) => {
          const color = getNodeColor(step.nodeType);
          const isFirst = index === 0;
          const isLast = index === chain.chain.length - 1;

          return (
            <div key={step.nodeId} style={{ display: "flex", flexDirection: "column" }}>
              {/* Connector line from previous */}
              {!isFirst && (
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  alignItems: "center",
                  paddingLeft: 24
                }}>
                  <div style={{
                    width: 2,
                    height: 16,
                    background: "#ccc"
                  }} />
                  <div style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: "#e0e0e0",
                    fontSize: 10,
                    color: "#666",
                    fontWeight: 500
                  }}>
                    {step.relationship}
                  </div>
                  <div style={{
                    width: 2,
                    height: 16,
                    background: "#ccc"
                  }} />
                </div>
              )}

              {/* Node */}
              <div
                onClick={() => onNodeClick?.(step.nodeId)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  background: "white",
                  borderRadius: 8,
                  border: `2px solid ${color}`,
                  cursor: onNodeClick ? "pointer" : "default",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (onNodeClick) {
                    e.currentTarget.style.transform = "translateX(4px)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Node type indicator */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: `${color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: color,
                  fontWeight: 600,
                  fontSize: 12,
                  flexShrink: 0
                }}>
                  {(step.nodeType || "?")[0].toUpperCase()}
                </div>

                {/* Node content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontWeight: 500, 
                    color: "#333",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {step.label || step.nodeId}
                  </div>
                  <div style={{ 
                    fontSize: 12, 
                    color: "#666",
                    display: "flex",
                    gap: 8
                  }}>
                    <span>{step.nodeType || "node"}</span>
                    {step.evidence.length > 0 && (
                      <span style={{ color: color }}>
                        {step.evidence.length} source{step.evidence.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Chain position indicator */}
                <div style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: isFirst ? color : "#e0e0e0",
                  color: isFirst ? "white" : "#666",
                  fontSize: 11,
                  fontWeight: 500
                }}>
                  {isFirst ? "Root" : `+${index}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Source artifacts */}
      {sourceArtifacts.length > 0 && (
        <div>
          <div style={{ 
            fontWeight: 600, 
            color: "#333", 
            marginBottom: 8,
            fontSize: 14
          }}>
            Source Artifacts ({sourceArtifacts.length})
          </div>
          <div style={{ 
            display: "flex", 
            flexWrap: "wrap", 
            gap: 8 
          }}>
            {sourceArtifacts.map((artifact) => (
              <div
                key={`${artifact.type}-${artifact.id}`}
                onClick={() => onArtifactClick?.(artifact)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: "#f0f0f0",
                  border: "1px solid #ddd",
                  cursor: onArtifactClick ? "pointer" : "default",
                  fontSize: 13
                }}
              >
                <div style={{ fontWeight: 500 }}>{artifact.title}</div>
                <div style={{ fontSize: 11, color: "#666" }}>
                  {artifact.type} • {artifact.id}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chain stats */}
      <div style={{ 
        display: "flex", 
        gap: 16, 
        fontSize: 12, 
        color: "#666" 
      }}>
        <span>Depth: {chain.depth}</span>
        <span>Nodes: {chain.chain.length}</span>
      </div>
    </div>
  );
};

export default EvidenceChainView;
