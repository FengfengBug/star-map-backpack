import type { SampleCourseId } from '../data/sampleCourses';
import type { ImportedCourse } from '../parsers/importedNote';
import type {
  ChapterDefinition,
  KnowledgePoint,
  StarTone,
} from '../types/knowledge';
import type { NoteSourceSummary } from '../types/noteSource';
import {
  LEARNING_RECORDS_STORAGE_KEY,
  NODE_EDITS_STORAGE_KEY,
  NODE_POSITIONS_STORAGE_KEY,
  type SavedNodePositions,
} from './storage';

export const WORKSPACE_STORAGE_KEY = 'star-map-backpack:workspace:v1';
export const WORKSPACE_BACKUP_STORAGE_KEY = 'star-map-backpack:workspace-backup:v1';
export const DEFAULT_WORKSPACE_BUDGET_MINUTES = 150;
export const MIN_WORKSPACE_BUDGET_MINUTES = 0;
export const MAX_WORKSPACE_BUDGET_MINUTES = 300;

const STAR_TONES: StarTone[] = ['blue', 'cyan', 'violet', 'gold'];
const WORKSPACE_KINDS: WorkspaceKind[] = ['sample', 'imported', 'blank'];
const SAMPLE_COURSE_IDS = new Set<string>(['data-structures', 'computer-organization']);
const NOTE_SOURCE_KINDS = ['sample', 'imported', 'blank'];

export type WorkspaceKind = 'sample' | 'imported' | 'blank';

export interface WorkspaceSnapshot {
  version: 1;
  id: string;
  kind: WorkspaceKind;
  courseTitle: string;
  chapters: ChapterDefinition[];
  points: KnowledgePoint[];
  noteSource: NoteSourceSummary;
  activeSampleCourseId: SampleCourseId | null;
  positions: SavedNodePositions;
  budgetMinutes: number;
  savedAt: number;
}

export interface WorkspaceBackup {
  version: 1;
  clearedAt: number;
  workspace: WorkspaceSnapshot;
}

export type WorkspaceLoadResult =
  | { status: 'ok'; snapshot: WorkspaceSnapshot }
  | { status: 'empty' }
  | { status: 'corrupt' }
  | { status: 'unavailable' };

export type WorkspaceBackupLoadResult =
  | { status: 'ok'; backup: WorkspaceBackup }
  | { status: 'empty' }
  | { status: 'corrupt' }
  | { status: 'unavailable' };

export const BLANK_NOTE_SOURCE: NoteSourceSummary = {
  fileName: '空白星图',
  subtitle: '尚未导入笔记',
  excerpt: '导入 Markdown / TXT 笔记，或载入示例课程，开始构建自己的复习星图。',
  characterCount: 0,
  kind: 'blank',
};

export interface WorkspaceSnapshotInput {
  id: string;
  kind: WorkspaceKind;
  courseTitle: string;
  chapters: ChapterDefinition[];
  points: KnowledgePoint[];
  noteSource: NoteSourceSummary;
  activeSampleCourseId: SampleCourseId | null;
  positions: SavedNodePositions;
  budgetMinutes: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isPosition(value: unknown) {
  if (!isRecord(value)) return false;
  return Number.isFinite(value.x) && Number.isFinite(value.y);
}

function isNullableIntegerInRange(
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

function isChapter(value: unknown): value is ChapterDefinition {
  if (!isRecord(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.label) &&
    isNonEmptyString(value.caption) &&
    STAR_TONES.includes(value.tone as StarTone)
  );
}

function isKnowledgePoint(value: unknown): value is KnowledgePoint {
  if (!isRecord(value)) return false;

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.content) &&
    (value.parentId === null || isNonEmptyString(value.parentId)) &&
    isNullableIntegerInRange(value.scoreShare, 1, 100) &&
    isNullableIntegerInRange(value.estimatedMinutes, 1, 600) &&
    isNullableIntegerInRange(value.mastery, 0, 100) &&
    typeof value.reviewed === 'boolean' &&
    isPosition(value.position) &&
    isNonEmptyString(value.chapterId) &&
    STAR_TONES.includes(value.tone as StarTone) &&
    Array.isArray(value.relatedIds) &&
    value.relatedIds.every((relatedId) => isNonEmptyString(relatedId))
  );
}

function isNoteSource(value: unknown): value is NoteSourceSummary {
  if (!isRecord(value)) return false;

  return (
    isNonEmptyString(value.fileName) &&
    typeof value.subtitle === 'string' &&
    typeof value.excerpt === 'string' &&
    typeof value.characterCount === 'number' &&
    Number.isInteger(value.characterCount) &&
    value.characterCount >= 0 &&
    NOTE_SOURCE_KINDS.includes(String(value.kind))
  );
}

