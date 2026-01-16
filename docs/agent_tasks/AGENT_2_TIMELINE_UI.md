# AGENT 2: Timeline & Navigation UI

**Status:** 🟡 Waiting for Agent 1  
**Priority:** 🔴 CRITICAL (Core UX feature)  
**Dependencies:** Agent 1 (Graph API endpoints)

---

## 🎯 Your Mission

Build the **patient timeline visualization and navigation UI**. This is the primary way users will interact with the MedAtlas demo. Make it beautiful, functional, and demonstrate the "navigable graph" concept.

---

## 📋 Task List

### 1. Create Timeline Components Structure
- [ ] Create `apps/web/src/ui/timeline/` directory
- [ ] Set up component files

### 2. Build Timeline Hook (`useTimeline.ts`)
- [ ] Fetch timeline data from Agent 1's API: `GET /graph/timeline/:patientId`
- [ ] Handle loading/error states
- [ ] Parse timeline events
- [ ] Support filtering (by type, date range)
- [ ] Support pagination (if needed)

### 3. Build Timeline View Component (`TimelineView.tsx`)
- [ ] Display events chronologically (vertical timeline)
- [ ] Show date separators
- [ ] Group events by day/encounter (optional)
- [ ] Responsive design
- [ ] Smooth scrolling
- [ ] Loading and error states

### 4. Build Event Card Component (`TimelineEvent.tsx`)
- [ ] Display event type icon/badge
- [ ] Show event title and timestamp
- [ ] Display summary/description
- [ ] Show evidence count
- [ ] Click to expand details
- [ ] Visual styling by event type (color coding)

### 5. Build Timeline Filters (`TimelineFilters.tsx`)
- [ ] Filter by event type (checkbox list)
- [ ] Filter by date range (date picker)
- [ ] Filter by source (FHIR, DICOM, note, etc.)
- [ ] Clear filters button
- [ ] Active filter indicators

### 6. Build Timeline Navigation (`TimelineNavigation.tsx`)
- [ ] Previous/Next buttons (navigate through events)
- [ ] Jump to date (date picker)
- [ ] Jump to today
- [ ] Zoom controls (optional: day/week/month view)
- [ ] Current position indicator

### 7. Build Evidence Link Component
- [ ] Display evidence references
- [ ] Click to show evidence details
- [ ] Link to source artifacts (if available)
- [ ] Visual indicator for evidence type

### 8. Update Main App (`App.tsx`)
- [ ] Replace static case view with timeline
- [ ] Add patient selector (for demo, can be hardcoded)
- [ ] Integrate timeline components
- [ ] Add routing (optional, can be single page for demo)

### 9. Optional: Graph Visualization (`GraphView.tsx`)
- [ ] Visual graph representation (optional)
- [ ] Use library like `react-force-graph` or `vis-network` (optional)
- [ ] Or simple node-link diagram with SVG
- [ ] Click nodes to see details
- [ ] Highlight selected node

### 10. Styling & Polish
- [ ] Modern, clean UI design
- [ ] Responsive (mobile-friendly)
- [ ] Smooth animations/transitions
- [ ] Accessible (keyboard navigation, ARIA labels)
- [ ] Loading skeletons

---

## 📁 Files to Create

```
apps/web/src/ui/
  timeline/
    TimelineView.tsx         # Main timeline component
    TimelineEvent.tsx         # Individual event card
    TimelineFilters.tsx       # Filter controls
    TimelineNavigation.tsx    # Navigation controls
    useTimeline.ts            # Data fetching hook
    types.ts                  # Timeline-specific types
  graph/
    GraphView.tsx             # Optional graph visualization
    NodeCard.tsx              # Node detail view
  App.tsx                     # Update to use timeline
```

---

## 🔗 Dependencies

- **Agent 1**: Graph API endpoints (especially `/graph/timeline/:patientId`)
- `@medatlas/schemas` - Use types from here
- React 18+
- Optional: `react-force-graph` or `vis-network` for graph visualization

---

## 📝 Implementation Notes

### Timeline Data Format
Expect this from Agent 1's API:
```typescript
interface TimelineResponse {
  patientId: string;
  events: TimelineEvent[];
  dateRange: {
    start: string; // ISO8601
    end: string;   // ISO8601
  };
}

interface TimelineEvent {
  id: string;
  type: 'encounter' | 'observation' | 'study' | 'lab' | 'medication' | 'condition';
  timestamp: string; // ISO8601
  title: string;
  summary?: string;
  evidence: EvidenceRef[];
  relatedNodes?: string[]; // node IDs
}
```

### Timeline Layout
- **Vertical timeline** (most common)
  - Events flow top to bottom (oldest to newest)
  - Date separators
  - Event cards on left/right (alternating or all on one side)
- **Horizontal timeline** (alternative)
  - Events flow left to right
  - Scrollable

### Event Type Styling
Use color coding:
- **Encounter**: Blue
- **Observation**: Green
- **Study**: Purple
- **Lab**: Orange
- **Medication**: Red
- **Condition**: Yellow

### API Integration
```typescript
// Fetch timeline
const response = await fetch(`${apiBase}/graph/timeline/${patientId}?start=${start}&end=${end}`);
const data: TimelineResponse = await response.json();

// Fetch node details (for evidence links)
const nodeResponse = await fetch(`${apiBase}/graph/node/${nodeId}`);
const node: GraphNode = await nodeResponse.json();
```

---

## ✅ Success Criteria

- [ ] Timeline displays events chronologically
- [ ] Events show correct data (type, date, source)
- [ ] Navigation works (prev/next, date jump)
- [ ] Filters work (by type, date range)
- [ ] Evidence links are clickable
- [ ] UI is responsive and visually clear
- [ ] Loading and error states handled
- [ ] Smooth user experience

---

## 🎨 Design Inspiration

- Medical timeline UIs (Epic, Cerner)
- GitHub contribution graph (for temporal visualization)
- Calendar views
- Project timeline tools

**Make it feel like a medical dashboard - clean, professional, information-dense but readable.**

---

## 🚀 Getting Started

1. Wait for Agent 1 to complete `/graph/timeline` endpoint
2. Review `apps/web/src/ui/App.tsx` to understand current structure
3. Check `packages/schemas/src/types.ts` for type definitions
4. Start with `useTimeline.ts` - build the data hook
5. Then build `TimelineView.tsx` - the main component
6. Add filters and navigation
7. Polish the UI

---

## 📞 Coordination

- **You depend on:** Agent 1's graph API
- **You create:** Timeline UI that other agents can enhance
- **Agent 4 will add:** Cross-modal alignment visualization to your timeline
- **Agent 5 will add:** AI-generated summaries that appear in timeline

**You're building the primary user interface - make it shine!** ✨
