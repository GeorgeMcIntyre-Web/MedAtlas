import React from "react";
import { useCrossModal } from "./useCrossModal";
import { EvidenceChain } from "./EvidenceChain";
import { ModalityLink } from "./ModalityLink";

interface Props {
  patientId: string;
}

export const CrossModalView: React.FC<Props> = ({ patientId }) => {
  const {
    alignments,
    selectedAlignment,
    evidenceChain,
    sourceArtifacts,
    loading,
    error,
    selectAlignment
  } = useCrossModal(patientId);

  if (loading && alignments.length === 0) return <p>Loading alignments...</p>;
  if (error) return <p style={{ color: "#b91c1c" }}>Error: {error}</p>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Cross-Modal Alignments</h2>
        <p style={styles.subtitle}>Correlate imaging, labs, and notes to tighten clinical context.</p>
      </div>

      <div style={styles.grid}>
        <div style={styles.list}>
          <h3 style={styles.sectionTitle}>Findings</h3>
          {alignments.length === 0 ? (
            <p style={styles.empty}>No alignments found.</p>
          ) : (
            alignments.map(alignment => (
              <div
                key={alignment.findingId}
                onClick={() => selectAlignment(alignment)}
                style={{
                  ...styles.card,
                  borderColor: selectedAlignment?.findingId === alignment.findingId ? "#0f172a" : "#e2e8f0",
                  boxShadow: selectedAlignment?.findingId === alignment.findingId ? "0 12px 24px rgba(15, 23, 42, 0.12)" : "none"
                }}
              >
                <h4 style={styles.cardTitle}>{alignment.findingLabel}</h4>
                <p style={styles.confidence}>Confidence: {Math.round(alignment.confidence * 100)}%</p>
                <div style={styles.modalities}>
                  {alignment.modalities.imaging && <ModalityLink type="imaging" label="Imaging" />}
                  {alignment.modalities.lab && <ModalityLink type="lab" label="Lab" />}
                  {alignment.modalities.text && <ModalityLink type="text" label="Note" />}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={styles.detail}>
          {selectedAlignment && evidenceChain ? (
            <>
              <h3 style={styles.sectionTitle}>Evidence Chain</h3>
              <EvidenceChain chain={evidenceChain} artifacts={sourceArtifacts} />
            </>
          ) : (
            <p style={styles.empty}>Select a finding to explore the evidence chain.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 24 },
  header: { marginBottom: 16 },
  title: { margin: 0, fontSize: 24, fontWeight: 700 },
  subtitle: { margin: "4px 0 0", color: "#64748b", fontSize: 14 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  sectionTitle: { margin: "0 0 8px", fontSize: 14, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" },
  card: {
    padding: 16,
    borderRadius: 12,
    border: "2px solid",
    cursor: "pointer",
    backgroundColor: "white",
    transition: "border-color 0.2s, box-shadow 0.2s"
  },
  cardTitle: { margin: 0, fontSize: 16, fontWeight: 600 },
  confidence: { margin: "8px 0", fontSize: 13, color: "#64748b" },
  modalities: { display: "flex", gap: 8, flexWrap: "wrap" },
  detail: { padding: 16, backgroundColor: "rgba(255, 255, 255, 0.85)", borderRadius: 16, border: "1px solid #e2e8f0" },
  empty: { margin: 0, color: "#94a3b8", fontStyle: "italic" }
};
