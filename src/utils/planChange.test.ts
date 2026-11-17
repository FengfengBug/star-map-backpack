import { describe, expect, it } from 'vitest';
import { planReviewRoute } from '../algorithms/knapsack';
import type { KnowledgePoint } from '../types/knowledge';
import { createPlanChange, getRoutePlanKey } from './planChange';
import { createReviewRouteItems } from './reviewRoute';

function createPoint(
  overrides: Partial<KnowledgePoint> & Pick<KnowledgePoint, 'id' | 'title'>,
): KnowledgePoint {
  return {
    content: '',
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

function createPoints(): KnowledgePoint[] {
  return [
    createPoint({ id: 'a', title: '节点 A', scoreShare: 10 }),
    createPoint({ id: 'b', title: '节点 B', scoreShare: 9 }),
    createPoint({ id: 'c', title: '节点 C', scoreShare: 8 }),
  ];
}

function plan(points: KnowledgePoint[], budgetMinutes = 10) {
  return planReviewRoute(createReviewRouteItems(points), budgetMinutes);
}

describe('createPlanChange', () => {
  it('列出移出与加入节点，并展示变化后的收益', () => {
    const previousPoints = createPoints();
    const nextPoints = previousPoints.map((point) =>
      point.id === 'a' ? { ...point, mastery: 90 } : point,
    );
    const previousPlan = plan(previousPoints);
    const nextPlan = plan(nextPoints);

    expect(previousPlan.selectedIds).toEqual(['a']);
    expect(nextPlan.selectedIds).toEqual(['b']);

    const change = createPlanChange({
      cause: {
        kind: 'mastery',
        nodeId: 'a',
        title: '节点 A',
        previousMastery: 50,
        nextMastery: 90,
      },
      previousPlan,
      nextPlan,
      points: nextPoints,
    });

    expect(change?.removed).toEqual([
      { id: 'a', title: '节点 A', estimatedMinutes: 10, benefit: 100 },
    ]);
    expect(change?.added).toEqual([
      { id: 'b', title: '节点 B', estimatedMinutes: 10, benefit: 450 },
    ]);
  });

  it('航线成员没有变化时不创建提示', () => {
    const previousPoints = createPoints();
    const nextPoints = previousPoints.map((point) =>
      point.id === 'a' ? { ...point, mastery: 52 } : point,
    );

    expect(
      createPlanChange({
        cause: {
          kind: 'mastery',
          nodeId: 'a',
          title: '节点 A',
          previousMastery: 50,
          nextMastery: 52,
        },
        previousPlan: plan(previousPoints),
        nextPlan: plan(nextPoints),
        points: nextPoints,
      }),
    ).toBeNull();
  });

  it('完整保留多个移出节点，已复习节点使用原航线收益', () => {
    const previousPoints = createPoints();
    const nextPoints = previousPoints.map((point) =>
      point.id === 'a' || point.id === 'b' ? { ...point, reviewed: true } : point,
    );
    const previousPlan = plan(previousPoints, 20);
    const nextPlan = plan(nextPoints, 20);

    expect(previousPlan.selectedIds).toEqual(['a', 'b']);
    expect(nextPlan.selectedIds).toEqual(['c']);

    const change = createPlanChange({
      cause: {
        kind: 'reviewed',
        nodeId: 'a',
        title: '节点 A',
        reviewed: true,
      },
      previousPlan,
      nextPlan,
      points: nextPoints,
    });

    expect(change?.removed.map((node) => node.id)).toEqual(['a', 'b']);
    expect(change?.removed.map((node) => node.benefit)).toEqual([500, 450]);
    expect(change?.added.map((node) => node.id)).toEqual(['c']);
  });
});

describe('getRoutePlanKey', () => {
  it('忽略标题与内容变化，但识别算法输入和预算变化', () => {
    const points = createPoints();
    const key = getRoutePlanKey(points, 60);
    const renamed = points.map((point) =>
      point.id === 'a' ? { ...point, title: '新标题', content: '新内容' } : point,
    );

    expect(getRoutePlanKey(renamed, 60)).toBe(key);
    expect(
      getRoutePlanKey(
        points.map((point) => (point.id === 'a' ? { ...point, mastery: 80 } : point)),
        60,
      ),
    ).not.toBe(key);
    expect(
      getRoutePlanKey(
        points.map((point) => (point.id === 'a' ? { ...point, reviewed: true } : point)),
        60,
      ),
    ).not.toBe(key);
    expect(getRoutePlanKey(points, 30)).not.toBe(key);
  });
});
