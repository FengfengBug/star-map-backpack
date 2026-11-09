import type { Edge, Node, XYPosition } from '@xyflow/react';

export type StarTone = 'blue' | 'cyan' | 'violet' | 'gold';

export type ChapterId = string;

export interface ChapterDefinition {
  id: ChapterId;
  label: string;
  caption: string;
  tone: StarTone;
}

export interface KnowledgePoint {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  scoreShare: number | null;
  mastery: number | null;
  estimatedMinutes: number | null;
  reviewed: boolean;
  position: XYPosition;
  chapterId: ChapterId;
  tone: StarTone;
  relatedIds: string[];
}

export interface KnowledgePointEditableFields {
  title: string;
  content: string;
  scoreShare: number | null;
  estimatedMinutes: number | null;
  mastery: number | null;
}

export interface KnowledgeNodeData extends Record<string, unknown> {
  title: string;
  content: string;
  parentId: string | null;
  scoreShare: number | null;
  mastery: number | null;
  estimatedMinutes: number | null;
  reviewed: boolean;
  chapterId: ChapterId;
  tone: StarTone;
  relatedIds: string[];
}

export type KnowledgeFlowNode = Node<KnowledgeNodeData, 'knowledge'>;

export type RelationKind = 'parent' | 'related';

export interface ConstellationEdgeData extends Record<string, unknown> {
  relation: RelationKind;
  tone: StarTone;
  active: boolean;
}

export type KnowledgeFlowEdge = Edge<ConstellationEdgeData, 'constellation'>;
