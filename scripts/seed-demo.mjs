import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const outDir = new URL("../data/synthetic/", import.meta.url);
const outPath = join(outDir.pathname, "demo-case.json");

const now = new Date().toISOString();

const demo = {
  caseId: "demo-001",
  createdAt: now,
  artifacts: {
    "note-001": {
      type: "note",
      text: "Patient reports intermittent headache for two days. No focal deficits described.",
      capturedAt: now
    },
    "lab-001": {
      type: "lab",
      name: "CRP",
      value: 12.4,
      unit: "mg/L",
      capturedAt: now
    },
    "synthetic-obs-001": {
      type: "synthetic",
      text: "Demo observation node for UI wiring.",
      capturedAt: now
    }
  }
};

await writeFile(outPath, JSON.stringify(demo, null, 2), "utf-8");
console.log(`Wrote ${outPath}`);
