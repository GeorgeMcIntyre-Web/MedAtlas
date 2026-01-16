export type EvidenceRef = {
  source: "fhir" | "dicom" | "note" | "lab" | "device" | "claims" | "synthetic";
  id: string;
  uri?: string;
  capturedAt?: string;
};

export type Finding = {
  label: string;
  probability?: number;
  location?: {
    anatomy?: string;
    imageRef?: string;
    sliceIndex?: number;
    coordinates?: [number, number, number];
  };
  evidence: EvidenceRef[];
};

export type MedAtlasOutput = {
  caseId: string;
  modalities: string[];
  summary: string;
  findings: Finding[];
  extractedEntities: Array<{ type: string; text: string; value?: number; unit?: string; evidence: EvidenceRef[] }>;
  recommendations: string[];
  uncertainty: {
    level: "low" | "medium" | "high";
    reasons: string[];
  };
  safety: {
    notMedicalAdvice: true;
    requiresClinicianReview: true;
  };
};
