"""MedAtlas core: Atlas Graph

This is a placeholder module for the future Python implementation.
Cloudflare-hosted production code will likely run as Workers (TS) or in a secure backend.

The *concept* here is a provenance-preserving graph of entities + edges + evidence.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

Source = Literal["fhir", "dicom", "note", "lab", "device", "claims", "synthetic"]


@dataclass(frozen=True)
class EvidenceRef:
    source: Source
    id: str
    uri: str | None = None
    captured_at: str | None = None


@dataclass
class Node:
    id: str
    kind: str
    payload: dict


@dataclass
class Edge:
    src: str
    dst: str
    kind: str
    evidence: list[EvidenceRef]


@dataclass
class AtlasGraph:
    nodes: dict[str, Node]
    edges: list[Edge]

    def add_node(self, node: Node) -> None:
        if node.id in self.nodes:
            return
        self.nodes[node.id] = node

    def add_edge(self, edge: Edge) -> None:
        self.edges.append(edge)
