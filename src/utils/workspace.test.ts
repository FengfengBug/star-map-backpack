import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ImportedCourse } from '../parsers/importedNote';
import type {
  ChapterDefinition,
  KnowledgePoint,
} from '../types/knowledge';
import {
  LEARNING_RECORDS_STORAGE_KEY,
  NODE_EDITS_STORAGE_KEY,
  NODE_POSITIONS_STORAGE_KEY,
  type SavedNodePositions,
} from './storage';
import {
  BLANK_NOTE_SOURCE,
  WORKSPACE_BACKUP_STORAGE_KEY,
  WORKSPACE_STORAGE_KEY,
  appendImportedCourse,
  clearAllLocalWorkspaceData,
  countWorkspaceRelations,
  createBlankWorkspaceSnapshot,
  createWorkspaceSnapshot,
  loadWorkspaceBackup,
  loadWorkspaceSnapshot,
  parseWorkspaceSnapshot,
  saveWorkspaceBackup,
  saveWorkspaceSnapshot,
} from './workspace';

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

function useMemoryStorage() {
  const storage = createMemoryStorage();
  vi.stubGlobal('window', { localStorage: storage });
  return storage;
}

const chapters: ChapterDefinition[] = [
  { id: 'trees', label: '树与查找', caption: 'TREES', tone: 'cyan' },
];

const points: KnowledgePoint[] = [
  {
    id: 'binary-tree',
    title: '二叉树',
    content: '二叉树每个节点最多有两个子节点。',
    parentId: null,
    scoreShare: 12,
    mastery: 43,
    estimatedMinutes: 30,
    reviewed: false,
    position: { x: 120, y: 240 },
    chapterId: 'trees',
    tone: 'cyan',
    relatedIds: [],
  },
];

const positions: SavedNodePositions = {
  'binary-tree': { x: 520, y: 320 },
};

function createSampleSnapshot() {
  return createWorkspaceSnapshot({
    id: 'sample:data-structures',
    kind: 'sample',
    courseTitle: '数据结构与算法',
    chapters,
    points,
    noteSource: {
      fileName: '数据结构与算法_期末复习.md',
      subtitle: '期末复习 · 示例课程',
      excerpt: '示例摘要',
      characterCount: 2860,
      kind: 'sample',
    },
    activeSampleCourseId: 'data-structures',
    positions,
    budgetMinutes: 150,
  });
}

