/**
 * MedAtlas Graph Demo Seeder
 * 
 * This script reads synthetic demo case data and transforms it into
 * Atlas Graph structure for demonstration purposes.
 * 
 * Usage: node scripts/seed-graph-demo.mjs
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "../data/synthetic");
const outputDir = join(__dirname, "../data/graphs");

/**
 * Generate node ID
 */
function generateNodeId(type, caseId, entityId) {
  return `${type}-${caseId}-${entityId}`;
}

/**
 * Generate edge ID
 */
function generateEdgeId(sourceId, targetId, type) {
  return `edge-${sourceId}-${targetId}-${type}`;
}

/**
 * Get current timestamp
 */
function now() {
  return new Date().toISOString();
}

/**
 * Create a graph node
 */
function createNode(id, type, label, properties, evidence, timestamp) {
  return {
    id,
    type,
    label,
    properties,
    evidence: evidence || [],
    timestamp,
    createdAt: now(),
  };
}

/**
 * Create a graph edge
 */
function createEdge(source, target, type, label, properties = {}, evidence = []) {
  return {
    id: generateEdgeId(source, target, type),
    source,
    target,
    type,
    label,
    properties,
    evidence,
    createdAt: now(),
  };
}

/**
 * Transform a synthetic case to graph data
 */
