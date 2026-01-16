import React, { useEffect, useMemo, useState } from "react";
import type { MedAtlasOutput } from "@medatlas/schemas/types";

const apiBase = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8787";

type LoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; data: MedAtlasOutput }
  | { kind: "error"; message: string };

export const App = () => {
  const [state, setState] = useState<LoadState>({ kind: "idle" });

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
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 980, margin: "0 auto" }}>
      <h1>{title}</h1>
      <p style={{ opacity: 0.8 }}>
        Cloudflare Worker API → schema-shaped output → UI wiring.
      </p>

      {state.kind === "loading" ? <p>Loading…</p> : null}

      {state.kind === "error" ? (
        <p style={{ color: "crimson" }}>Error: {state.message}</p>
      ) : null}

      {state.kind === "loaded" ? <CaseView data={state.data} /> : null}
    </div>
  );
};

const CaseView = ({ data }: { data: MedAtlasOutput }) => {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card title="Case">
        <Row k="caseId" v={data.caseId} />
        <Row k="modalities" v={data.modalities.join(", ")} />
      </Card>

      <Card title="Summary">
        <p>{data.summary}</p>
      </Card>

      <Card title="Findings">
        <ul>
          {data.findings.map((f, i) => (
            <li key={`${f.label}-${i}`}>
              <b>{f.label}</b>
              {f.probability === undefined ? null : <span> — p={f.probability}</span>}
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Uncertainty">
        <Row k="level" v={data.uncertainty.level} />
        <ul>
          {data.uncertainty.reasons.map((r, i) => (
            <li key={`${r}-${i}`}>{r}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 16,
        padding: 16,
        background: "white",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)"
      }}
    >
      <h2 style={{ marginTop: 0 }}>{title}</h2>
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
