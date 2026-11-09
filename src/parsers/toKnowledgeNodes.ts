import type { KnowledgePoint } from '../types/knowledge';
import type { ParsedNoteSection } from '../types/parsedNote';

const X_GAP = 220;
const Y_GAP = 160;

export type ParsedKnowledgeNode = Pick<
  KnowledgePoint,
  'id' | 'title' | 'content' | 'parentId' | 'position' | 'relatedIds'
> & {
  level: number;
};

export interface ParsedKnowledgeEdge {
  id: string;
  source: string;
  target: string;
  relation: 'related';
}

export function toKnowledgeNodes(sections: ParsedNoteSection[]): ParsedKnowledgeNode[] {
  const headingStack: Array<{ level: number; id: string }> = [];

  const nodes = sections.map((section, index) => {
    const id = `note-${index + 1}`;
    let parentId: string | null = null;

    if (section.level > 0) {
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= section.level) {
        headingStack.pop();
      }

      parentId = headingStack.length > 0 ? headingStack[headingStack.length - 1].id : null;
      headingStack.push({ level: section.level, id });
    }

    return {
      id,
      title: section.title,
      content: section.content,
      parentId,
      relatedIds: [],
      level: section.level,
      position: { x: 0, y: 0 },
    };
  });

  attachRelatedIds(nodes);
  applyTreeLayout(nodes);

  return nodes;
}

// 没有语义分析时，用同级相邻节点作为确定性关联边来源。
function attachRelatedIds(nodes: ParsedKnowledgeNode[]): void {
  const siblingsByParent = new Map<string | null, ParsedKnowledgeNode[]>();

  nodes.forEach((node) => {
    if (node.level === 0) {
      return;
    }

    const siblings = siblingsByParent.get(node.parentId);
    if (siblings) {
      siblings.push(node);
    } else {
      siblingsByParent.set(node.parentId, [node]);
    }
  });

  siblingsByParent.forEach((siblings) => {
    for (let index = 0; index < siblings.length - 1; index += 1) {
      const current = siblings[index];
      const next = siblings[index + 1];
      current.relatedIds.push(next.id);
      next.relatedIds.push(current.id);
    }
  });
}

function applyTreeLayout(nodes: ParsedKnowledgeNode[]): void {
  const childrenByParent = new Map<string | null, ParsedKnowledgeNode[]>();

  nodes.forEach((node) => {
    const siblings = childrenByParent.get(node.parentId);
    if (siblings) {
      siblings.push(node);
    } else {
      childrenByParent.set(node.parentId, [node]);
    }
  });

  let nextLeaf = 0;

  const place = (node: ParsedKnowledgeNode, depth: number): number => {
    const children = childrenByParent.get(node.id) ?? [];

    if (children.length === 0) {
      const x = nextLeaf * X_GAP;
      nextLeaf += 1;
      node.position = { x, y: depth * Y_GAP };
      return x;
    }

    const childXs = children.map((child) => place(child, depth + 1));
    const x = (childXs[0] + childXs[childXs.length - 1]) / 2;
    node.position = { x, y: depth * Y_GAP };
    return x;
  };

  const roots = childrenByParent.get(null) ?? [];
  roots.forEach((root) => place(root, 0));
}

export function buildRelatedEdges(nodes: ParsedKnowledgeNode[]): ParsedKnowledgeEdge[] {
  const nodeOrder = new Map(nodes.map((node, index) => [node.id, index]));
  const seenPairs = new Set<string>();
  const edges: ParsedKnowledgeEdge[] = [];

  nodes.forEach((node, nodeIndex) => {
    node.relatedIds.forEach((relatedId) => {
      const relatedIndex = nodeOrder.get(relatedId);

      if (relatedIndex === undefined || relatedId === node.id) {
        return;
      }

      const source = nodeIndex < relatedIndex ? node.id : relatedId;
      const target = nodeIndex < relatedIndex ? relatedId : node.id;
      const pairKey = `${source}\u0000${target}`;

      if (seenPairs.has(pairKey)) {
        return;
      }

      seenPairs.add(pairKey);
      edges.push({
        id: `related:${source}:${target}`,
        source,
        target,
        relation: 'related',
      });
    });
  });

  return edges;
}