function transformSyntheticCase(syntheticCase) {
  const { caseId, patient, encounters } = syntheticCase;
  const nodes = [];
  const edges = [];

  // Create patient node
  const patientNodeId = generateNodeId("patient", caseId, patient.id);
  nodes.push(createNode(
    patientNodeId,
    "patient",
    `Patient ${patient.id}`,
    { patientId: patient.id, ...patient.demographics },
    [{ source: "synthetic", id: patient.id }]
  ));

  // Track encounter node IDs for temporal edges
  const encounterNodeIds = [];

  // Process each encounter
  for (const encounter of encounters) {
    const encounterNodeId = generateNodeId("encounter", caseId, encounter.id);
    encounterNodeIds.push({ id: encounterNodeId, timestamp: encounter.timestamp });

    // Create encounter node
    nodes.push(createNode(
      encounterNodeId,
      "encounter",
      `${encounter.type} Visit`,
      { encounterId: encounter.id, type: encounter.type, reason: encounter.reason, status: "finished" },
      [{ source: "synthetic", id: encounter.id, capturedAt: encounter.timestamp }],
      encounter.timestamp
    ));

    // Link encounter to patient
    edges.push(createEdge(
      encounterNodeId,
      patientNodeId,
      "observed-in",
      "observed in",
      {},
      [{ source: "synthetic", id: encounter.id }]
    ));

    // Track nodes for cross-modal links
    const labNodeIds = new Map();
    const findingNodeIds = new Map();
    const conditionNodeIds = new Map();
    const medicationNodeIds = new Map();

    // Process observations
    for (const obs of encounter.observations || []) {
      const obsNodeId = generateNodeId("observation", caseId, obs.id);
      nodes.push(createNode(
        obsNodeId,
        "observation",
        obs.type,
        { observationId: obs.id, observationType: obs.type, value: obs.value, text: obs.text },
        [{ source: "synthetic", id: obs.id, capturedAt: obs.timestamp || encounter.timestamp }],
        obs.timestamp || encounter.timestamp
      ));
      edges.push(createEdge(obsNodeId, encounterNodeId, "observed-in", "observed in"));
    }

    // Process vitals
    for (const vital of encounter.vitals || []) {
      const vitalNodeId = generateNodeId("vital", caseId, vital.id);
      nodes.push(createNode(
        vitalNodeId,
        "vital",
        vital.name,
        { vitalId: vital.id, name: vital.name, value: vital.value, unit: vital.unit },
        [{ source: "synthetic", id: vital.id, capturedAt: vital.timestamp || encounter.timestamp }],
        vital.timestamp || encounter.timestamp
      ));
      edges.push(createEdge(vitalNodeId, encounterNodeId, "observed-in", "observed in"));
    }

    // Process labs
    for (const lab of encounter.labs || []) {
      const labNodeId = generateNodeId("lab", caseId, lab.id);
      labNodeIds.set(lab.id, labNodeId);
      nodes.push(createNode(
        labNodeId,
        "lab",
        lab.name,
        {
          labId: lab.id,
          name: lab.name,
          code: lab.code,
          value: lab.value,
          unit: lab.unit,
          referenceRange: lab.referenceRange,
          interpretation: lab.interpretation,
        },
        [{ source: "lab", id: lab.id, capturedAt: lab.timestamp || encounter.timestamp }],
        lab.timestamp || encounter.timestamp
      ));
      edges.push(createEdge(labNodeId, encounterNodeId, "observed-in", "observed in"));
    }

    // Process medications
    for (const med of encounter.medications || []) {
      const medNodeId = generateNodeId("medication", caseId, med.id);
      medicationNodeIds.set(med.id, medNodeId);
      nodes.push(createNode(
        medNodeId,
        "medication",
        med.name,
        {
          medicationId: med.id,
          name: med.name,
          dosage: med.dosage,
          route: med.route,
          frequency: med.frequency,
          status: med.status,
        },
        [{ source: "synthetic", id: med.id, capturedAt: med.startDate || encounter.timestamp }],
        med.startDate || encounter.timestamp
      ));
      edges.push(createEdge(medNodeId, encounterNodeId, "observed-in", "observed in"));
    }

    // Process conditions
    for (const condition of encounter.conditions || []) {
      const condNodeId = generateNodeId("condition", caseId, condition.id);
      conditionNodeIds.set(condition.id, condNodeId);
      nodes.push(createNode(
        condNodeId,
        "condition",
        condition.name,
        {
          conditionId: condition.id,
          name: condition.name,
          code: condition.code,
          icdCode: condition.icdCode,
          status: condition.status,
          severity: condition.severity,
        },
        [{ source: "synthetic", id: condition.id, capturedAt: condition.onsetDate || encounter.timestamp }],
        condition.onsetDate || encounter.timestamp
      ));
      edges.push(createEdge(condNodeId, encounterNodeId, "observed-in", "observed in"));
    }

    // Process studies and findings
    for (const study of encounter.studies || []) {
      const studyNodeId = generateNodeId("study", caseId, study.id);
      nodes.push(createNode(
        studyNodeId,
        "study",
        `${study.modality} ${study.bodyPart || "Study"}`,
        {
          studyId: study.id,
          modality: study.modality,
          bodyPart: study.bodyPart,
          description: study.description,
          accessionNumber: study.accessionNumber,
        },
        [{ source: "dicom", id: study.id, capturedAt: study.timestamp || encounter.timestamp }],
        study.timestamp || encounter.timestamp
      ));
      edges.push(createEdge(studyNodeId, encounterNodeId, "observed-in", "observed in"));

      // Process findings
      for (const finding of study.findings || []) {
        const findingNodeId = generateNodeId("finding", caseId, finding.id);
        findingNodeIds.set(finding.id, findingNodeId);
        nodes.push(createNode(
          findingNodeId,
          "finding",
          finding.description,
          {
            findingId: finding.id,
            description: finding.description,
            severity: finding.severity,
            confidence: finding.confidence,
            anatomy: finding.anatomy,
            imageRef: study.id,
          },
          [{ source: "dicom", id: study.id, capturedAt: study.timestamp || encounter.timestamp }],
          study.timestamp || encounter.timestamp
        ));

        // Finding derived from study
        edges.push(createEdge(findingNodeId, studyNodeId, "derived-from", "derived from"));

        // Create cross-modal link if specified
        if (finding.crossModalRef) {
          const targetLabNodeId = labNodeIds.get(finding.crossModalRef);
          if (targetLabNodeId) {
            edges.push(createEdge(
              findingNodeId,
              targetLabNodeId,
              "matches",
              "matches",
              { confidence: finding.confidence },
              [
                { source: "dicom", id: study.id },
                { source: "lab", id: finding.crossModalRef },
              ]
            ));
          }
        }
      }
    }

    // Process notes
    for (const note of encounter.notes || []) {
      const noteNodeId = generateNodeId("note", caseId, note.id);
      const excerpt = note.text.length > 200 ? note.text.substring(0, 200) + "..." : note.text;
      nodes.push(createNode(
        noteNodeId,
        "note",
        `${note.type} Note`,
        {
          noteId: note.id,
          type: note.type,
          author: note.author,
          text: note.text,
          excerpt,
        },
        [{ source: "note", id: note.id, capturedAt: note.timestamp || encounter.timestamp }],
        note.timestamp || encounter.timestamp
      ));
      edges.push(createEdge(noteNodeId, encounterNodeId, "observed-in", "observed in"));
    }

    // Process procedures
    for (const procedure of encounter.procedures || []) {
      const procNodeId = generateNodeId("procedure", caseId, procedure.id);
      nodes.push(createNode(
        procNodeId,
        "procedure",
        procedure.name,
        {
          procedureId: procedure.id,
          name: procedure.name,
          code: procedure.code,
          status: procedure.status,
          outcome: procedure.outcome,
        },
        [{ source: "synthetic", id: procedure.id, capturedAt: procedure.timestamp || encounter.timestamp }],
        procedure.timestamp || encounter.timestamp
      ));
      edges.push(createEdge(procNodeId, encounterNodeId, "observed-in", "observed in"));
    }

    // Create treats edges between medications and conditions
    for (const [, medNodeId] of medicationNodeIds) {
      for (const [, condNodeId] of conditionNodeIds) {
        edges.push(createEdge(medNodeId, condNodeId, "treats", "treats"));
      }
    }
  }

  // Create temporal edges between encounters
  const sortedEncounters = [...encounterNodeIds].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  for (let i = 0; i < sortedEncounters.length - 1; i++) {
    edges.push(createEdge(
      sortedEncounters[i].id,
      sortedEncounters[i + 1].id,
      "precedes",
      "precedes"
    ));
  }

  return { caseId, nodes, edges };
}

