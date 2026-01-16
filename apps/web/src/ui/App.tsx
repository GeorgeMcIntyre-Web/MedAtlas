import React, { useEffect, useMemo, useState } from "react";
import type { MedAtlasOutput } from "@medatlas/schemas/types";
import { TimelineView } from "./timeline";
import { CrossModalView } from "./alignment";

const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8787";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; data: MedAtlasOutput }
  | { kind: "error"; message: string };

type DemoCaseSummary = {
  id: string;
  patientId: string;
  description: string;
  encounterCount: number;
};

type DemoCaseResponse = {
  case?: {
    patient?: { id: string };
  };
  interpretation?: MedAtlasOutput;
};

export const App = () => {
  const [state, setState] = useState<LoadState>({ kind: "idle" });
  const [view, setView] = useState<"timeline" | "case" | "alignment">("timeline");
  const [cases, setCases] = useState<DemoCaseSummary[]>([]);
  const [caseId, setCaseId] = useState("cardiac-001");
  const [patientId, setPatientId] = useState("patient-001");

  const title = useMemo(() => "MedAtlas", []);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`${apiBase}/demo/cases`);
        if (!res.ok) return;
        const payload = (await res.json()) as { cases?: DemoCaseSummary[] };
        if (Array.isArray(payload.cases)) {
          setCases(payload.cases);
          const selected = payload.cases.find(item => item.id === caseId) ?? payload.cases[0];
          if (selected) {
            setCaseId(selected.id);
            setPatientId(selected.patientId);
          }
        }
      } catch {
        // Leave default case selection if demo case list fails.
      }
    };

    void run();
  }, []);

  useEffect(() => {
    const run = async () => {
      setState({ kind: "loading" });

      try {
        const res = await fetch(`${apiBase}/demo/case/${caseId}`);

        if (!res.ok) {
          setState({ kind: "error", message: `API error: ${res.status}` });
          return;
        }

        const json = (await res.json()) as DemoCaseResponse;
        if (!json.interpretation) {
          setState({ kind: "error", message: "Missing interpretation in demo response." });
          return;
        }
        if (json.case?.patient?.id) {
          setPatientId(json.case.patient.id);
        }
        setState({ kind: "loaded", data: json.interpretation });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setState({ kind: "error", message });
      }
    };

    void run();
  }, [caseId]);

  return (
    <div className="ma-shell" style={styles.shell}>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap");
        :root {
          --ink: #0f172a;
          --muted: #64748b;
          --panel: #ffffff;
          --stroke: #e2e8f0;
          --wash: #f8fafc;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 960px) {
          .ma-header { flex-direction: column; align-items: flex-start; }
          .ma-nav { margin-left: 0; }
          .ma-meta { width: 100%; }
          .ma-main { padding: 16px; }
        }
      `}</style>
      <header className="ma-header" style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logoMark}>MA</div>
          <div>
            <h1 style={styles.logo}>{title}</h1>
            <p style={styles.tagline}>Clinical graph intelligence for rapid navigation.</p>
          </div>
        </div>
        <nav className="ma-nav" style={styles.nav}>
          <button onClick={() => setView("timeline")} style={view === "timeline" ? styles.activeTab : styles.tab}>
            Timeline
          </button>
          <button onClick={() => setView("case")} style={view === "case" ? styles.activeTab : styles.tab}>
            Case View
          </button>
          <button onClick={() => setView("alignment")} style={view === "alignment" ? styles.activeTab : styles.tab}>
            Alignment
          </button>
        </nav>
        <div className="ma-meta" style={styles.meta}>
          <span style={styles.metaLabel}>Case</span>
          <select value={caseId} onChange={(e) => setCaseId(e.target.value)} style={styles.select}>
            {cases.length === 0 ? (
              <option value={caseId}>Loading...</option>
            ) : (
              cases.map(item => (
                <option key={item.id} value={item.id}>
                  {item.id} · {item.description}
                </option>
              ))
            )}
          </select>
        </div>
      </header>

      <main className="ma-main" style={styles.main}>
        {view === "timeline" ? (
          <TimelineView patientId={patientId} />
        ) : null}
        {view === "alignment" ? (
          <CrossModalView patientId={patientId} />
        ) : null}
        {view === "case" ? (
          <CaseViewWrapper state={state} />
        ) : null}
      </main>
    </div>
  );
};

const CaseViewWrapper = ({ state }: { state: LoadState }) => {
  if (state.kind === "loading") return <p>Loading case view...</p>;
  if (state.kind === "error") return <p style={{ color: "#b91c1c" }}>Error: {state.message}</p>;
  if (state.kind !== "loaded") return null;
  return <CaseView data={state.data} />;
};

const CaseView = ({ data }: { data: MedAtlasOutput }) => {
  return (
    <div style={{ display: "grid", gap: 16, animation: "fadeUp 0.6s ease" }}>
      <Card title="Case">
        <Row k="caseId" v={data.caseId} />
        <Row k="modalities" v={data.modalities.join(", ")} />
      </Card>

      <Card title="Summary">
        <p>{data.summary}</p>
      </Card>

      <Card title="Findings">
        <ul>
          {data.findings.map((finding, i) => (
            <li key={`${finding.label}-${i}`}>
              <b>{finding.label}</b>
              {finding.probability === undefined ? null : <span> - p={finding.probability}</span>}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Uncertainty">
        <Row k="level" v={data.uncertainty.level} />
        <ul>
          {data.uncertainty.reasons.map((reason, i) => (
            <li key={`${reason}-${i}`}>{reason}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>{title}</h2>
      {children}
    </div>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{ width: 120, opacity: 0.7 }}>{k}</div>
      <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{v}</div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  shell: {
    fontFamily: "\"Space Grotesk\", sans-serif",
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #e0f2fe 0%, #f8fafc 45%, #fef3c7 100%)",
    color: "#0f172a"
  },
  header: {
    display: "flex",
    alignItems: "center",
    padding: "16px 24px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderBottom: "1px solid rgba(148, 163, 184, 0.3)",
    gap: 24,
    flexWrap: "wrap"
  },
  brand: { display: "flex", alignItems: "center", gap: 12 },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: 1
  },
  logo: { margin: 0, fontSize: 20, fontWeight: 700 },
  tagline: { margin: 0, fontSize: 12, color: "#64748b" },
  nav: { display: "flex", gap: 8, marginLeft: 16, flexWrap: "wrap" },
  meta: { marginLeft: "auto", display: "flex", flexDirection: "column", gap: 6 },
  metaLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8" },
  tab: {
    padding: "8px 16px",
    background: "none",
    border: "1px solid transparent",
    cursor: "pointer",
    borderRadius: 999,
    color: "#64748b",
    fontWeight: 600
  },
  activeTab: {
    padding: "8px 16px",
    backgroundColor: "#0f172a",
    border: "1px solid #0f172a",
    cursor: "pointer",
    borderRadius: 999,
    color: "white",
    fontWeight: 600
  },
  select: {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    backgroundColor: "white"
  },
  main: { padding: 24, animation: "fadeUp 0.6s ease" },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 16,
    background: "white",
    boxShadow: "0 12px 32px rgba(15, 23, 42, 0.08)"
  },
  cardTitle: { marginTop: 0 }
};
