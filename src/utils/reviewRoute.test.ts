import { describe, expect, it } from 'vitest';
import { planReviewRoute } from '../algorithms/knapsack';
import type { KnowledgePoint } from '../types/knowledge';
import {
  createReviewRouteEdges,
  createReviewRouteItems,
  createRouteStateMap,
} from './reviewRoute';

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

describe('createReviewRouteEdges', () => {
  it('少于两个选中节点时不生成航线', () => {
    expect(createReviewRouteEdges([], { animated: true, animationRun: 0 })).toEqual([]);
    expect(createReviewRouteEdges(['a'], { animated: true, animationRun: 0 })).toEqual([]);
  });

  it('按选中顺序串联航线并依次延迟', () => {
    const edges = createReviewRouteEdges(['a', 'b', 'c'], {
      animated: true,
      animationRun: 3,
    });

    expect(edges.map((edge) => [edge.source, edge.target])).toEqual([
      ['a', 'b'],
      ['b', 'c'],
    ]);
    expect(edges.map((edge) => edge.data?.delayMs)).toEqual([0, 560]);
    expect(edges.every((edge) => edge.type === 'reviewRoute')).toBe(true);
    expect(edges.every((edge) => edge.id.includes(':3:'))).toBe(true);
    expect(edges.every((edge) => edge.data?.animated)).toBe(true);
  });

  it('关闭动画时仍生成完整航线并标记为静态', () => {
    const edges = createReviewRouteEdges(['a', 'b'], {
      animated: false,
      animationRun: 0,
    });

    expect(edges).toHaveLength(1);
    expect(edges[0].data?.animated).toBe(false);
  });
});