function parsePositions(
  value: unknown,
  pointIds: Set<string>,
): SavedNodePositions | null {
  if (!isRecord(value)) return null;

  const positions: SavedNodePositions = {};

  for (const [nodeId, position] of Object.entries(value)) {
    if (!pointIds.has(nodeId)) continue;
    if (!isPosition(position)) return null;
    const savedPosition = position as { x: number; y: number };
    positions[nodeId] = { x: savedPosition.x, y: savedPosition.y };
  }

  return positions;
}

export function parseWorkspaceSnapshot(value: unknown): WorkspaceSnapshot | null {
  if (!isRecord(value) || value.version !== 1) return null;
  if (!isNonEmptyString(value.id)) return null;
  if (!WORKSPACE_KINDS.includes(value.kind as WorkspaceKind)) return null;
  if (!isNonEmptyString(value.courseTitle)) return null;
  if (!Array.isArray(value.chapters) || !value.chapters.every(isChapter)) return null;
  if (!Array.isArray(value.points) || !value.points.every(isKnowledgePoint)) return null;
  if (!isNoteSource(value.noteSource)) return null;
  if (typeof value.savedAt !== 'number' || !Number.isFinite(value.savedAt)) return null;
  if (
    typeof value.budgetMinutes !== 'number' ||
    !Number.isInteger(value.budgetMinutes) ||
    value.budgetMinutes < MIN_WORKSPACE_BUDGET_MINUTES ||
    value.budgetMinutes > MAX_WORKSPACE_BUDGET_MINUTES
  ) {
    return null;
  }

  const chapterIds = new Set<string>();
  for (const chapter of value.chapters) {
    if (chapterIds.has(chapter.id)) return null;
    chapterIds.add(chapter.id);
  }

  const pointIds = new Set<string>();
  for (const point of value.points) {
    if (pointIds.has(point.id)) return null;
    pointIds.add(point.id);
  }

  for (const point of value.points) {
    if (!chapterIds.has(point.chapterId)) return null;
    if (point.parentId && (!pointIds.has(point.parentId) || point.parentId === point.id)) {
      return null;
    }
    if (
      point.relatedIds.some(
        (relatedId) => relatedId === point.id || !pointIds.has(relatedId),
      )
    ) {
      return null;
    }
  }

  const kind = value.kind as WorkspaceKind;
  const noteSource = value.noteSource;
  const activeSampleCourseId = value.activeSampleCourseId;

  if (kind === 'blank') {
    if (value.points.length > 0 || value.chapters.length > 0) return null;
    if (noteSource.kind !== 'blank' || activeSampleCourseId !== null) return null;
  } else {
    if (value.points.length === 0 || value.chapters.length === 0) return null;
    if (noteSource.kind !== kind) return null;
    if (kind === 'sample') {
      if (
        typeof activeSampleCourseId !== 'string' ||
        !SAMPLE_COURSE_IDS.has(activeSampleCourseId)
      ) {
        return null;
      }
    } else if (activeSampleCourseId !== null) {
      return null;
    }
  }

  const positions = parsePositions(value.positions, pointIds);
  if (!positions) return null;

  return {
    version: 1,
    id: value.id,
    kind,
    courseTitle: value.courseTitle,
    chapters: value.chapters.map((chapter) => ({ ...chapter })),
    points: value.points.map((point) => ({
      ...point,
      position: { ...point.position },
      relatedIds: [...point.relatedIds],
    })),
    noteSource: { ...noteSource },
    activeSampleCourseId: activeSampleCourseId as SampleCourseId | null,
    positions,
    budgetMinutes: value.budgetMinutes,
    savedAt: value.savedAt,
  };
}

function parseWorkspaceBackup(value: unknown): WorkspaceBackup | null {
  if (!isRecord(value) || value.version !== 1) return null;
  if (typeof value.clearedAt !== 'number' || !Number.isFinite(value.clearedAt)) {
    return null;
  }

  const workspace = parseWorkspaceSnapshot(value.workspace);
  if (!workspace) return null;

  return {
    version: 1,
    clearedAt: value.clearedAt,
    workspace,
  };
}

export function loadWorkspaceSnapshot(): WorkspaceLoadResult {
  let rawValue: string | null;

  try {
    rawValue = window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
  } catch {
    return { status: 'unavailable' };
  }

  if (!rawValue) return { status: 'empty' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return { status: 'corrupt' };
  }

  const snapshot = parseWorkspaceSnapshot(parsed);
  return snapshot ? { status: 'ok', snapshot } : { status: 'corrupt' };
}

