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

export type KnapsackParameterField =
  | 'scoreShare'
  | 'estimatedMinutes'
  | 'mastery';

export type KnapsackReasonCode =
  | 'selected-in-route'
  | 'skipped-over-budget'
  | 'skipped-no-mastery-gap'
  | 'skipped-pending-parameters'
  | 'skipped-invalid-parameters'
  | 'skipped-not-in-route';

export interface KnapsackReasonParams {
  budgetMinutes: number;
  scoreShare: number | null;
  mastery: number | null;
  estimatedMinutes: number | null;
  masteryGap?: number;
  benefit?: number;
  totalBenefit?: number;
  pendingFields?: KnapsackParameterField[];
  invalidFields?: KnapsackParameterField[];
}

export interface KnapsackReason {
  code: KnapsackReasonCode;
  params: KnapsackReasonParams;
}

export interface KnapsackDecision {
  id: string;
  selected: boolean;
  benefit: number | null;
  reason: KnapsackReason;
  message: string;
}

export interface KnapsackResult {
  selectedIds: string[];
  skippedIds: string[];
  totalBenefit: number;
  totalMinutes: number;
  decisions: KnapsackDecision[];
}

interface Candidate {
  id: string;
  weight: number;
  benefit: number;
  pendingFields: KnapsackParameterField[];
  invalidFields: KnapsackParameterField[];
}

const FIELD_LABELS: Record<KnapsackParameterField, string> = {
  scoreShare: '分值占比',
  estimatedMinutes: '预计用时',
  mastery: '掌握度',
};

function evaluateFields(item: KnapsackItem): {
  pendingFields: KnapsackParameterField[];
  invalidFields: KnapsackParameterField[];
} {
  const pendingFields: KnapsackParameterField[] = [];
  const invalidFields: KnapsackParameterField[] = [];

  if (item.scoreShare === null) {
    pendingFields.push('scoreShare');
  } else if (!Number.isFinite(item.scoreShare) || item.scoreShare <= 0) {
    invalidFields.push('scoreShare');
  }

  if (item.estimatedMinutes === null) {
    pendingFields.push('estimatedMinutes');
  } else if (
    !Number.isFinite(item.estimatedMinutes) ||
    !Number.isInteger(item.estimatedMinutes) ||
    item.estimatedMinutes <= 0
  ) {
    invalidFields.push('estimatedMinutes');
  }

  if (item.mastery === null) {
    pendingFields.push('mastery');
  } else if (
    !Number.isFinite(item.mastery) ||
    item.mastery < 0 ||
    item.mastery > 100
  ) {
    invalidFields.push('mastery');
  }

  return { pendingFields, invalidFields };
}

function toCandidate(item: KnapsackItem): Candidate {
  const { pendingFields, invalidFields } = evaluateFields(item);
  const valid = pendingFields.length === 0 && invalidFields.length === 0;

  return {
    id: item.id,
    weight: valid ? (item.estimatedMinutes as number) : 0,
    benefit: valid
      ? (item.scoreShare as number) * (100 - (item.mastery as number))
      : 0,
    pendingFields,
    invalidFields,
  };
}

function describePendingFields(fields: KnapsackParameterField[]): string {
  return fields.map((field) => FIELD_LABELS[field]).join('、');
}

function describeInvalidField(
  field: KnapsackParameterField,
  params: KnapsackReasonParams,
): string {
  switch (field) {
    case 'scoreShare':
      return `分值占比需大于 0（当前 ${params.scoreShare}）`;
    case 'estimatedMinutes':
      return `预计用时应为正整数（当前 ${params.estimatedMinutes}）`;
    case 'mastery':
      return `掌握度需在 0–100 之间（当前 ${params.mastery}）`;
  }
}

