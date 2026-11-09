import type { KnapsackItem, KnapsackResult } from '../algorithms/knapsack';
import type {
  KnowledgePoint,
  ReviewRouteFlowEdge,
  ReviewRouteState,
} from '../types/knowledge';

export const ROUTE_SEGMENT_DURATION_MS = 520;
const ROUTE_SEGMENT_GAP_MS = 40;

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

export function createReviewRouteEdges(
  selectedIds: string[],
  options: { animated: boolean; animationRun: number },
): ReviewRouteFlowEdge[] {
  return selectedIds.slice(1).map((targetId, index) => {
    const sourceId = selectedIds[index];

    return {
      id: `review-route:${options.animationRun}:${sourceId}:${targetId}`,
      source: sourceId,
      target: targetId,
      type: 'reviewRoute',
      selectable: false,
      focusable: false,
      deletable: false,
      data: {
        animated: options.animated,
        delayMs: index * (ROUTE_SEGMENT_DURATION_MS + ROUTE_SEGMENT_GAP_MS),
      },
    };
  });
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
