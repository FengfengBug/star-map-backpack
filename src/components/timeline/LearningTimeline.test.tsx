import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { KnowledgePoint } from '../../types/knowledge';
import {
  createPlanChangeLearningRecord,
  createPlanUndoLearningRecord,
  createReviewLearningRecord,
} from '../../utils/learningRecord';
import { planReviewRoute } from '../../algorithms/knapsack';
import { createPlanChange } from '../../utils/planChange';
import { createReviewRouteItems } from '../../utils/reviewRoute';
import { LearningTimeline } from './LearningTimeline';
import { formatLocalTime, groupLearningRecords } from './timelineUtils';

const noop = () => {};
const point: KnowledgePoint = {
  id: 'binary-tree',
  title: '二叉树',
  content: '敏感笔记全文',
  parentId: null,
  scoreShare: 10,
  mastery: 50,
  estimatedMinutes: 10,
  reviewed: false,
  position: { x: 0, y: 0 },
  chapterId: 'trees',
  tone: 'blue',
  relatedIds: [],
};

function createRouteChange() {
  const nextPoint = { ...point, mastery: 90 };
  const addedPoint = {
    ...point,
    id: 'avl-tree',
    title: '平衡二叉树',
    scoreShare: 9,
  };
  const change = createPlanChange({
    cause: {
      kind: 'mastery',
      nodeId: point.id,
      title: point.title,
      previousMastery: 50,
      nextMastery: 90,
    },
    previousPlan: planReviewRoute(createReviewRouteItems([point, addedPoint]), 10),
    nextPlan: planReviewRoute(createReviewRouteItems([nextPoint, addedPoint]), 10),
    points: [nextPoint, addedPoint],
  });
  if (!change) throw new Error('Expected a route membership change');
  return change;
}

describe('LearningTimeline', () => {
  it('展示真实复习、重排与撤销摘要及隐私边界', () => {
    const change = createRouteChange();
    const records = [
      createReviewLearningRecord(point, true, new Date(2026, 10, 17, 16, 42).getTime()),
      createPlanChangeLearningRecord(change, new Date(2026, 10, 17, 16, 35).getTime()),
      createPlanUndoLearningRecord(change, new Date(2026, 10, 17, 16, 31).getTime()),
    ];
    const html = renderToStaticMarkup(
      <LearningTimeline
        records={records}
        storageIssue={null}
        onClose={noop}
        onClear={noop}
      />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="学习记录筛选"');
    expect(html).toContain('标记为已复习');
    expect(html).toContain('航线已重新规划');
    expect(html).toContain('恢复上一版航线');
    expect(html).toContain('移出 二叉树');
    expect(html).toContain('加入 平衡二叉树');
    expect(html).toContain('掌握度 50% → 90%');
    expect(html).toContain('16:42');
    expect(html).toContain('不保存敏感笔记全文');
    expect(html).toContain('清空记录');
    expect(html).not.toContain('>敏感笔记全文<');
  });

  it('空状态说明真实记录来源，并展示存储降级信息', () => {
    const html = renderToStaticMarkup(
      <LearningTimeline
        records={[]}
        storageIssue="学习记录写入失败，新记录仅保留在本次会话"
        onClose={noop}
        onClear={noop}
      />,
    );

    expect(html).toContain('还没有学习记录');
    expect(html).toContain('标记已复习、撤销标记或触发航线重排后');
    expect(html).toContain('学习记录写入失败');
    expect(html).toContain('disabled=""');
  });

  it('按本地日期分组、标记今天和昨天，并在组内倒序排列', () => {
    const now = new Date(2026, 10, 18, 12, 0).getTime();
    const first = createReviewLearningRecord(
      point,
      true,
      new Date(2026, 10, 17, 9, 5).getTime(),
    );
    const second = createReviewLearningRecord(
      point,
      false,
      new Date(2026, 10, 17, 16, 42).getTime(),
    );
    const third = createReviewLearningRecord(
      point,
      true,
      new Date(2026, 10, 18, 8, 30).getTime(),
    );

    const groups = groupLearningRecords([first, second, third], now);

    expect(groups.map((group) => group.label)).toEqual(['今天', '昨天']);
    expect(groups[0].records.map((record) => record.id)).toEqual([third.id]);
    expect(groups[1].records.map((record) => record.id)).toEqual([second.id, first.id]);
    expect(groups[1].dateLabel).toBe('2026.11.17');
    expect(formatLocalTime(first.occurredAt)).toBe('09:05');
  });
});
