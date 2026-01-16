import React, { useEffect, useMemo, useState } from "react";
import type { MedAtlasOutput } from "@medatlas/schemas/types";
import { TimelineView } from "./timeline";

const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8787";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; data: MedAtlasOutput }
  | { kind: "error"; message: string };

type ViewMode = "timeline" | "case" | "both";

export const App = () => {
  const [state, setState] = useState<LoadState>({ kind: "idle" });
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [patientId, setPatientId] = useState("patient-001");

  const title = useMemo(() => "MedAtlas — Demo", []);

  useEffect(() => {
    const run = async () => {
      setState({ kind: "loading" });

      try {
        const res = await fetch(`${apiBase}/demo/case`);

        if (res.ok === false) {
          setState({ kind: "error", message: `API error: ${res.status}` });
          return;
        }

        const json = (await res.json()) as MedAtlasOutput;
        setState({ kind: "loaded", data: json });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setState({ kind: "error", message });
      }
    };

    void run();
  }, []);

  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>{title}</h1>
          <p style={{ opacity: 0.8, margin: 0, marginTop: 4 }}>
            Atlas Graph + Timeline Navigation + AI Reasoning Demo
          </p>
        </div>

        {/* View mode toggle */}
        <div style={{ display: "flex", gap: 8 }}>
          <ViewToggle
            label="Timeline"
            isActive={viewMode === "timeline" || viewMode === "both"}
            onClick={() => setViewMode(viewMode === "timeline" ? "both" : viewMode === "both" ? "case" : "timeline")}
          />
          <ViewToggle
            label="Case View"
            isActive={viewMode === "case" || viewMode === "both"}
            onClick={() => setViewMode(viewMode === "case" ? "both" : viewMode === "both" ? "timeline" : "case")}
          />
        </div>
      </div>

      {/* Patient selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>Patient ID:</span>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              fontSize: 14,
              backgroundColor: "white",
            }}
          >
            <option value="patient-001">patient-001 (Demo Patient)</option>
            <option value="patient-002">patient-002 (Secondary Demo)</option>
          </select>
        </label>
      </div>

      {/* Main content */}
      <div style={{ display: "grid", gap: 24, gridTemplateColumns: viewMode === "both" ? "1fr 1fr" : "1fr" }}>
        {/* Timeline View */}
        {(viewMode === "timeline" || viewMode === "both") && (
          <div
            style={{
              backgroundColor: "#fafafa",
              borderRadius: 16,
              padding: 24,
              border: "1px solid #e5e7eb",
            }}
          >
            <TimelineView patientId={patientId} />
          </div>
        )}

        {/* Case View */}
        {(viewMode === "case" || viewMode === "both") && (
          <div>
            {state.kind === "loading" ? <p>Loading case data…</p> : null}

            {state.kind === "error" ? (
              <p style={{ color: "crimson" }}>Error: {state.message}</p>
            ) : null}

            {state.kind === "loaded" ? <CaseView data={state.data} /> : null}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * View toggle button
 */
const ViewToggle = ({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 16px",
      borderRadius: 8,
      border: `1px solid ${isActive ? "#3b82f6" : "#e5e7eb"}`,
      backgroundColor: isActive ? "#eff6ff" : "white",
      color: isActive ? "#2563eb" : "#6b7280",
      fontSize: 13,
      fontWeight: 500,
      cursor: "pointer",
      transition: "all 0.15s ease",
    }}
  >
    {label}
  </button>
);

/**
 * Case view showing MedAtlasOutput data
 */
const CaseView = ({ data }: { data: MedAtlasOutput }) => {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card title="Case">
        <Row k="caseId" v={data.caseId} />
        <Row k="modalities" v={data.modalities.join(", ")} />
      </Card>

      <Card title="Summary">
        <p style={{ margin: 0, lineHeight: 1.6 }}>{data.summary}</p>
      </Card>

      <Card title="Findings">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {data.findings.map((f, i) => (
            <li key={`${f.label}-${i}`} style={{ marginBottom: 8 }}>
              <b>{f.label}</b>
              {f.probability !== undefined && (
                <span
                  style={{
                    marginLeft: 8,
                    padding: "2px 8px",
                    borderRadius: 12,
                    backgroundColor: "#f3f4f6",
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  p={f.probability.toFixed(2)}
                </span>
              )}
              {f.evidence.length > 0 && (
                <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                  Evidence: {f.evidence.map((e) => `${e.source}:${e.id}`).join(", ")}
                </div>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Extracted Entities">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {data.extractedEntities.map((e, i) => (
            <span
              key={`${e.type}-${e.text}-${i}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 16,
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                fontSize: 13,
              }}
            >
              <span style={{ fontWeight: 500, color: "#166534" }}>{e.type}:</span>
              <span style={{ color: "#15803d" }}>{e.text}</span>
              {e.value !== undefined && (
                <span style={{ color: "#6b7280" }}>
                  ({e.value}
                  {e.unit ? ` ${e.unit}` : ""})
                </span>
              )}
            </span>
          ))}
        </div>
      </Card>

      <Card title="Recommendations">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {data.recommendations.map((r, i) => (
            <li key={`${r}-${i}`} style={{ marginBottom: 4, color: "#374151" }}>
              {r}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Uncertainty">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontWeight: 500 }}>Level:</span>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 16,
              backgroundColor:
                data.uncertainty.level === "high"
                  ? "#fee2e2"
                  : data.uncertainty.level === "medium"
                    ? "#fef3c7"
                    : "#dcfce7",
              color:
                data.uncertainty.level === "high"
                  ? "#991b1b"
                  : data.uncertainty.level === "medium"
                    ? "#92400e"
                    : "#166534",
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            {data.uncertainty.level.toUpperCase()}
          </span>
        </div>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {data.uncertainty.reasons.map((r, i) => (
            <li key={`${r}-${i}`} style={{ color: "#6b7280", fontSize: 14 }}>
              {r}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Safety">
        <div style={{ display: "flex", gap: 16 }}>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 8,
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              fontSize: 12,
              color: "#991b1b",
            }}
          >
            ⚠️ Not Medical Advice
          </span>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 8,
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              fontSize: 12,
              color: "#991b1b",
            }}
          >
            👨‍⚕️ Requires Clinician Review
          </span>
        </div>
      </Card>
    </div>
  );
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 16,
        background: "white",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 16, fontWeight: 600, color: "#111827" }}>
        {title}
      </h2>
      {children}
    </div>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
      <div style={{ width: 100, opacity: 0.7, fontSize: 14 }}>{k}</div>
      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 14 }}>
        {v}
      </div>
    </div>
  );
};
