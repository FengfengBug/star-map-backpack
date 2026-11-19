import type { KnapsackDecision, KnapsackReasonCode } from '../../algorithms/knapsack';
import type { KnowledgeFlowNode, StarTone } from '../../types/knowledge';

export interface ShareCardNode {
  id: string;
  title: string;
  tone: StarTone;
  minutes: number;
  benefit: number;
}

export interface ShareCardSkippedNode extends ShareCardNode {
  reason: string;
}

export interface ShareCardModel {
  courseTitle: string;
  sourceLabel: string;
  budgetMinutes: number;
  selected: ShareCardNode[];
  skipped: ShareCardSkippedNode[];
  pendingCount: number;
  totalMinutes: number;
  totalBenefit: number;
}

interface CreateShareCardModelInput {
  courseTitle: string;
  isSampleData: boolean;
  nodes: KnowledgeFlowNode[];
  decisions: KnapsackDecision[];
  routeSelectedIds: string[];
  budgetMinutes: number;
  totalBenefit: number;
}

const SKIPPED_REASON_CODES = new Set<KnapsackReasonCode>([
  'skipped-over-budget',
  'skipped-no-mastery-gap',
  'skipped-not-in-route',
]);

export function describeSkippedReason(decision: KnapsackDecision) {
  if (decision.reason.code === 'skipped-over-budget') {
    return `预计 ${decision.reason.params.estimatedMinutes} 分钟，超过本轮预算`;
  }
  if (decision.reason.code === 'skipped-no-mastery-gap') {
    return '掌握度缺口为 0，本轮不占用预算';
  }
  return '未进入当前最高收益组合';
}

export function createShareCardModel({
  courseTitle,
  isSampleData,
  nodes,
  decisions,
  routeSelectedIds,
  budgetMinutes,
  totalBenefit,
}: CreateShareCardModelInput): ShareCardModel {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const decisionById = new Map(decisions.map((decision) => [decision.id, decision]));

  const selected = routeSelectedIds.flatMap((id): ShareCardNode[] => {
    const node = nodeById.get(id);
    const decision = decisionById.get(id);
    const minutes = decision?.reason.params.estimatedMinutes;
    if (!node || !decision || minutes === null || minutes === undefined) return [];

    return [{
      id,
      title: node.data.title,
      tone: node.data.tone,
      minutes,
      benefit: decision.benefit ?? decision.reason.params.benefit ?? 0,
    }];
  });

  const skipped = decisions.flatMap((decision): ShareCardSkippedNode[] => {
    const node = nodeById.get(decision.id);
    const minutes = decision.reason.params.estimatedMinutes;
    if (
      decision.selected ||
      !SKIPPED_REASON_CODES.has(decision.reason.code) ||
      !node ||
      minutes === null ||
      minutes === undefined
    ) {
      return [];
    }

    return [{
      id: decision.id,
      title: node.data.title,
      tone: node.data.tone,
      minutes,
      benefit: decision.benefit ?? decision.reason.params.benefit ?? 0,
      reason: describeSkippedReason(decision),
    }];
  });

  return {
    courseTitle,
    sourceLabel: isSampleData ? '示例数据，参数可编辑' : '本机数据，参数可编辑',
    budgetMinutes,
    selected,
    skipped,
    pendingCount: decisions.filter(
      (decision) =>
        decision.reason.code === 'skipped-pending-parameters' ||
        decision.reason.code === 'skipped-invalid-parameters',
    ).length,
    totalMinutes: selected.reduce((total, node) => total + node.minutes, 0),
    totalBenefit,
  };
}

export function truncateShareText(value: string, maxCharacters: number) {
  const characters = Array.from(value.trim());
  if (characters.length <= maxCharacters) return characters.join('');
  return `${characters.slice(0, Math.max(1, maxCharacters - 1)).join('')}…`;
}

export function formatShareCardDate(timestamp: number) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}.${month}.${day}`;
}

export function createShareCardFileName(courseTitle: string, timestamp: number) {
  const date = formatShareCardDate(timestamp).replaceAll('.', '-');
  const safeTitle = courseTitle
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `星图背包-${safeTitle || '复习航线'}-${date}.png`;
}
