import { describe, expect, it } from 'vitest';
import {
  describeReason,
  planReviewRoute,
  type KnapsackItem,
} from './knapsack';

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
      decisions: [],
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

describe('planReviewRoute 可解释输出', () => {
  it('每个节点都有决策，selected 标记与结果一致', () => {
    const items = [
      item('selected', 10, 50, 5),
      item('not-in-route', 1, 50, 5),
      item('over-budget', 10, 50, 30),
      item('pending', null, 50, 5),
      item('invalid', 0, 50, 5),
      item('mastered', 10, 100, 5),
    ];
    const result = planReviewRoute(items, 5);

    expect(result.selectedIds).toEqual(['selected']);
    expect(result.decisions.map((decision) => decision.id)).toEqual(
      items.map((entry) => entry.id),
    );
    expect(
      result.decisions
        .filter((decision) => decision.selected)
        .map((decision) => decision.id),
    ).toEqual(result.selectedIds);

    for (const decision of result.decisions) {
      expect(decision.reason.code).toBeTruthy();
      expect(decision.message).toBe(describeReason(decision.reason));
    }
  });

  it('选中理由引用分值、掌握度缺口、收益、用时与预算', () => {
    const result = planReviewRoute([item('a', 8, 40, 20)], 30);
    const [decision] = result.decisions;

    expect(decision.selected).toBe(true);
    expect(decision.reason.code).toBe('selected-in-route');
    expect(decision.reason.params).toMatchObject({
      budgetMinutes: 30,
      scoreShare: 8,
      mastery: 40,
      masteryGap: 60,
      estimatedMinutes: 20,
      benefit: 480,
    });
    expect(decision.message).toContain('分值占比 8%');
    expect(decision.message).toContain('掌握度缺口 60%');
    expect(decision.message).toContain('收益 480');
  });

  it('超预算节点给出用时与预算对比', () => {
    const result = planReviewRoute([item('slow', 10, 50, 40)], 30);
    const [decision] = result.decisions;

    expect(decision.reason.code).toBe('skipped-over-budget');
    expect(decision.message).toContain('40 分钟');
    expect(decision.message).toContain('30 分钟预算');
  });

  it('待设置节点列出缺失字段', () => {
    const result = planReviewRoute([item('pending', null, 60, null)], 30);
    const [decision] = result.decisions;

    expect(decision.reason.code).toBe('skipped-pending-parameters');
    expect(decision.reason.params.pendingFields).toEqual([
      'scoreShare',
      'estimatedMinutes',
    ]);
    expect(decision.message).toContain('分值占比、预计用时待设置');
  });

  it('非法参数节点指出字段与当前值', () => {
    const result = planReviewRoute([item('bad', 0, 150, 2.5)], 30);
    const [decision] = result.decisions;

    expect(decision.reason.code).toBe('skipped-invalid-parameters');
    expect(decision.reason.params.invalidFields).toEqual([
      'scoreShare',
      'estimatedMinutes',
      'mastery',
    ]);
    expect(decision.message).toContain('分值占比需大于 0（当前 0）');
    expect(decision.message).toContain('预计用时应为正整数（当前 2.5）');
    expect(decision.message).toContain('掌握度需在 0–100 之间（当前 150）');
  });

  it('掌握度 100 的节点说明收益为 0', () => {
    const result = planReviewRoute([item('done', 10, 100, 5)], 30);
    const [decision] = result.decisions;

    expect(decision.reason.code).toBe('skipped-no-mastery-gap');
    expect(decision.reason.params.masteryGap).toBe(0);
    expect(decision.reason.params.benefit).toBe(0);
    expect(decision.message).toContain('掌握度 100%');
    expect(decision.message).toContain('收益为 0');
  });

  it('未入选节点给出自身收益与选中组合总收益', () => {
    const result = planReviewRoute(
      [item('best', 10, 50, 5), item('alt', 1, 50, 5)],
      5,
    );
    const alt = result.decisions.find((decision) => decision.id === 'alt');

    expect(alt?.reason.code).toBe('skipped-not-in-route');
    expect(alt?.reason.params.benefit).toBe(50);
    expect(alt?.reason.params.totalBenefit).toBe(500);
    expect(alt?.message).toContain('总收益 500');
  });

  it('理由参数与输入一致，文案可由结构化 reason 复现', () => {
    const items = [item('a', 12, 30, 25), item('b', 4, 80, 15)];
    const result = planReviewRoute(items, 25);

    result.decisions.forEach((decision, index) => {
      expect(decision.reason.params.scoreShare).toBe(items[index].scoreShare);
      expect(decision.reason.params.mastery).toBe(items[index].mastery);
      expect(decision.reason.params.estimatedMinutes).toBe(
        items[index].estimatedMinutes,
      );
      expect(decision.reason.params.budgetMinutes).toBe(25);
      expect(decision.message).toBe(describeReason(decision.reason));
    });
  });
});
