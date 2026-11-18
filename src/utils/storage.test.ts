import { afterEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgePoint, KnowledgePointEditableFields } from '../types/knowledge';
import { createReviewLearningRecord } from './learningRecord';
import {
  LEARNING_RECORDS_STORAGE_KEY,
  NODE_EDITS_STORAGE_KEY,
  NODE_POSITIONS_STORAGE_KEY,
  applySavedNodeEdits,
  clearLearningRecords,
  clearNodePositions,
  loadLearningRecords,
  loadNodeEdits,
  loadNodePositions,
  saveLearningRecords,
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

  it('学习记录独立持久化，存储内容不包含笔记正文', () => {
    const storage = useMemoryStorage();
    const record = createReviewLearningRecord(binaryTreePoint, true, 1_800_000_000_000);

    expect(saveLearningRecords([record])).toBe(true);
    expect(loadLearningRecords()).toEqual({ status: 'ok', records: [record] });

    const raw = storage.getItem(LEARNING_RECORDS_STORAGE_KEY) ?? '';
    expect(raw).toContain('binary-tree');
    expect(raw).toContain('二叉树');
    expect(raw).not.toContain(binaryTreePoint.content);
    expect(raw).not.toContain('"content"');

    expect(clearLearningRecords()).toBe(true);
    expect(loadLearningRecords()).toEqual({ status: 'empty', records: [] });
  });

  it('跳过损坏的学习记录，并区分读取不可用', () => {
    const storage = useMemoryStorage();
    const record = createReviewLearningRecord(binaryTreePoint, true, 1_800_000_000_000);
    storage.setItem(
      LEARNING_RECORDS_STORAGE_KEY,
      JSON.stringify([record, { ...record, id: 'broken', mastery: 101 }, null]),
    );

    expect(loadLearningRecords()).toEqual({ status: 'corrupt', records: [record] });

    storage.setItem(LEARNING_RECORDS_STORAGE_KEY, '{not-json');
    expect(loadLearningRecords()).toEqual({ status: 'corrupt', records: [] });

    vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    expect(loadLearningRecords()).toEqual({ status: 'unavailable', records: [] });
  });

  it('学习记录写入或清空失败时返回失败，不伪报已保存', () => {
    const storage = useMemoryStorage();
    const record = createReviewLearningRecord(binaryTreePoint, true, 1_800_000_000_000);
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    expect(saveLearningRecords([record])).toBe(false);

    vi.spyOn(storage, 'removeItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    expect(clearLearningRecords()).toBe(false);
  });
});
