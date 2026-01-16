/**
 * ModalityLink Component
 * 
 * Displays a visual link between modalities showing their relationship.
 */

import React from "react";

interface ModalityLinkProps {
  sourceLabel: string;
  targetLabel: string;
  relationshipType: string;
  confidence?: number;
  onClick?: () => void;
}

/**
 * Visual styles for different relationship types
 */
const relationshipStyles: Record<string, { color: string; label: string }> = {
  matches: { color: "#4CAF50", label: "matches" },
  derived_from: { color: "#2196F3", label: "derived from" },
  correlates_with: { color: "#FF9800", label: "correlates with" },
  supports: { color: "#9C27B0", label: "supports" },
  treats: { color: "#00BCD4", label: "treats" },
  related: { color: "#607D8B", label: "related to" }
};

export const ModalityLink: React.FC<ModalityLinkProps> = ({
  sourceLabel,
  targetLabel,
  relationshipType,
  confidence,
  onClick
}) => {
  const style = relationshipStyles[relationshipType] || relationshipStyles.related;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 8,
        background: `${style.color}10`,
        border: `1px solid ${style.color}30`,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.background = `${style.color}20`;
          e.currentTarget.style.transform = "translateX(2px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = `${style.color}10`;
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      {/* Source */}
      <span style={{ 
        fontWeight: 500, 
        color: "#333",
        maxWidth: 150,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }}>
        {sourceLabel}
      </span>

      {/* Arrow and relationship */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 4,
        color: style.color
      }}>
        <span style={{ fontSize: 12 }}>—[</span>
        <span style={{ fontSize: 11, fontWeight: 500 }}>{style.label}</span>
        <span style={{ fontSize: 12 }}>]→</span>
      </div>

      {/* Target */}
      <span style={{ 
        fontWeight: 500, 
        color: "#333",
        maxWidth: 150,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }}>
        {targetLabel}
      </span>

      {/* Confidence badge */}
      {confidence !== undefined && (
        <span style={{
          marginLeft: "auto",
          padding: "2px 6px",
          borderRadius: 4,
          background: style.color,
          color: "white",
          fontSize: 11,
          fontWeight: 500
        }}>
          {Math.round(confidence * 100)}%
        </span>
      )}
    </div>
  );
};

/**
 * Compact modality link for inline use
 */
export const ModalityLinkCompact: React.FC<{
  type: string;
  label: string;
  onClick?: () => void;
}> = ({ type, label, onClick }) => {
  const typeColors: Record<string, string> = {
    imaging: "#E91E63",
    text: "#3F51B5",
    lab: "#009688",
    note: "#3F51B5",
    study: "#E91E63"
  };

  const color = typeColors[type.toLowerCase()] || "#607D8B";

  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 12,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        fontSize: 12,
        color: color,
        cursor: onClick ? "pointer" : "default"
      }}
    >
      <span style={{ 
        width: 6, 
        height: 6, 
        borderRadius: "50%", 
        background: color 
      }} />
      {label}
    </span>
  );
};

export default ModalityLink;
