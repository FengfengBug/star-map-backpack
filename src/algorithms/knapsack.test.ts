import { describe, expect, it } from 'vitest';
import { planReviewRoute, type KnapsackItem } from './knapsack';

function item(
  id: string,
  scoreShare: number | null,
  mastery: number | null,
  estimatedMinutes: number | null,
): KnapsackItem {
  return { id, scoreShare, mastery, estimatedMinutes };
}

describe('planReviewRoute', () => {
  it('空输入返回空结果', () => {
    expect(planReviewRoute([], 120)).toEqual({
      selectedIds: [],
      skippedIds: [],
      totalBenefit: 0,
      totalMinutes: 0,
    });
  });

  it('预算为 0 时放弃全部节点', () => {
    const result = planReviewRoute(
      [item('a', 10, 50, 5), item('b', 20, 80, 10)],
      0,
    );

    expect(result.selectedIds).toEqual([]);
    expect(result.skippedIds).toEqual(['a', 'b']);
    expect(result.totalBenefit).toBe(0);
    expect(result.totalMinutes).toBe(0);
  });

  it('单个节点超出预算时放弃', () => {
    const result = planReviewRoute([item('a', 10, 50, 30)], 10);

    expect(result.selectedIds).toEqual([]);
    expect(result.skippedIds).toEqual(['a']);
  });

  it('预算充足时全部选中并累计收益与用时', () => {
    const result = planReviewRoute(
      [item('a', 10, 50, 5), item('b', 20, 80, 10)],
      15,
    );

    expect(result.selectedIds).toEqual(['a', 'b']);
    expect(result.skippedIds).toEqual([]);
    expect(result.totalBenefit).toBe(500 + 400);
    expect(result.totalMinutes).toBe(15);
  });

  it('按收益与用时选出最优组合，而非贪心取第一个', () => {
    const result = planReviewRoute(
      [item('a', 10, 50, 6), item('b', 8, 50, 5), item('c', 8, 50, 5)],
      10,
    );

    expect(result.selectedIds).toEqual(['b', 'c']);
    expect(result.totalBenefit).toBe(800);
    expect(result.totalMinutes).toBe(10);
  });

  it('收益并列时优先保留输入顺序靠前的节点', () => {
    const result = planReviewRoute(
      [item('a', 10, 10, 10), item('b', 5, 10, 5), item('c', 5, 10, 5)],
      10,
    );

    expect(result.selectedIds).toEqual(['a']);
    expect(result.totalBenefit).toBe(900);
  });

  it('掌握度 100 的节点收益为 0，不占用预算', () => {
    const result = planReviewRoute(
      [item('a', 50, 100, 5), item('b', 5, 50, 5)],
      10,
    );

    expect(result.selectedIds).toEqual(['b']);
    expect(result.skippedIds).toEqual(['a']);
    expect(result.totalMinutes).toBe(5);
  });

  it('参数待设置的节点计入放弃列表，其余节点正常参与', () => {
    const result = planReviewRoute(
      [item('pending', null, 60, 20), item('no-time', 10, 60, null), item('ok', 10, 60, 10)],
      20,
    );

    expect(result.selectedIds).toEqual(['ok']);
    expect(result.skippedIds).toEqual(['pending', 'no-time']);
  });

  it('非法参数节点不参与选择', () => {
    const result = planReviewRoute(
      [
        item('zero-score', 0, 50, 10),
        item('bad-mastery', 10, 120, 10),
        item('zero-time', 10, 50, 0),
        item('fraction-time', 10, 50, 2.5),
        item('negative-time', 10, 50, -5),
        item('ok', 10, 50, 10),
      ],
      60,
    );

    expect(result.selectedIds).toEqual(['ok']);
    expect(result.skippedIds).toEqual([
      'zero-score',
      'bad-mastery',
      'zero-time',
      'fraction-time',
      'negative-time',
    ]);
  });

  it('小数预算向下取整、负数预算视为 0', () => {
    const fractional = planReviewRoute([item('a', 10, 50, 10)], 9.9);
    expect(fractional.selectedIds).toEqual([]);

    const negative = planReviewRoute([item('a', 10, 50, 1)], -30);
    expect(negative.selectedIds).toEqual([]);
  });

  it('不修改输入数组与节点对象', () => {
    const items = [item('a', 10, 50, 5), item('b', null, null, null)];
    const snapshot = structuredClone(items);

    planReviewRoute(items, 30);

    expect(items).toEqual(snapshot);
  });
});
