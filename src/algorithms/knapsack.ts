/**
 * 0-1 背包复习规划：容量为分钟预算，单节点用时为重量，
 * 收益 = 分值占比 × (100 − 自评掌握度)。掌握度越高，剩余提升空间越小。
 * 参数待设置或非法的节点不参与选择，统一计入 skippedIds。
 */

export interface KnapsackItem {
  id: string;
  scoreShare: number | null;
  mastery: number | null;
  estimatedMinutes: number | null;
}

export interface KnapsackResult {
  selectedIds: string[];
  skippedIds: string[];
  totalBenefit: number;
  totalMinutes: number;
}

interface Candidate {
  id: string;
  weight: number;
  benefit: number;
  valid: boolean;
}

function toCandidate(item: KnapsackItem): Candidate {
  const { scoreShare, mastery, estimatedMinutes } = item;
  const valid =
    scoreShare !== null &&
    mastery !== null &&
    estimatedMinutes !== null &&
    Number.isFinite(scoreShare) &&
    Number.isFinite(mastery) &&
    Number.isFinite(estimatedMinutes) &&
    scoreShare > 0 &&
    mastery >= 0 &&
    mastery <= 100 &&
    Number.isInteger(estimatedMinutes) &&
    estimatedMinutes > 0;

  return {
    id: item.id,
    weight: valid ? (estimatedMinutes as number) : 0,
    benefit: valid ? (scoreShare as number) * (100 - (mastery as number)) : 0,
    valid,
  };
}

export function planReviewRoute(
  items: KnapsackItem[],
  budgetMinutes: number,
): KnapsackResult {
  const capacity = Number.isFinite(budgetMinutes)
    ? Math.max(0, Math.floor(budgetMinutes))
    : 0;
  const candidates = items.map(toCandidate);
  const count = candidates.length;

  const dp: number[][] = Array.from({ length: count + 1 }, () =>
    new Array<number>(capacity + 1).fill(0),
  );

  for (let index = 1; index <= count; index += 1) {
    const candidate = candidates[index - 1];

    for (let remaining = 0; remaining <= capacity; remaining += 1) {
      const skipped = dp[index - 1][remaining];
      if (!candidate.valid || candidate.weight > remaining) {
        dp[index][remaining] = skipped;
        continue;
      }

      const taken =
        dp[index - 1][remaining - candidate.weight] + candidate.benefit;
      dp[index][remaining] = Math.max(skipped, taken);
    }
  }

  const selectedIds: string[] = [];
  let remaining = capacity;

  for (let index = count; index >= 1; index -= 1) {
    const candidate = candidates[index - 1];
    if (!candidate.valid || candidate.weight > remaining) continue;
    // 收益并列时跳过靠后的节点，优先保留输入顺序靠前的选择。
    if (dp[index][remaining] === dp[index - 1][remaining]) continue;

    selectedIds.push(candidate.id);
    remaining -= candidate.weight;
  }

  selectedIds.reverse();

  const selectedSet = new Set(selectedIds);
  const skippedIds = items
    .map((item) => item.id)
    .filter((id) => !selectedSet.has(id));

  const totalBenefit = selectedIds.reduce((total, id) => {
    const candidate = candidates.find((entry) => entry.id === id);
    return total + (candidate?.benefit ?? 0);
  }, 0);
  const totalMinutes = selectedIds.reduce((total, id) => {
    const candidate = candidates.find((entry) => entry.id === id);
    return total + (candidate?.weight ?? 0);
  }, 0);

  return { selectedIds, skippedIds, totalBenefit, totalMinutes };
}
