# MedAtlas Synthetic Demo Data

This directory contains synthetic medical case data for demonstrating MedAtlas capabilities.

## Data Structure

Each demo case follows the `SyntheticCase` structure defined in `@medatlas/ingestion`:

```typescript
interface SyntheticCase {
  caseId: string;
  patient: {
    id: string;
    demographics: {
      age: number;
      gender: "male" | "female" | "other";
      birthDate?: string;
      mrn?: string;
    };
  };
  encounters: SyntheticEncounter[];
}
```

### Encounters

Each encounter contains:
- **observations**: Clinical observations and symptoms
- **vitals**: Vital signs (temperature, heart rate, BP, etc.)
- **labs**: Laboratory results with reference ranges
- **medications**: Prescribed and administered medications
- **conditions**: Diagnoses and clinical conditions
- **studies**: Imaging studies with findings
- **notes**: Clinical notes (progress, admission, discharge)
- **procedures**: Clinical procedures performed

## Demo Cases

### demo-case-001.json - Acute Appendicitis
A 45-year-old female presenting with right lower quadrant abdominal pain.
- **Encounters**: ED visit, surgical admission, post-op follow-up
- **Key Labs**: Elevated WBC and CRP
- **Imaging**: CT Abdomen/Pelvis showing appendicitis
- **Procedure**: Laparoscopic appendectomy
- **Cross-modal links**: CT findings correlate with inflammatory markers

### demo-case-002.json - Anterior STEMI
A 62-year-old male presenting with chest pain and STEMI.
- **Encounters**: ED visit, cardiac cath/PCI admission
- **Key Labs**: Elevated troponin, BNP
- **Imaging**: ECG with ST elevation, Chest X-ray, Echo, Cardiac cath
- **Procedure**: Primary PCI with stent placement
- **Cross-modal links**: ECG findings correlate with troponin elevation

## Cross-Modal Alignment

The synthetic data includes `crossModalRef` fields in findings that link to
corresponding lab values. This demonstrates the cross-modal alignment capability
of MedAtlas:

```json
{
  "id": "finding-001",
  "description": "Enlarged appendix with periappendiceal fat stranding",
  "crossModalRef": "lab-crp"  // Links to elevated CRP lab value
}
```

## Usage

### Ingesting Demo Data

```typescript
import { createSyntheticAdapter } from "@medatlas/ingestion";
import demoCase from "../data/synthetic/demo-case-001.json";

const adapter = createSyntheticAdapter();
const graphData = adapter.transform(demoCase, demoCase.caseId);

console.log(`Created ${graphData.nodes.length} nodes and ${graphData.edges.length} edges`);
```

### Generating Graph Data

Use the seed script to generate graph data from demo cases:

```bash
pnpm run demo:seed-graph
```

## Evidence References

All graph nodes include `EvidenceRef` links to source data:

- `source: "synthetic"` - Generated synthetic data
- `source: "lab"` - Laboratory results
- `source: "dicom"` - Imaging studies
- `source: "note"` - Clinical notes
- `source: "fhir"` - FHIR resources (when using FHIR adapter)

## Adding New Cases

1. Create a new JSON file following the `SyntheticCase` structure
2. Include realistic medical scenarios with:
   - Multiple encounters showing disease progression
   - Labs with abnormal values and reference ranges
   - Imaging studies with findings
   - Cross-modal references for alignment demo
3. Add the case to this README

## Notes

- All data is **synthetic** and does not represent real patients
- Medical scenarios are designed to be realistic for demonstration purposes
- Timestamps are in ISO 8601 format
- Lab codes use LOINC when applicable
- Diagnosis codes use ICD-10