const importedCourse: ImportedCourse = {
  points: [
    {
      id: 'alpha',
      title: 'Alpha',
      content: 'Alpha 正文',
      parentId: null,
      scoreShare: null,
      mastery: null,
      estimatedMinutes: null,
      reviewed: false,
      position: { x: 0, y: 20 },
      chapterId: 'import-section-1',
      tone: 'blue',
      relatedIds: ['beta'],
      level: 1,
    },
    {
      id: 'beta',
      title: 'Beta',
      content: 'Beta 正文',
      parentId: 'alpha',
      scoreShare: null,
      mastery: null,
      estimatedMinutes: null,
      reviewed: false,
      position: { x: 40, y: 120 },
      chapterId: 'import-section-1',
      tone: 'blue',
      relatedIds: ['alpha'],
      level: 2,
    },
  ],
  chapters: [
    {
      id: 'import-section-1',
      label: '新章节',
      caption: 'SECTION 01',
      tone: 'blue',
    },
  ],
  summary: {
    fileName: '新笔记.md',
    courseTitle: '新笔记',
    excerpt: '新笔记摘要',
    characterCount: 120,
    sourceKind: 'file',
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('workspace storage', () => {
  it('空白快照可以持久化并原样读回', () => {
    const storage = useMemoryStorage();
    const snapshot = createBlankWorkspaceSnapshot(1000);

    expect(saveWorkspaceSnapshot(snapshot)).toBe(true);
    expect(loadWorkspaceSnapshot()).toEqual({ status: 'ok', snapshot });
    expect(parseWorkspaceSnapshot(snapshot)).toEqual(snapshot);
    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).not.toBeNull();
  });

  it('区分空存储、损坏快照与不可用存储', () => {
    const storage = useMemoryStorage();
    expect(loadWorkspaceSnapshot()).toEqual({ status: 'empty' });

    storage.setItem(WORKSPACE_STORAGE_KEY, '{broken');
    expect(loadWorkspaceSnapshot()).toEqual({ status: 'corrupt' });

    storage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({ ...createBlankWorkspaceSnapshot(), points, chapters }),
    );
    expect(loadWorkspaceSnapshot()).toEqual({ status: 'corrupt' });

    vi.stubGlobal('window', {
      get localStorage() {
        throw new Error('blocked');
      },
    });
    expect(loadWorkspaceSnapshot()).toEqual({ status: 'unavailable' });
  });

  it('快照拒绝悬空的章节、父节点与关联引用', () => {
    const snapshot = createSampleSnapshot();

    expect(
      parseWorkspaceSnapshot({
        ...snapshot,
        points: [{ ...points[0], chapterId: 'missing' }],
      }),
    ).toBeNull();
    expect(
      parseWorkspaceSnapshot({
        ...snapshot,
        points: [{ ...points[0], parentId: 'missing' }],
      }),
    ).toBeNull();
    expect(
      parseWorkspaceSnapshot({
        ...snapshot,
        points: [{ ...points[0], relatedIds: ['missing'] }],
      }),
    ).toBeNull();
  });

  it('最近一次清空备份可以写入、读取并识别损坏', () => {
    const storage = useMemoryStorage();
    const snapshot = createSampleSnapshot();

    expect(saveWorkspaceBackup(snapshot)).toBe(true);
    const loaded = loadWorkspaceBackup();
    expect(loaded.status).toBe('ok');
    if (loaded.status === 'ok') {
      expect(loaded.backup.workspace.points).toEqual(snapshot.points);
    }

    storage.setItem(WORKSPACE_BACKUP_STORAGE_KEY, '{broken');
    expect(loadWorkspaceBackup()).toEqual({ status: 'corrupt' });
  });

  it('清除本机数据会移除工作区、备份、学习记录与旧版坐标/编辑键', () => {
    const storage = useMemoryStorage();
    storage.setItem(WORKSPACE_STORAGE_KEY, '{}');
    storage.setItem(WORKSPACE_BACKUP_STORAGE_KEY, '{}');
    storage.setItem(NODE_POSITIONS_STORAGE_KEY, '{}');
    storage.setItem(NODE_EDITS_STORAGE_KEY, '{}');
    storage.setItem(LEARNING_RECORDS_STORAGE_KEY, '[]');

    clearAllLocalWorkspaceData();

    expect(storage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(WORKSPACE_BACKUP_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(NODE_POSITIONS_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(NODE_EDITS_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(LEARNING_RECORDS_STORAGE_KEY)).toBeNull();
  });

  it('空白备注来源与统计保持稳定', () => {
    expect(BLANK_NOTE_SOURCE.kind).toBe('blank');
    expect(
      countWorkspaceRelations([
        ...points,
        { ...points[0], id: 'tree-traversal', parentId: 'binary-tree' },
      ]),
    ).toBe(1);
  });
});

describe('appendImportedCourse', () => {
  it('追加时保留现有节点、参数与坐标，并生成新 ID 和新章节', () => {
    const result = appendImportedCourse(
      {
        points: [{ ...points[0], scoreShare: 18, mastery: 66 }],
        chapters,
        positions,
      },
      importedCourse,
    );

    expect(result.points).toHaveLength(3);
    expect(result.chapters).toHaveLength(2);
    expect(result.points[0]).toMatchObject({
      id: 'binary-tree',
      scoreShare: 18,
      mastery: 66,
    });
    expect(result.positions['binary-tree']).toEqual({ x: 520, y: 320 });

    const appended = result.points.slice(1);
    expect(appended[0].id).toBe('alpha-appended-1');
    expect(appended[1].id).toBe('beta-appended-1');
    expect(appended[1].parentId).toBe('alpha-appended-1');
    expect(appended[0].relatedIds).toEqual(['beta-appended-1']);
    expect(new Set(result.points.map((point) => point.id)).size).toBe(3);
    expect(result.chapters[1].id).toBe('import-section-1-appended-1');
    expect(result.points[1].chapterId).toBe('import-section-1-appended-1');

    expect(result.positions[appended[0].id]?.x).toBeGreaterThan(
      Math.max(...Object.values(positions).map((position) => position.x)),
    );
    expect(appended[0].position.y).toBe(20);
  });

  it('连续追加同一课程时生成新的唯一后缀，不覆盖已追加节点', () => {
    const first = appendImportedCourse(
      { points: [points[0]], chapters, positions },
      importedCourse,
    );
    const second = appendImportedCourse(
      {
        points: first.points,
        chapters: first.chapters,
        positions: first.positions,
      },
      importedCourse,
    );

    expect(second.points.map((point) => point.id)).toEqual([
      'binary-tree',
      'alpha-appended-1',
      'beta-appended-1',
      'alpha-appended-2',
      'beta-appended-2',
    ]);
    expect(second.chapters.map((chapter) => chapter.id)).toEqual([
      'trees',
      'import-section-1-appended-1',
      'import-section-1-appended-2',
    ]);
    expect(second.positions['alpha-appended-1']).toEqual(
      first.positions['alpha-appended-1'],
    );
    expect(second.positions['alpha-appended-2']?.x).toBeGreaterThan(
      second.positions['alpha-appended-1']?.x ?? 0,
    );
  });
});