export function describeReason(reason: KnapsackReason): string {
  const { params } = reason;

  switch (reason.code) {
    case 'selected-in-route':
      return `分值占比 ${params.scoreShare}% × 掌握度缺口 ${params.masteryGap}% = 收益 ${params.benefit}；预计用时 ${params.estimatedMinutes} 分钟，在 ${params.budgetMinutes} 分钟预算内纳入航线。`;
    case 'skipped-over-budget':
      return `预计用时 ${params.estimatedMinutes} 分钟，超过 ${params.budgetMinutes} 分钟预算，无法纳入。`;
    case 'skipped-no-mastery-gap':
      return `掌握度 ${params.mastery}%，掌握度缺口为 0，收益为 0，不占用预算。`;
    case 'skipped-pending-parameters': {
      const pendingText = `${describePendingFields(params.pendingFields ?? [])}待设置，暂不参与选择。`;
      const invalidText =
        params.invalidFields && params.invalidFields.length > 0
          ? `另有非法参数：${params.invalidFields
              .map((field) => describeInvalidField(field, params))
              .join('；')}。`
          : '';
      return pendingText + invalidText;
    }
    case 'skipped-invalid-parameters':
      return `${(params.invalidFields ?? [])
        .map((field) => describeInvalidField(field, params))
        .join('；')}。`;
    case 'skipped-not-in-route':
      return `收益 ${params.benefit}（分值 ${params.scoreShare}% × 掌握度缺口 ${params.masteryGap}%），预计用时 ${params.estimatedMinutes} 分钟；在 ${params.budgetMinutes} 分钟预算内，选中组合总收益 ${params.totalBenefit}，未纳入航线。`;
  }
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
    const valid = candidate.pendingFields.length === 0 && candidate.invalidFields.length === 0;

    for (let remaining = 0; remaining <= capacity; remaining += 1) {
      const skipped = dp[index - 1][remaining];
      if (!valid || candidate.weight > remaining) {
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
    const valid = candidate.pendingFields.length === 0 && candidate.invalidFields.length === 0;
    if (!valid || candidate.weight > remaining) continue;
    // 收益并列时跳过靠后的节点，优先保留输入顺序靠前的选择。
    if (dp[index][remaining] === dp[index - 1][remaining]) continue;

    selectedIds.push(candidate.id);
    remaining -= candidate.weight;
  }

  selectedIds.reverse();

  const candidateById = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  const selectedSet = new Set(selectedIds);
  const skippedIds = items
    .map((item) => item.id)
    .filter((id) => !selectedSet.has(id));

  const totalBenefit = selectedIds.reduce(
    (total, id) => total + (candidateById.get(id)?.benefit ?? 0),
    0,
  );
  const totalMinutes = selectedIds.reduce(
    (total, id) => total + (candidateById.get(id)?.weight ?? 0),
    0,
  );

  const decisions: KnapsackDecision[] = items.map((item, index) => {
    const candidate = candidates[index];
    const selected = selectedSet.has(item.id);
    const params: KnapsackReasonParams = {
      budgetMinutes: capacity,
      scoreShare: item.scoreShare,
      mastery: item.mastery,
      estimatedMinutes: item.estimatedMinutes,
    };

    let reason: KnapsackReason;

    if (candidate.pendingFields.length > 0) {
      reason = {
        code: 'skipped-pending-parameters',
        params: {
          ...params,
          pendingFields: candidate.pendingFields,
          invalidFields: candidate.invalidFields,
        },
      };
    } else if (candidate.invalidFields.length > 0) {
      reason = {
        code: 'skipped-invalid-parameters',
        params: { ...params, invalidFields: candidate.invalidFields },
      };
    } else {
      const masteryGap = 100 - (item.mastery as number);
      const benefit = candidate.benefit;

      if (selected) {
        reason = {
          code: 'selected-in-route',
          params: { ...params, masteryGap, benefit },
        };
      } else if (benefit === 0) {
        reason = {
          code: 'skipped-no-mastery-gap',
          params: { ...params, masteryGap, benefit },
        };
      } else if (candidate.weight > capacity) {
        reason = {
          code: 'skipped-over-budget',
          params: { ...params, masteryGap, benefit },
        };
      } else {
        reason = {
          code: 'skipped-not-in-route',
          params: { ...params, masteryGap, benefit, totalBenefit },
        };
      }
    }

    return {
      id: item.id,
      selected,
      benefit: candidate.pendingFields.length === 0 && candidate.invalidFields.length === 0
        ? candidate.benefit
        : null,
      reason,
      message: describeReason(reason),
    };
  });

  return { selectedIds, skippedIds, totalBenefit, totalMinutes, decisions };
}
