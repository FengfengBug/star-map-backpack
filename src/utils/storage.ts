import type { XYPosition } from '@xyflow/react';
import type {
  KnowledgeFlowNode,
  KnowledgePoint,
  KnowledgePointEditableFields,
} from '../types/knowledge';
import type {
  LearningRecord,
  LearningRecordNode,
} from '../types/learningRecord';

export const NODE_POSITIONS_STORAGE_KEY = 'star-map-backpack:node-positions:v1';
export const NODE_EDITS_STORAGE_KEY = 'star-map-backpack:node-edits:v1';
export const LEARNING_RECORDS_STORAGE_KEY = 'star-map-backpack:learning-records:v1';

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

export function replaceNodeEdits(courseKey: string, edits: SavedCourseEdits) {
  try {
    const saved = readSavedNodeEdits();
    if (Object.keys(edits).length > 0) {
      saved[courseKey] = { ...edits };
    } else {
      delete saved[courseKey];
    }
    window.localStorage.setItem(NODE_EDITS_STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // 忽略浏览器禁用 LocalStorage 的情况。
  }
}

export function clearNodeEdits(courseKey: string) {
  replaceNodeEdits(courseKey, {});
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

export interface LearningRecordsLoadResult {
  status: 'ok' | 'empty' | 'corrupt' | 'unavailable';
  records: LearningRecord[];
}

function isLearningRecordNode(value: unknown): value is LearningRecordNode {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const node = value as Record<string, unknown>;
  return (
    typeof node.id === 'string' &&
    node.id.trim() !== '' &&
    typeof node.title === 'string' &&
    node.title.trim() !== ''
  );
}

function isNullableMastery(value: unknown): value is number | null {
  return isNullableRangeValue(value, 0, 100);
}

function isNullableMinutes(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === 'number' && Number.isInteger(value) && value >= 0)
  );
}

function parseLearningRecord(value: unknown): LearningRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;

  if (
    typeof record.id !== 'string' ||
    record.id.trim() === '' ||
    typeof record.occurredAt !== 'number' ||
    !Number.isFinite(record.occurredAt) ||
    record.occurredAt < 0 ||
    Number.isNaN(new Date(record.occurredAt).getTime()) ||
    typeof record.summary !== 'string' ||
    record.summary.trim() === '' ||
    (record.nodeId !== null && typeof record.nodeId !== 'string') ||
    (record.nodeTitle !== null && typeof record.nodeTitle !== 'string') ||
    !Array.isArray(record.details) ||
    !record.details.every((detail) => typeof detail === 'string') ||
    !Array.isArray(record.removed) ||
    !record.removed.every(isLearningRecordNode) ||
    !Array.isArray(record.added) ||
    !record.added.every(isLearningRecordNode) ||
    !isNullableMastery(record.mastery) ||
    !isNullableMastery(record.previousMastery) ||
    !isNullableMastery(record.nextMastery) ||
    !isNullableMinutes(record.previousMinutes) ||
    !isNullableMinutes(record.nextMinutes)
  ) {
    return null;
  }

  const isReview =
    record.category === 'review' &&
    (record.kind === 'reviewed' || record.kind === 'unreviewed');
  const isRoute =
    record.category === 'route' &&
    (record.kind === 'replanned' || record.kind === 'undo');
  if (!isReview && !isRoute) return null;

  return {
    id: record.id,
    occurredAt: record.occurredAt,
    category: record.category as LearningRecord['category'],
    kind: record.kind as LearningRecord['kind'],
    nodeId: record.nodeId as string | null,
    nodeTitle: record.nodeTitle as string | null,
    summary: record.summary,
    details: [...record.details] as string[],
    removed: record.removed.map(({ id, title }) => ({ id, title })),
    added: record.added.map(({ id, title }) => ({ id, title })),
    mastery: record.mastery,
    previousMastery: record.previousMastery,
    nextMastery: record.nextMastery,
    previousMinutes: record.previousMinutes,
    nextMinutes: record.nextMinutes,
  };
}

export function loadLearningRecords(): LearningRecordsLoadResult {
  let rawValue: string | null;
  try {
    rawValue = window.localStorage.getItem(LEARNING_RECORDS_STORAGE_KEY);
  } catch {
    return { status: 'unavailable', records: [] };
  }

  if (!rawValue) return { status: 'empty', records: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return { status: 'corrupt', records: [] };
  }

  if (!Array.isArray(parsed)) return { status: 'corrupt', records: [] };

  const records = parsed
    .map(parseLearningRecord)
    .filter((record): record is LearningRecord => Boolean(record))
    .sort((a, b) => b.occurredAt - a.occurredAt);

  return {
    status: records.length === parsed.length ? 'ok' : 'corrupt',
    records,
  };
}

export function saveLearningRecords(records: LearningRecord[]) {
  try {
    window.localStorage.setItem(LEARNING_RECORDS_STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

export function clearLearningRecords() {
  try {
    window.localStorage.removeItem(LEARNING_RECORDS_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
