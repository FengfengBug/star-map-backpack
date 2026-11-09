import { describe, expect, it } from 'vitest';
import { planReviewRoute } from '../algorithms/knapsack';
import type { KnowledgePoint } from '../types/knowledge';
import { createReviewRouteItems, createRouteStateMap } from './reviewRoute';

function createPoint(
  overrides: Partial<KnowledgePoint> & Pick<KnowledgePoint, 'id'>,
): KnowledgePoint {
  return {
    title: overrides.id,
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

describe('createReviewRouteItems', () => {
  it('只把未复习节点送入复习池', () => {
    const items = createReviewRouteItems([
      createPoint({ id: 'reviewed', reviewed: true }),
      createPoint({ id: 'pending', scoreShare: null }),
    ]);

    expect(items).toEqual([
      { id: 'pending', scoreShare: null, mastery: 50, estimatedMinutes: 10 },
    ]);
  });
});

describe('createRouteStateMap', () => {
  const points = [
    createPoint({ id: 'selected', scoreShare: 10, mastery: 50, estimatedMinutes: 10 }),
    createPoint({ id: 'skipped', scoreShare: 10, mastery: 50, estimatedMinutes: 20 }),
    createPoint({ id: 'pending', mastery: null }),
    createPoint({ id: 'no-gap', mastery: 100, scoreShare: 5, estimatedMinutes: 5 }),
  ];
  const result = planReviewRoute(createReviewRouteItems(points), 10);
  const routeStates = createRouteStateMap(result);

  it('选中与放弃节点映射为航线状态', () => {
    expect(routeStates.get('selected')).toBe('selected');
    expect(routeStates.get('skipped')).toBe('skipped');
  });

  it('掌握度缺口为 0 的节点标记为放弃', () => {
    expect(result.decisions.find((item) => item.id === 'no-gap')?.reason.code).toBe(
      'skipped-no-mastery-gap',
    );
    expect(routeStates.get('no-gap')).toBe('skipped');
  });

  it('待设置参数的节点不标记为放弃', () => {
    expect(result.skippedIds).toContain('pending');
    expect(routeStates.has('pending')).toBe(false);
  });
});