export function saveWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
  try {
    window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

export function saveWorkspaceBackup(
  snapshot: WorkspaceSnapshot,
  clearedAt = Date.now(),
) {
  const backup: WorkspaceBackup = {
    version: 1,
    clearedAt,
    workspace: snapshot,
  };

  try {
    window.localStorage.setItem(
      WORKSPACE_BACKUP_STORAGE_KEY,
      JSON.stringify(backup),
    );
    return true;
  } catch {
    return false;
  }
}

export function loadWorkspaceBackup(): WorkspaceBackupLoadResult {
  let rawValue: string | null;

  try {
    rawValue = window.localStorage.getItem(WORKSPACE_BACKUP_STORAGE_KEY);
  } catch {
    return { status: 'unavailable' };
  }

  if (!rawValue) return { status: 'empty' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return { status: 'corrupt' };
  }

  const backup = parseWorkspaceBackup(parsed);
  return backup ? { status: 'ok', backup } : { status: 'corrupt' };
}

export function clearAllLocalWorkspaceData() {
  try {
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    window.localStorage.removeItem(WORKSPACE_BACKUP_STORAGE_KEY);
    window.localStorage.removeItem(NODE_POSITIONS_STORAGE_KEY);
    window.localStorage.removeItem(NODE_EDITS_STORAGE_KEY);
    window.localStorage.removeItem(LEARNING_RECORDS_STORAGE_KEY);
  } catch {
    // 本地存储不可用时无需清理。
  }
}

export function createWorkspaceSnapshot(
  input: WorkspaceSnapshotInput,
  savedAt = Date.now(),
): WorkspaceSnapshot {
  return {
    version: 1,
    ...input,
    chapters: input.chapters.map((chapter) => ({ ...chapter })),
    points: input.points.map((point) => ({
      ...point,
      position: { ...point.position },
      relatedIds: [...point.relatedIds],
    })),
    noteSource: { ...input.noteSource },
    positions: { ...input.positions },
    savedAt,
  };
}

export function createBlankWorkspaceSnapshot(savedAt = Date.now()): WorkspaceSnapshot {
  return createWorkspaceSnapshot(
    {
      id: 'blank',
      kind: 'blank',
      courseTitle: '空白星图',
      chapters: [],
      points: [],
      noteSource: BLANK_NOTE_SOURCE,
      activeSampleCourseId: null,
      positions: {},
      budgetMinutes: DEFAULT_WORKSPACE_BUDGET_MINUTES,
    },
    savedAt,
  );
}

export function countWorkspaceRelations(points: KnowledgePoint[]) {
  const relatedKeys = new Set<string>();

  points.forEach((point) => {
    point.relatedIds.forEach((relatedId) => {
      relatedKeys.add([point.id, relatedId].sort().join('|'));
    });
  });

  return points.filter((point) => point.parentId !== null).length + relatedKeys.size;
}

export interface AppendImportedCourseResult {
  points: KnowledgePoint[];
  chapters: ChapterDefinition[];
  positions: SavedNodePositions;
}

export function appendImportedCourse(
  existing: {
    points: KnowledgePoint[];
    chapters: ChapterDefinition[];
    positions: SavedNodePositions;
  },
  course: ImportedCourse,
): AppendImportedCourseResult {
  const existingIds = new Set<string>([
    ...existing.points.map((point) => point.id),
    ...existing.chapters.map((chapter) => chapter.id),
  ]);

  let suffixIndex = 1;
  let suffix = '';

  while (suffix === '') {
    const candidate = `-appended-${suffixIndex}`;
    const candidateIds = [
      ...course.points.map((point) => `${point.id}${candidate}`),
      ...course.chapters.map((chapter) => `${chapter.id}${candidate}`),
    ];

    if (!candidateIds.some((id) => existingIds.has(id))) {
      suffix = candidate;
    } else {
      suffixIndex += 1;
    }
  }

  const importedPointIds = new Set(course.points.map((point) => point.id));
  const chapterIdByImportedId = new Map(
    course.chapters.map((chapter) => [chapter.id, `${chapter.id}${suffix}`]),
  );

  const existingX = [
    ...existing.points.map((point) => point.position.x),
    ...Object.values(existing.positions).map((position) => position.x),
  ];
  const importedX = course.points.map((point) => point.position.x);
  const maxExistingX = existingX.length > 0 ? Math.max(...existingX) : 0;
  const minImportedX = importedX.length > 0 ? Math.min(...importedX) : 0;
  const offsetX = existingX.length > 0 ? maxExistingX + 220 - minImportedX : 0;

  const points: KnowledgePoint[] = course.points.map((point) => {
    const position = { x: point.position.x + offsetX, y: point.position.y };

    return {
      ...point,
      id: `${point.id}${suffix}`,
      parentId:
        point.parentId && importedPointIds.has(point.parentId)
          ? `${point.parentId}${suffix}`
          : null,
      relatedIds: point.relatedIds
        .filter((relatedId) => importedPointIds.has(relatedId))
        .map((relatedId) => `${relatedId}${suffix}`),
      chapterId: chapterIdByImportedId.get(point.chapterId) ?? `${point.chapterId}${suffix}`,
      position,
    };
  });

  const positions: SavedNodePositions = { ...existing.positions };
  points.forEach((point) => {
    positions[point.id] = { ...point.position };
  });

  return {
    points: [...existing.points, ...points],
    chapters: [
      ...existing.chapters,
      ...course.chapters.map((chapter) => ({
        ...chapter,
        id: chapterIdByImportedId.get(chapter.id) ?? `${chapter.id}${suffix}`,
      })),
    ],
    positions,
  };
}
