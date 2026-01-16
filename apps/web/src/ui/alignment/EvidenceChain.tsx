import React from "react";
import type { EvidenceChain as TChain, SourceArtifact } from "./types";

interface Props {
  chain: TChain;
  artifacts: SourceArtifact[];
}

export const EvidenceChain: React.FC<Props> = ({ chain, artifacts }) => {
  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h4 style={styles.title}>Chain</h4>
        {chain.chain.length === 0 ? (
          <p style={styles.empty}>No evidence chain available.</p>
        ) : (
          <ol style={styles.list}>
            {chain.chain.map((step, index) => (
              <li key={`${step.nodeId}-${index}`} style={styles.listItem}>
                <span style={styles.badge}>{step.nodeType ?? "node"}</span>
                <div>
                  <div style={styles.label}>{step.label ?? step.nodeId}</div>
                  <div style={styles.meta}>{step.relationship}</div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div style={styles.section}>
        <h4 style={styles.title}>Source Artifacts</h4>
        {artifacts.length === 0 ? (
          <p style={styles.empty}>No artifacts available.</p>
        ) : (
          <ul style={styles.artifacts}>
            {artifacts.map((artifact) => (
              <li key={artifact.id} style={styles.artifactItem}>
                <div style={styles.label}>{artifact.title}</div>
                {artifact.capturedAt && <div style={styles.meta}>{artifact.capturedAt}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: "grid", gap: 16 },
  section: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "white",
    border: "1px solid #e2e8f0"
  },
  title: { margin: "0 0 8px", fontSize: 14, textTransform: "uppercase", letterSpacing: 1, color: "#64748b" },
  empty: { margin: 0, color: "#94a3b8", fontStyle: "italic" },
  list: { margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 },
  listItem: { display: "flex", gap: 10, alignItems: "center" },
  badge: {
    padding: "4px 8px",
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  label: { fontSize: 14, fontWeight: 600, color: "#0f172a" },
  meta: { fontSize: 12, color: "#64748b" },
  artifacts: { margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 },
  artifactItem: { padding: 10, borderRadius: 10, backgroundColor: "#f8fafc" }
};
