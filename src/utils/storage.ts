import type { XYPosition } from '@xyflow/react';
import type {
  KnowledgeFlowNode,
  KnowledgePoint,
  KnowledgePointEditableFields,
} from '../types/knowledge';

export const NODE_POSITIONS_STORAGE_KEY = 'star-map-backpack:node-positions:v1';
export const NODE_EDITS_STORAGE_KEY = 'star-map-backpack:node-edits:v1';

export type SavedNodePositions = Record<string, XYPosition>;
export type SavedCourseEdits = Record<string, KnowledgePointEditableFields>;

type SavedNodeEdits = Record<string, SavedCourseEdits>;

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

function isNullableRangeValue(
  value: unknown,
  min: number,
  max: number,
): value is number | null {
  return (
    value === null ||
    (typeof value === 'number' &&
      Number.isInteger(value) &&
      value >= min &&
      value <= max)
  );
}

function isEditableFields(value: unknown): value is KnowledgePointEditableFields {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const fields = value as Record<string, unknown>;
  return (
    typeof fields.title === 'string' &&
    fields.title.trim() !== '' &&
    typeof fields.content === 'string' &&
    fields.content.trim() !== '' &&
    isNullableRangeValue(fields.scoreShare, 1, 100) &&
    isNullableRangeValue(fields.estimatedMinutes, 1, 600) &&
    isNullableRangeValue(fields.mastery, 0, 100)
  );
}

function readSavedNodeEdits(): SavedNodeEdits {
  try {
    const rawValue = window.localStorage.getItem(NODE_EDITS_STORAGE_KEY);
    if (!rawValue) return {};

    const parsed: unknown = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.entries(parsed).reduce<SavedNodeEdits>((courses, [courseKey, value]) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return courses;
      }

      const courseEdits = Object.entries(value).reduce<SavedCourseEdits>(
        (nodes, [nodeId, fields]) => {
          if (isEditableFields(fields)) {
            nodes[nodeId] = {
              title: fields.title,
              content: fields.content,
              scoreShare: fields.scoreShare,
              estimatedMinutes: fields.estimatedMinutes,
              mastery: fields.mastery,
            };
          }
          return nodes;
        },
        {},
      );

      if (Object.keys(courseEdits).length > 0) {
        courses[courseKey] = courseEdits;
      }
      return courses;
    }, {});
  } catch {
    return {};
  }
}

export function loadNodeEdits(courseKey: string): SavedCourseEdits {
  return readSavedNodeEdits()[courseKey] ?? {};
}

export function saveNodeEdit(
  courseKey: string,
  nodeId: string,
  fields: KnowledgePointEditableFields,
) {
  try {
    const saved = readSavedNodeEdits();
    saved[courseKey] = { ...(saved[courseKey] ?? {}), [nodeId]: { ...fields } };
    window.localStorage.setItem(NODE_EDITS_STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // 本地存储不可用时，编辑结果仍保留在本次会话内。
  }
}

export function applySavedNodeEdits(
  points: KnowledgePoint[],
  edits: SavedCourseEdits,
): KnowledgePoint[] {
  return points.map((point) => {
    const savedFields = edits[point.id];
    return savedFields ? { ...point, ...savedFields } : point;
  });
}
