import type { LearningRecord } from '../types/learningRecord';
import type { KnowledgePoint } from '../types/knowledge';
import { describePlanChangeCause, type PlanChange } from './planChange';

let recordSequence = 0;

function createRecordId(occurredAt: number) {
  recordSequence += 1;
  return `learning:${occurredAt}:${recordSequence}`;
}

function toRecordNodes(nodes: PlanChange['removed']) {
  return nodes.map(({ id, title }) => ({ id, title }));
}

export function createReviewLearningRecord(
  point: KnowledgePoint,
  reviewed: boolean,
  occurredAt = Date.now(),
): LearningRecord {
  return {
    id: createRecordId(occurredAt),
    occurredAt,
    category: 'review',
    kind: reviewed ? 'reviewed' : 'unreviewed',
    nodeId: point.id,
    nodeTitle: point.title,
    summary: reviewed
      ? '退出本轮复习池，原节点仍保留在星图中。'
      : '重新参与复习规划，原节点仍保留在星图中。',
    details: [],
    removed: [],
    added: [],
    mastery: point.mastery,
    previousMastery: null,
    nextMastery: null,
    previousMinutes: null,
    nextMinutes: null,
  };
}

export function createPlanChangeLearningRecord(
  change: PlanChange,
  occurredAt = Date.now(),
): LearningRecord {
  const { cause, previousPlan, nextPlan } = change;
  const details = [
    change.removed.length > 0
      ? `移出 ${change.removed.map((node) => node.title).join('、')}`
      : '',
    change.added.length > 0
      ? `加入 ${change.added.map((node) => node.title).join('、')}`
      : '',
  ].filter(Boolean);

  return {
    id: createRecordId(occurredAt),
    occurredAt,
    category: 'route',
    kind: 'replanned',
    nodeId: cause.nodeId,
    nodeTitle: cause.title,
    summary: describePlanChangeCause(cause),
    details,
    removed: toRecordNodes(change.removed),
    added: toRecordNodes(change.added),
    mastery: null,
    previousMastery: cause.previousMastery ?? null,
    nextMastery: cause.nextMastery ?? null,
    previousMinutes: previousPlan.totalMinutes,
    nextMinutes: nextPlan.totalMinutes,
  };
}

export function createPlanUndoLearningRecord(
  change: PlanChange,
  occurredAt = Date.now(),
): LearningRecord {
  return {
    id: createRecordId(occurredAt),
    occurredAt,
    category: 'route',
    kind: 'undo',
    nodeId: change.cause.nodeId,
    nodeTitle: change.cause.title,
    summary: '仅恢复航线结果，掌握度、复习状态与节点参数保持当前值。',
    details: [],
    removed: [],
    added: [],
    mastery: null,
    previousMastery: null,
    nextMastery: null,
    previousMinutes: change.nextPlan.totalMinutes,
    nextMinutes: change.previousPlan.totalMinutes,
  };
}
