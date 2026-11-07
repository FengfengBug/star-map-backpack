import type { KnowledgeFlowEdge, KnowledgeFlowNode, KnowledgePoint } from '../types/knowledge';
import type { SavedNodePositions } from './storage';

export function createKnowledgeNodes(
  points: KnowledgePoint[],
  savedPositions: SavedNodePositions = {},
): KnowledgeFlowNode[] {
  return points.map((point) => ({
    id: point.id,
    type: 'knowledge',
    position: savedPositions[point.id] ?? point.position,
    ariaLabel: `知识点：${point.title}，分值占比 ${point.scoreShare}%，掌握度 ${point.mastery}%`,
    ariaRole: 'button',
    focusable: true,
    data: {
      title: point.title,
      content: point.content,
      parentId: point.parentId,
      scoreShare: point.scoreShare,
      mastery: point.mastery,
      estimatedMinutes: point.estimatedMinutes,
      reviewed: point.reviewed,
      chapterId: point.chapterId,
      tone: point.tone,
      relatedIds: point.relatedIds,
    },
  }));
}

export function createKnowledgeEdges(
  nodes: KnowledgeFlowNode[],
  selectedNodeId: string | null,
): KnowledgeFlowEdge[] {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: KnowledgeFlowEdge[] = [];

  nodes.forEach((node) => {
    if (node.data.parentId && nodeIds.has(node.data.parentId)) {
      edges.push({
        id: `parent:${node.data.parentId}:${node.id}`,
        source: node.data.parentId,
        target: node.id,
        type: 'constellation',
        selectable: false,
        focusable: false,
        data: {
          relation: 'parent',
          tone: node.data.tone,
          active: selectedNodeId === node.id || selectedNodeId === node.data.parentId,
        },
      });
    }

    node.data.relatedIds.forEach((relatedId) => {
      if (!nodeIds.has(relatedId) || node.id > relatedId) return;

      edges.push({
        id: `related:${node.id}:${relatedId}`,
        source: node.id,
        target: relatedId,
        type: 'constellation',
        selectable: false,
        focusable: false,
        data: {
          relation: 'related',
          tone: node.data.tone,
          active: selectedNodeId === node.id || selectedNodeId === relatedId,
        },
      });
    });
  });

  return edges;
}

export function sumPendingMinutes(nodes: KnowledgeFlowNode[]) {
  return nodes
    .filter((node) => !node.data.reviewed)
    .reduce((total, node) => total + node.data.estimatedMinutes, 0);
}
