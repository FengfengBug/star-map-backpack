import { describe, expect, it } from 'vitest';
import { planReviewRoute, type KnapsackItem } from '../algorithms/knapsack';
import { getRouteEmptyState } from './routeEmptyState';

function stateFor(items: KnapsackItem[], budgetMinutes: number, nodeCount = items.length) {
  return getRouteEmptyState({
    nodeCount,
    budgetMinutes,
    decisions: planReviewRoute(items, budgetMinutes).decisions,
  });
}

describe('getRouteEmptyState', () => {
  it('无知识点时优先返回 no-nodes', () => {
    expect(stateFor([], 150, 0)?.kind).toBe('no-nodes');
  });

  it('所有知识点已复习时返回 all-reviewed', () => {
    expect(stateFor([], 150, 3)?.kind).toBe('all-reviewed');
  });

  it('预算为 0 时返回 zero-budget 并保留可选最短用时', () => {
    const state = stateFor(
      [
        {
          id: 'a',
          scoreShare: 20,
          mastery: 40,
          estimatedMinutes: 30,
        },
      ],
      0,
    );

    expect(state).toMatchObject({
      kind: 'zero-budget',
      shortestNodeId: 'a',
      minRequiredMinutes: 30,
    });
  });

  it('参数全部待设置时返回 pending-parameters', () => {
    const state = stateFor(
      [
        {
          id: 'pending',
          scoreShare: null,
          mastery: null,
          estimatedMinutes: null,
        },
      ],
      150,
    );

    expect(state).toMatchObject({
      kind: 'pending-parameters',
      pendingCount: 1,
      invalidCount: 0,
      firstPendingNodeId: 'pending',
    });
  });

  it('参数非法时仍归入待处理状态并记录非法数量', () => {
    const state = stateFor(
      [
        {
          id: 'invalid',
          scoreShare: 0,
          mastery: 30,
          estimatedMinutes: 20,
        },
      ],
      150,
    );

    expect(state).toMatchObject({
      kind: 'pending-parameters',
      pendingCount: 1,
      invalidCount: 1,
    });
  });

  it('预算不足时返回最短知识点所需分钟', () => {
    const state = stateFor(
      [
        {
          id: 'short',
          scoreShare: 10,
          mastery: 50,
          estimatedMinutes: 20,
        },
        {
          id: 'long',
          scoreShare: 30,
          mastery: 50,
          estimatedMinutes: 40,
        },
      ],
      15,
    );

    expect(state).toMatchObject({
      kind: 'insufficient-budget',
      shortestNodeId: 'short',
      minRequiredMinutes: 20,
    });
  });

  it('待设置与预算不足并存时保留待处理数量', () => {
    const state = stateFor(
      [
        {
          id: 'pending',
          scoreShare: null,
          mastery: 50,
          estimatedMinutes: 20,
        },
        {
          id: 'valid',
          scoreShare: 20,
          mastery: 50,
          estimatedMinutes: 40,
        },
      ],
      15,
    );

    expect(state).toMatchObject({
      kind: 'insufficient-budget',
      pendingCount: 1,
      firstPendingNodeId: 'pending',
    });
  });

  it('所有有效知识点掌握度已满时返回 no-mastery-gap', () => {
    const state = stateFor(
      [
        {
          id: 'mastered',
          scoreShare: 20,
          mastery: 100,
          estimatedMinutes: 20,
        },
      ],
      150,
    );

    expect(state).toMatchObject({
      kind: 'no-mastery-gap',
      firstZeroGapNodeId: 'mastered',
    });
  });

  it('已有选中知识点时不属于空状态', () => {
    expect(
      stateFor(
        [
          {
            id: 'selected',
            scoreShare: 20,
            mastery: 40,
            estimatedMinutes: 20,
          },
        ],
        20,
      ),
    ).toBeNull();
  });
});