/**
 * Generate timeline events from graph data
 */
function generateTimelineEvents(graphData) {
  const { nodes, edges } = graphData;
  
  // Find all nodes that have timestamps (excluding patient node)
  const timelineNodes = nodes.filter(
    (node) => node.timestamp && node.type !== "patient"
  );

  // Sort by timestamp
  timelineNodes.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Convert to timeline events
  return timelineNodes.map((node) => ({
    id: node.id,
    type: node.type,
    timestamp: node.timestamp,
    title: node.label,
    summary: node.properties.text || node.properties.description || node.properties.outcome,
    evidence: node.evidence,
    relatedNodes: edges
      .filter((e) => e.source === node.id || e.target === node.id)
      .map((e) => (e.source === node.id ? e.target : e.source)),
  }));
}

/**
 * Main function
 */
async function main() {
  console.log("🏥 MedAtlas Graph Demo Seeder");
  console.log("=============================\n");

  // Create output directory
  await mkdir(outputDir, { recursive: true });

  // Demo case files to process
  const caseFiles = ["demo-case-001.json", "demo-case-002.json"];

  for (const caseFile of caseFiles) {
    try {
      const casePath = join(dataDir, caseFile);
      const caseData = JSON.parse(await readFile(casePath, "utf-8"));
      
      console.log(`Processing ${caseFile}...`);
      
      // Transform to graph
      const graphData = transformSyntheticCase(caseData);
      
      // Generate timeline events
      const timelineEvents = generateTimelineEvents(graphData);
      
      // Output data
      const output = {
        caseId: graphData.caseId,
        generatedAt: now(),
        graph: {
          nodes: graphData.nodes,
          edges: graphData.edges,
        },
        timeline: {
          patientId: caseData.patient.id,
          events: timelineEvents,
          dateRange: {
            start: timelineEvents[0]?.timestamp,
            end: timelineEvents[timelineEvents.length - 1]?.timestamp,
          },
        },
        metadata: {
          totalNodes: graphData.nodes.length,
          totalEdges: graphData.edges.length,
          nodesByType: graphData.nodes.reduce((acc, node) => {
            acc[node.type] = (acc[node.type] || 0) + 1;
            return acc;
          }, {}),
          edgesByType: graphData.edges.reduce((acc, edge) => {
            acc[edge.type] = (acc[edge.type] || 0) + 1;
            return acc;
          }, {}),
        },
      };

      // Write output
      const outputPath = join(outputDir, `graph-${graphData.caseId}.json`);
      await writeFile(outputPath, JSON.stringify(output, null, 2), "utf-8");
      
      console.log(`  ✅ Created ${graphData.nodes.length} nodes, ${graphData.edges.length} edges`);
      console.log(`  ✅ Timeline: ${timelineEvents.length} events`);
      console.log(`  ✅ Wrote ${outputPath}\n`);
      
      // Print summary
      console.log(`  Node types: ${Object.entries(output.metadata.nodesByType).map(([k, v]) => `${k}(${v})`).join(", ")}`);
      console.log(`  Edge types: ${Object.entries(output.metadata.edgesByType).map(([k, v]) => `${k}(${v})`).join(", ")}\n`);
      
    } catch (error) {
      console.error(`  ❌ Error processing ${caseFile}: ${error.message}`);
    }
  }

  console.log("Done! Graph data ready for demo.");
}

main().catch(console.error);
