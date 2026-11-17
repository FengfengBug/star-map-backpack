import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { planReviewRoute } from '../algorithms/knapsack';
import type { KnowledgePoint } from '../types/knowledge';
import { createPlanChange, type PlanChangeCause } from '../utils/planChange';
import { createReviewRouteItems } from '../utils/reviewRoute';
import { PlanChangeNotice } from './PlanChangeNotice';

const noop = () => {};

function createPoint(
  overrides: Partial<KnowledgePoint> & Pick<KnowledgePoint, 'id' | 'title'>,
): KnowledgePoint {
  return {
    content: '',
    parentId: null,
    scoreShare: 10,
    mastery: 50,
    estimatedMinutes: 10,
    reviewed: false,
    position: { x: 0, y: 0 },
    chapterId: 'chapter-1',
    tone: 'blue',
    relatedIds: [],
    ...overrides,
  };
}

function renderNotice(cause?: PlanChangeCause) {
  const previousPoints = [
    createPoint({ id: 'a', title: '二叉树', scoreShare: 10 }),
    createPoint({ id: 'b', title: '平衡二叉树', scoreShare: 9 }),
  ];
  const nextPoints = previousPoints.map((point) =>
    point.id === 'a'
      ? {
          ...point,
          mastery: cause?.kind === 'reviewed' ? point.mastery : 90,
          reviewed: cause?.kind === 'reviewed',
        }
      : point,
  );
  const plan = (points: KnowledgePoint[]) =>
    planReviewRoute(createReviewRouteItems(points), 10);
  const change = createPlanChange({
    cause: cause ?? {
      kind: 'mastery',
      nodeId: 'a',
      title: '二叉树',
      previousMastery: 50,
      nextMastery: 90,
    },
    previousPlan: plan(previousPoints),
    nextPlan: plan(nextPoints),
    points: nextPoints,
  });

  if (!change) throw new Error('Expected a route membership change');

  return renderToStaticMarkup(
    <PlanChangeNotice change={change} onUndo={noop} onDismiss={noop} />,
  );
}

describe('PlanChangeNotice', () => {
  it('说明掌握度原因、节点取舍和撤销边界，并提供读屏状态', () => {
    const html = renderNotice();

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('航线已重新规划');
    expect(html).toContain('「二叉树」掌握度提升，收益下降');
    expect(html).toContain('掌握度从 50% 调整为 90%');
    expect(html).toContain('移出预算');
    expect(html).toContain('加入航线');
    expect(html).toContain('平衡二叉树');
    expect(html).toContain('收益 100');
    expect(html).toContain('收益 450');
    expect(html).toContain('原节点仍保留在星图中');
    expect(html).toContain('不会回退掌握度');
    expect(html).toContain('撤销本次重排');
    expect(html).toContain('知道了');
  });

  it('复习状态变化时说明退出复习池且撤销不回退状态', () => {
    const html = renderNotice({
      kind: 'reviewed',
      nodeId: 'a',
      title: '二叉树',
      reviewed: true,
    });

    expect(html).toContain('「二叉树」标记为已复习，已退出复习池');
    expect(html).toContain('不会回退复习状态');
    expect(html).not.toContain('掌握度从');
  });
});
