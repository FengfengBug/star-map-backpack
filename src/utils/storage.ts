import type { XYPosition } from '@xyflow/react';
import type { KnowledgeFlowNode } from '../types/knowledge';

export const NODE_POSITIONS_STORAGE_KEY = 'star-map-backpack:node-positions:v1';

export type SavedNodePositions = Record<string, XYPosition>;

function isPosition(value: unknown): value is XYPosition {
  if (!value || typeof value !== 'object') return false;

  const position = value as Record<string, unknown>;
  return Number.isFinite(position.x) && Number.isFinite(position.y);
}

export function loadNodePositions(): SavedNodePositions {
  try {
    const rawValue = window.localStorage.getItem(NODE_POSITIONS_STORAGE_KEY);
    if (!rawValue) return {};

    const parsed: unknown = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.entries(parsed).reduce<SavedNodePositions>((positions, [id, value]) => {
      if (isPosition(value)) {
        positions[id] = { x: value.x, y: value.y };
      }
      return positions;
    }, {});
  } catch {
    return {};
  }
}

export function saveNodePositions(nodes: KnowledgeFlowNode[]) {
  try {
    const positions = nodes.reduce<SavedNodePositions>((result, node) => {
      result[node.id] = { x: node.position.x, y: node.position.y };
      return result;
    }, {});

    window.localStorage.setItem(NODE_POSITIONS_STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // 本地存储不可用时，星图仍可正常操作。
  }
}

export function clearNodePositions() {
  try {
    window.localStorage.removeItem(NODE_POSITIONS_STORAGE_KEY);
  } catch {
    // 忽略浏览器禁用 LocalStorage 的情况。
  }
}
