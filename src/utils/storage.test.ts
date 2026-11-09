import { afterEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgePoint, KnowledgePointEditableFields } from '../types/knowledge';
import {
  NODE_EDITS_STORAGE_KEY,
  NODE_POSITIONS_STORAGE_KEY,
  applySavedNodeEdits,
  clearNodePositions,
  loadNodeEdits,
  loadNodePositions,
  saveNodeEdit,
} from './storage';

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

const binaryTreePoint: KnowledgePoint = {
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
  tone: 'violet',
  relatedIds: ['tree-traversal'],
};

const linearListPoint: KnowledgePoint = {
  ...binaryTreePoint,
  id: 'linear-list',
  title: '线性表',
};

const validFields: KnowledgePointEditableFields = {
  title: '二叉树（修订）',
  content: '更新后的知识摘要。',
  scoreShare: 10,
  estimatedMinutes: 25,
  mastery: 55,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('storage', () => {
  it('继续读取旧的坐标存储键，并过滤损坏坐标', () => {
    const storage = useMemoryStorage();
    storage.setItem(
      NODE_POSITIONS_STORAGE_KEY,
      JSON.stringify({
        'binary-tree': { x: 10, y: 20 },
        broken: { x: '10', y: 20 },
        missing: null,
      }),
    );

    expect(loadNodePositions()).toEqual({
      'binary-tree': { x: 10, y: 20 },
    });
  });

  it('按课程命名空间持久化节点编辑并正确回读', () => {
    const storage = useMemoryStorage();

    saveNodeEdit('sample:data-structures', 'binary-tree', validFields);
    saveNodeEdit('sample:data-structures', 'linear-list', {
      ...validFields,
      title: '线性表（修订）',
    });

    expect(loadNodeEdits('sample:data-structures')).toEqual({
      'binary-tree': validFields,
      'linear-list': { ...validFields, title: '线性表（修订）' },
    });
    expect(loadNodeEdits('sample:computer-organization')).toEqual({});

    const raw = storage.getItem(NODE_EDITS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? '{}')).toMatchObject({
      'sample:data-structures': {
        'binary-tree': validFields,
      },
    });
  });

  it('损坏的编辑数据不会阻塞读取', () => {
    const storage = useMemoryStorage();
    storage.setItem(NODE_EDITS_STORAGE_KEY, '{not-json');

    expect(loadNodeEdits('sample:data-structures')).toEqual({});

    storage.setItem(
      NODE_EDITS_STORAGE_KEY,
      JSON.stringify({
        'sample:data-structures': {
          'binary-tree': { ...validFields, title: '' },
          'linear-list': { ...validFields, mastery: 101 },
        },
      }),
    );

    expect(loadNodeEdits('sample:data-structures')).toEqual({});
  });

  it('应用编辑时只合并命中节点，未命中节点保持引用不变', () => {
    const result = applySavedNodeEdits([binaryTreePoint, linearListPoint], {
      'binary-tree': validFields,
    });

    expect(result[0]).toMatchObject({
      id: 'binary-tree',
      chapterId: 'trees',
      ...validFields,
    });
    expect(result[1]).toBe(linearListPoint);
  });

  it('恢复布局只清除坐标，不清除节点编辑', () => {
    const storage = useMemoryStorage();
    storage.setItem(
      NODE_POSITIONS_STORAGE_KEY,
      JSON.stringify({ 'binary-tree': { x: 1, y: 2 } }),
    );
    saveNodeEdit('sample:data-structures', 'binary-tree', validFields);

    clearNodePositions();

    expect(storage.getItem(NODE_POSITIONS_STORAGE_KEY)).toBeNull();
    expect(loadNodeEdits('sample:data-structures')).toEqual({
      'binary-tree': validFields,
    });
  });
});
