import type { KnapsackResult } from '../algorithms/knapsack';
import type { KnowledgePoint } from '../types/knowledge';
import { createReviewRouteItems } from './reviewRoute';

export interface PlanChangeCause {
  kind: 'mastery' | 'reviewed' | 'parameters';
  nodeId: string;
  title: string;
  previousMastery?: number | null;
  nextMastery?: number | null;
  reviewed?: boolean;
}

export interface PlanChangeNode {
  id: string;
  title: string;
  estimatedMinutes: number | null;
  benefit: number | null;
}

export interface PlanChange {
  cause: PlanChangeCause;
  previousPlan: KnapsackResult;
  nextPlan: KnapsackResult;
  removed: PlanChangeNode[];
  added: PlanChangeNode[];
}

interface CreatePlanChangeInput {
  cause: PlanChangeCause;
  previousPlan: KnapsackResult;
  nextPlan: KnapsackResult;
  points: KnowledgePoint[];
}

export function describePlanChangeCause(cause: PlanChangeCause) {
  if (cause.kind === 'reviewed') {
    return cause.reviewed
      ? `「${cause.title}」标记为已复习，已退出复习池`
      : `「${cause.title}」撤销已复习标记，重新参与规划`;
  }

  if (cause.kind === 'parameters') {
    return `「${cause.title}」复习参数更新，收益与用时已重算`;
  }

  if (cause.previousMastery === null || cause.nextMastery === null) {
    return `「${cause.title}」掌握度已设置，复习收益已更新`;
  }

  const masteryDirection =
    (cause.nextMastery ?? 0) > (cause.previousMastery ?? 0) ? '提升' : '降低';
  const benefitDirection = masteryDirection === '提升' ? '下降' : '上升';
  return `「${cause.title}」掌握度${masteryDirection}，收益${benefitDirection}`;
}

export function getRoutePlanKey(points: KnowledgePoint[], budgetMinutes: number) {
  return JSON.stringify({
    budgetMinutes,
    items: createReviewRouteItems(points),
  });
}

export function createPlanChange({
  cause,
  previousPlan,
  nextPlan,
  points,
}: CreatePlanChangeInput): PlanChange | null {
  const previousSelected = new Set(previousPlan.selectedIds);
  const nextSelected = new Set(nextPlan.selectedIds);
  const removedIds = previousPlan.selectedIds.filter((id) => !nextSelected.has(id));
  const addedIds = nextPlan.selectedIds.filter((id) => !previousSelected.has(id));

  if (removedIds.length === 0 && addedIds.length === 0) return null;

  const titleById = new Map(points.map((point) => [point.id, point.title]));
  const toChangeNode = (plan: KnapsackResult, id: string): PlanChangeNode => {
    const decision = plan.decisions.find((candidate) => candidate.id === id);

    return {
      id,
      title: titleById.get(id) ?? '该知识点',
      estimatedMinutes: decision?.reason.params.estimatedMinutes ?? null,
      benefit: decision?.benefit ?? null,
    };
  };

  return {
    cause,
    previousPlan,
    nextPlan,
    removed: removedIds.map((id) => {
      const hasCurrentDecision = nextPlan.decisions.some(
        (decision) => decision.id === id,
      );
      return toChangeNode(hasCurrentDecision ? nextPlan : previousPlan, id);
    }),
    added: addedIds.map((id) => toChangeNode(nextPlan, id)),
  };
}
