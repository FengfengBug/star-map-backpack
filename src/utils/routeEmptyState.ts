import type { KnapsackDecision } from '../algorithms/knapsack';

export type RouteEmptyStateKind =
  | 'no-nodes'
  | 'zero-budget'
  | 'pending-parameters'
  | 'insufficient-budget'
  | 'no-mastery-gap'
  | 'all-reviewed'
  | 'no-solution';

export interface RouteEmptyState {
  kind: RouteEmptyStateKind;
  pendingCount: number;
  invalidCount: number;
  firstPendingNodeId: string | null;
  shortestNodeId: string | null;
  minRequiredMinutes: number | null;
  firstZeroGapNodeId: string | null;
}

interface RouteEmptyStateInput {
  nodeCount: number;
  budgetMinutes: number;
  decisions: KnapsackDecision[];
}

export function isPendingDecision(decision: KnapsackDecision) {
  return (
    decision.reason.code === 'skipped-pending-parameters' ||
    decision.reason.code === 'skipped-invalid-parameters'
  );
}

export function getRouteEmptyState({
  nodeCount,
  budgetMinutes,
  decisions,
}: RouteEmptyStateInput): RouteEmptyState | null {
  if (nodeCount === 0) {
    return {
      kind: 'no-nodes',
      pendingCount: 0,
      invalidCount: 0,
      firstPendingNodeId: null,
      shortestNodeId: null,
      minRequiredMinutes: null,
      firstZeroGapNodeId: null,
    };
  }

  if (decisions.length === 0) {
    return {
      kind: 'all-reviewed',
      pendingCount: 0,
      invalidCount: 0,
      firstPendingNodeId: null,
      shortestNodeId: null,
      minRequiredMinutes: null,
      firstZeroGapNodeId: null,
    };
  }

  const pendingDecisions = decisions.filter(isPendingDecision);
  const invalidCount = pendingDecisions.filter(
    (decision) => decision.reason.code === 'skipped-invalid-parameters',
  ).length;
  const beneficialDecisions = decisions.filter(
    (decision) => !isPendingDecision(decision) && (decision.benefit ?? 0) > 0,
  );
  const shortestDecision = beneficialDecisions.reduce<KnapsackDecision | null>(
    (shortest, decision) => {
      const minutes = decision.reason.params.estimatedMinutes ?? Infinity;
      const shortestMinutes =
        shortest?.reason.params.estimatedMinutes ?? Infinity;
      return minutes < shortestMinutes ? decision : shortest;
    },
    null,
  );
  const zeroGapDecision = decisions.find(
    (decision) => !isPendingDecision(decision) && decision.benefit === 0,
  );

  const base = {
    pendingCount: pendingDecisions.length,
    invalidCount,
    firstPendingNodeId: pendingDecisions[0]?.id ?? null,
    shortestNodeId: shortestDecision?.id ?? null,
    minRequiredMinutes:
      shortestDecision?.reason.params.estimatedMinutes ?? null,
    firstZeroGapNodeId: zeroGapDecision?.id ?? null,
  };

  if (budgetMinutes === 0) return { kind: 'zero-budget', ...base };

  if (pendingDecisions.length === decisions.length) {
    return { kind: 'pending-parameters', ...base };
  }

  if (decisions.some((decision) => decision.selected)) return null;

  if (beneficialDecisions.length === 0) {
    return pendingDecisions.length > 0
      ? { kind: 'pending-parameters', ...base }
      : { kind: 'no-mastery-gap', ...base };
  }

  if ((base.minRequiredMinutes ?? 0) > budgetMinutes) {
    return { kind: 'insufficient-budget', ...base };
  }

  return { kind: 'no-solution', ...base };
}
