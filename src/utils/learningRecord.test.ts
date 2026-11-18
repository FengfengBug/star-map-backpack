import { describe, expect, it } from 'vitest';
import { planReviewRoute } from '../algorithms/knapsack';
import type { KnowledgePoint } from '../types/knowledge';
import { createPlanChange, type PlanChangeCause } from './planChange';
import { createReviewRouteItems } from './reviewRoute';
import {
  createPlanChangeLearningRecord,
  createPlanUndoLearningRecord,
  createReviewLearningRecord,
} from './learningRecord';

function createPoint(
  overrides: Partial<KnowledgePoint> & Pick<KnowledgePoint, 'id' | 'title'>,
): KnowledgePoint {
  return {
    content: '不应写入学习记录的敏感笔记全文',
    parentId: null,
    scoreShare: 10,
    mastery: 50,
    estimatedMinutes: 10,
    reviewed: false,
    position: { x: 0, y: 0 },
    chapterId: 'chapter-1',
    tone: 'blue',
    relatedIds: [],
    ...overrides,
  };
}

function createChange(cause?: PlanChangeCause) {
  const previousPoints = [
    createPoint({ id: 'a', title: '二叉树', scoreShare: 10 }),
    createPoint({ id: 'b', title: '平衡二叉树', scoreShare: 9 }),
  ];
  const nextPoints = previousPoints.map((point) =>
    point.id === 'a' ? { ...point, mastery: 90 } : point,
  );
  const plan = (points: KnowledgePoint[]) =>
    planReviewRoute(createReviewRouteItems(points), 10);
  const change = createPlanChange({
    cause: cause ?? {
      kind: 'mastery',
      nodeId: 'a',
      title: '二叉树',
      previousMastery: 50,
      nextMastery: 90,
    },
    previousPlan: plan(previousPoints),
    nextPlan: plan(nextPoints),
    points: nextPoints,
  });

  if (!change) throw new Error('Expected a route membership change');
  return change;
}

describe('learningRecord', () => {
  it('复习记录保留时间、节点与掌握度，不携带笔记正文', () => {
    const point = createPoint({ id: 'a', title: '二叉树' });
    const record = createReviewLearningRecord(point, true, 1_800_000_000_000);

    expect(record).toMatchObject({
      occurredAt: 1_800_000_000_000,
      category: 'review',
      kind: 'reviewed',
      nodeId: 'a',
      nodeTitle: '二叉树',
      mastery: 50,
    });
    expect(record.summary).toContain('退出本轮复习池');
    expect(JSON.stringify(record)).not.toContain(point.content);
    expect(JSON.stringify(record)).not.toContain('"content"');
  });

  it('重排与撤销记录保存完整成员变化和用时边界', () => {
    const change = createChange();
    const replanned = createPlanChangeLearningRecord(change, 1_800_000_000_000);
    const undo = createPlanUndoLearningRecord(change, 1_800_000_000_000);

    expect(replanned).toMatchObject({
      category: 'route',
      kind: 'replanned',
      nodeId: 'a',
      removed: [{ id: 'a', title: '二叉树' }],
      added: [{ id: 'b', title: '平衡二叉树' }],
      previousMastery: 50,
      nextMastery: 90,
      previousMinutes: 10,
      nextMinutes: 10,
    });
    expect(replanned.summary).toContain('掌握度提升，收益下降');
    expect(replanned.details).toEqual(['移出 二叉树', '加入 平衡二叉树']);
    expect(undo.kind).toBe('undo');
    expect(undo.summary).toContain('掌握度、复习状态与节点参数保持当前值');
    expect(undo.id).not.toBe(replanned.id);
    expect(JSON.stringify(undo)).not.toContain('敏感笔记全文');
  });
});
