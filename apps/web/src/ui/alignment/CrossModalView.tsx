/**
 * CrossModalView Component
 * 
 * Main component for displaying cross-modal alignments.
 * Shows how findings from different modalities (imaging, text, lab) align.
 */

import React, { useState } from "react";
import type { CrossModalAlignment, ModalityData } from "./types.js";
import { ModalityLinkCompact } from "./ModalityLink.js";

interface CrossModalViewProps {
  alignment: CrossModalAlignment;
  onModalityClick?: (modality: string, nodeId: string) => void;
  onEvidenceClick?: (source: string, id: string) => void;
}

/**
 * Modality type icons and colors
 */
const modalityConfig: Record<string, { icon: string; color: string; label: string }> = {
  imaging: { icon: "🔬", color: "#E91E63", label: "Imaging" },
  text: { icon: "📄", color: "#3F51B5", label: "Clinical Note" },
  lab: { icon: "🧪", color: "#009688", label: "Lab Result" }
};

export const CrossModalView: React.FC<CrossModalViewProps> = ({
  alignment,
  onModalityClick,
  onEvidenceClick
}) => {
  const [expanded, setExpanded] = useState(false);
  const modalityCount = Object.keys(alignment.modalities).filter(
    k => alignment.modalities[k as keyof ModalityData] !== undefined
  ).length;

  return (
    <div style={{
      border: "1px solid #e0e0e0",
      borderRadius: 12,
      background: "white",
      overflow: "hidden"
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 16,
          background: "#fafafa",
          cursor: "pointer",
          borderBottom: expanded ? "1px solid #e0e0e0" : "none"
        }}
      >
        {/* Finding indicator */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#F44336",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 600,
          fontSize: 18
        }}>
          F
        </div>

        {/* Finding info */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: "#333" }}>
            {alignment.findingLabel}
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>
            {modalityCount} modalit{modalityCount === 1 ? "y" : "ies"} aligned
          </div>
        </div>

        {/* Confidence badge */}
        <div style={{
          padding: "4px 10px",
          borderRadius: 16,
          background: getConfidenceColor(alignment.confidence),
          color: "white",
          fontSize: 12,
          fontWeight: 600
        }}>
          {Math.round(alignment.confidence * 100)}% confidence
        </div>

        {/* Expand indicator */}
        <div style={{
          color: "#666",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease"
        }}>
          ▼
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: 16 }}>
          {/* Modality cards */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
            gap: 12,
            marginBottom: 16
          }}>
            {alignment.modalities.imaging && (
              <ModalityCard
                type="imaging"
                data={alignment.modalities.imaging}
                onClick={() => onModalityClick?.("imaging", alignment.modalities.imaging!.nodeId)}
              />
            )}
            {alignment.modalities.text && (
              <ModalityCard
                type="text"
                data={alignment.modalities.text}
                onClick={() => onModalityClick?.("text", alignment.modalities.text!.nodeId)}
              />
            )}
            {alignment.modalities.lab && (
              <ModalityCard
                type="lab"
                data={alignment.modalities.lab}
                onClick={() => onModalityClick?.("lab", alignment.modalities.lab!.nodeId)}
              />
            )}
          </div>

          {/* Evidence sources */}
          <div style={{ marginTop: 12 }}>
            <div style={{ 
              fontSize: 12, 
              fontWeight: 600, 
              color: "#666",
              marginBottom: 8
            }}>
              Evidence Sources ({alignment.evidence.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {alignment.evidence.map((ev, i) => (
                <ModalityLinkCompact
                  key={`${ev.source}-${ev.id}-${i}`}
                  type={ev.source}
                  label={`${ev.source}:${ev.id}`}
                  onClick={() => onEvidenceClick?.(ev.source, ev.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Get color based on confidence level
 */
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "#4CAF50";
  if (confidence >= 0.6) return "#FF9800";
  return "#F44336";
}

/**
 * Modality card component
 */
interface ModalityCardProps {
  type: "imaging" | "text" | "lab";
  data: ModalityData["imaging"] | ModalityData["text"] | ModalityData["lab"];
  onClick?: () => void;
}

const ModalityCard: React.FC<ModalityCardProps> = ({ type, data, onClick }) => {
  const config = modalityConfig[type];

  return (
    <div
      onClick={onClick}
      style={{
        padding: 12,
        borderRadius: 8,
        background: `${config.color}08`,
        border: `1px solid ${config.color}30`,
        cursor: onClick ? "pointer" : "default"
      }}
    >
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 8,
        marginBottom: 8
      }}>
        <span style={{ fontSize: 18 }}>{config.icon}</span>
        <span style={{ 
          fontWeight: 600, 
          color: config.color,
          fontSize: 13
        }}>
          {config.label}
        </span>
      </div>

      {type === "imaging" && isImagingData(data) && (
        <div style={{ fontSize: 13 }}>
          {data.description && <div>{data.description}</div>}
          {data.location?.anatomy && (
            <div style={{ color: "#666" }}>
              Location: {data.location.anatomy}
            </div>
          )}
        </div>
      )}

      {type === "text" && isTextData(data) && (
        <div style={{ fontSize: 13 }}>
          <div style={{ 
            fontStyle: "italic",
            color: "#555",
            maxHeight: 60,
            overflow: "hidden"
          }}>
            "{data.excerpt}"
          </div>
          {data.documentType && (
            <div style={{ color: "#666", marginTop: 4 }}>
              {data.documentType}
            </div>
          )}
        </div>
      )}

      {type === "lab" && isLabData(data) && (
        <div style={{ fontSize: 13 }}>
          <div style={{ 
            fontWeight: 600,
            color: data.isAbnormal ? "#F44336" : "#333"
          }}>
            {data.value} {data.unit}
            {data.isAbnormal && <span style={{ marginLeft: 4 }}>⚠️</span>}
          </div>
          {data.referenceRange && (
            <div style={{ color: "#666" }}>
              Ref: {data.referenceRange.low}-{data.referenceRange.high} {data.unit}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Type guards
function isImagingData(data: unknown): data is NonNullable<ModalityData["imaging"]> {
  return data !== null && typeof data === "object" && "nodeId" in data;
}

function isTextData(data: unknown): data is NonNullable<ModalityData["text"]> {
  return data !== null && typeof data === "object" && "excerpt" in data;
}

function isLabData(data: unknown): data is NonNullable<ModalityData["lab"]> {
  return data !== null && typeof data === "object" && "value" in data;
}

/**
 * Empty state component
 */
export const CrossModalEmpty: React.FC<{ message?: string }> = ({ 
  message = "No alignments found" 
}) => (
  <div style={{
    padding: 32,
    textAlign: "center",
    color: "#666",
    background: "#f5f5f5",
    borderRadius: 12
  }}>
    <div style={{ fontSize: 48, marginBottom: 12 }}>🔗</div>
    <div>{message}</div>
  </div>
);

/**
 * Loading state component
 */
export const CrossModalLoading: React.FC = () => (
  <div style={{
    padding: 32,
    textAlign: "center",
    color: "#666"
  }}>
    <div style={{ 
      display: "inline-block",
      animation: "spin 1s linear infinite"
    }}>
      ⏳
    </div>
    <div style={{ marginTop: 8 }}>Loading alignments...</div>
    <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default CrossModalView;
