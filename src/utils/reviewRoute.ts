import type { KnapsackItem, KnapsackResult } from '../algorithms/knapsack';
import type { KnowledgePoint, ReviewRouteState } from '../types/knowledge';

export function createReviewRouteItems(points: KnowledgePoint[]): KnapsackItem[] {
  return points
    .filter((point) => !point.reviewed)
    .map((point) => ({
      id: point.id,
      scoreShare: point.scoreShare,
      mastery: point.mastery,
      estimatedMinutes: point.estimatedMinutes,
    }));
}

export function createRouteStateMap(
  result: KnapsackResult,
): Map<string, ReviewRouteState> {
  const routeStates = new Map<string, ReviewRouteState>();

  result.decisions.forEach((decision) => {
    if (decision.selected) {
      routeStates.set(decision.id, 'selected');
      return;
    }

    // 待设置/非法参数尚未形成取舍结论，保持中性，不标记为放弃。
    if (
      decision.reason.code === 'skipped-pending-parameters' ||
      decision.reason.code === 'skipped-invalid-parameters'
    ) {
      return;
    }

    routeStates.set(decision.id, 'skipped');
  });

  return routeStates;
}
