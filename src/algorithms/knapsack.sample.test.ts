import { describe, expect, it } from 'vitest';
import { sampleCoursePackages } from '../data/sampleCourses';
import type { KnowledgePoint } from '../types/knowledge';
import {
  describeReason,
  planReviewRoute,
  type KnapsackItem,
  type KnapsackResult,
} from './knapsack';

function toItem(point: KnowledgePoint): KnapsackItem {
  return {
    id: point.id,
    scoreShare: point.scoreShare,
    mastery: point.mastery,
    estimatedMinutes: point.estimatedMinutes,
  };
}

function benefitOf(item: KnapsackItem): number {
  return (item.scoreShare ?? 0) * (100 - (item.mastery ?? 0));
}

function bruteForceBestBenefit(
  items: KnapsackItem[],
  budgetMinutes: number,
): number {
  let best = 0;
  const count = items.length;

  for (let mask = 0; mask < 1 << count; mask += 1) {
    let minutes = 0;
    let benefit = 0;

    for (let index = 0; index < count; index += 1) {
      if ((mask & (1 << index)) === 0) continue;
      minutes += items[index].estimatedMinutes ?? 0;
      benefit += benefitOf(items[index]);
      if (minutes > budgetMinutes) break;
    }

    if (minutes <= budgetMinutes && benefit > best) {
      best = benefit;
    }
  }

  return best;
}

function expectBudgetInvariants(
  items: KnapsackItem[],
  budgetMinutes: number,
  result: KnapsackResult,
) {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const allIds = items.map((item) => item.id);

  expect(result.totalMinutes).toBeLessThanOrEqual(budgetMinutes);
  expect(result.selectedIds.length + result.skippedIds.length).toBe(items.length);
  expect(new Set([...result.selectedIds, ...result.skippedIds]).size).toBe(
    items.length,
  );
  expect(result.decisions.map((decision) => decision.id)).toEqual(allIds);
  expect(
    result.decisions
      .filter((decision) => decision.selected)
      .map((decision) => decision.id),
  ).toEqual(result.selectedIds);

  const selectedMinutes = result.selectedIds.reduce(
    (total, id) => total + (itemById.get(id)?.estimatedMinutes ?? 0),
    0,
  );
  const selectedBenefit = result.selectedIds.reduce((total, id) => {
    const item = itemById.get(id);
    return total + (item ? benefitOf(item) : 0);
  }, 0);

  expect(result.totalMinutes).toBe(selectedMinutes);
  expect(result.totalBenefit).toBe(selectedBenefit);

  for (const decision of result.decisions) {
    expect(decision.message).toBe(describeReason(decision.reason));
    expect(decision.selected).toBe(result.selectedIds.includes(decision.id));

    if (decision.selected) {
      expect(decision.reason.code).toBe('selected-in-route');
    } else {
      expect(decision.reason.code).not.toBe('selected-in-route');
    }
  }
}

for (const coursePackage of sampleCoursePackages) {
  describe(`${coursePackage.course.title} 示例课程集成`, () => {
    const items = coursePackage.points.map(toItem);
    const budget = coursePackage.course.reviewWindowMinutes;
    const schedulableItems = items.filter((item) => benefitOf(item) > 0);

    it('预算为 0 时放弃全部节点', () => {
      const result = planReviewRoute(items, 0);

      expect(result.selectedIds).toEqual([]);
      expect(result.skippedIds).toEqual(items.map((item) => item.id));
      expect(result.totalBenefit).toBe(0);
      expect(result.totalMinutes).toBe(0);
    });

    it('预算低于最小时用时放弃全部节点', () => {
      const minMinutes = Math.min(
        ...items.map((item) => item.estimatedMinutes ?? Infinity),
      );
      const result = planReviewRoute(items, minMinutes - 1);

      expect(result.selectedIds).toEqual([]);
      expect(result.totalMinutes).toBe(0);
    });

    it('预算充足时选中全部可参与节点', () => {
      const result = planReviewRoute(items, 10_000);

      expect(result.selectedIds).toEqual(
        schedulableItems.map((item) => item.id),
      );
      expect(result.skippedIds).toEqual(
        items
          .filter((item) => benefitOf(item) <= 0)
          .map((item) => item.id),
      );
      expect(result.totalMinutes).toBe(
        schedulableItems.reduce(
          (total, item) => total + (item.estimatedMinutes ?? 0),
          0,
        ),
      );
      expect(result.totalBenefit).toBe(
        schedulableItems.reduce((total, item) => total + benefitOf(item), 0),
      );
    });

    it('课程时间预算下容量、收益与理由自洽', () => {
      const result = planReviewRoute(items, budget);

      expectBudgetInvariants(items, budget, result);
      expect(
        result.decisions.every(
          (decision) =>
            decision.reason.code !== 'skipped-pending-parameters' &&
            decision.reason.code !== 'skipped-invalid-parameters',
        ),
      ).toBe(true);
    });

    it('各档预算均可复现且不超容量', () => {
      for (const testBudget of [0, 15, 30, 75, budget, 10_000]) {
        const result = planReviewRoute(items, testBudget);
        expectBudgetInvariants(items, testBudget, result);
        expect(planReviewRoute(items, testBudget)).toEqual(result);
      }
    });

    it('选中组合总收益与暴力枚举最优解一致', () => {
      for (const testBudget of [15, 30, 75, budget]) {
        const result = planReviewRoute(items, testBudget);
        expect(result.totalBenefit).toBe(
          bruteForceBestBenefit(items, testBudget),
        );
      }
    });

    it('待复习节点作为复习池时，选中与放弃均不出池', () => {
      const pendingItems = coursePackage.points
        .filter((point) => !point.reviewed)
        .map(toItem);
      const pendingIds = new Set(pendingItems.map((item) => item.id));
      const result = planReviewRoute(pendingItems, budget);

      expect(pendingItems.length).toBeGreaterThan(0);
      expectBudgetInvariants(pendingItems, budget, result);

      for (const id of [...result.selectedIds, ...result.skippedIds]) {
        expect(pendingIds.has(id)).toBe(true);
      }
    });
  });
}
