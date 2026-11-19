import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { planReviewRoute } from '../../algorithms/knapsack';
import { sampleKnowledgePoints } from '../../data/sampleCourse';
import type { KnowledgeFlowNode, KnowledgePoint } from '../../types/knowledge';
import { createReviewRouteItems } from '../../utils/reviewRoute';
import { ShareCard } from './ShareCard';
import {
  createShareCardFileName,
  createShareCardModel,
  truncateShareText,
} from './shareCardModel';

function createNodes(points: KnowledgePoint[]): KnowledgeFlowNode[] {
  return points.map((point) => ({
    id: point.id,
    type: 'knowledge',
    position: point.position,
    data: { ...point, routeState: null },
  }));
}

function createModel(points: KnowledgePoint[], budgetMinutes: number) {
  const plan = planReviewRoute(createReviewRouteItems(points), budgetMinutes);
  return createShareCardModel({
    courseTitle: '数据结构与算法',
    isSampleData: true,
    nodes: createNodes(points),
    decisions: plan.decisions,
    routeSelectedIds: plan.selectedIds,
    budgetMinutes,
    totalBenefit: plan.totalBenefit,
  });
}

describe('ShareCard', () => {
  it('复用真实示例航线，展示顺序、收益、取舍摘要与隐私边界', () => {
    const points = sampleKnowledgePoints.map((point, index) =>
      index === 0 ? { ...point, content: '敏感笔记全文，不应进入分享卡' } : point,
    );
    const model = createModel(points, 150);
    const html = renderToStaticMarkup(
      <ShareCard model={model} generatedAt={new Date(2026, 10, 18, 12).getTime()} />,
    );

    expect(model.selected.map((node) => node.title)).toEqual([
      '链表',
      '二叉树',
      '平衡二叉树',
      '图结构',
      '动态规划',
    ]);
    expect(model.skipped.map((node) => node.title)).toEqual(['哈希表', '最短路径']);
    expect(model.totalMinutes).toBe(150);
    expect(model.totalBenefit).toBe(2652);
    expect(html).toContain('width="1080"');
    expect(html).toContain('height="1350"');
    expect(html).toContain('示例数据，参数可编辑');
    expect(html).toContain('预计 150 min · 总收益 2652');
    expect(html).toContain('未进入当前最高收益组合');
    expect(html).toContain('本机参数生成 · 不含笔记全文');
    expect(html).toContain('2026.11.18');
    expect(html).not.toContain('敏感笔记全文');
    expect(html).not.toContain('<foreignObject');
  });

  it('长航线聚合额外节点，待处理参数不计入放弃理由', () => {
    const points: KnowledgePoint[] = Array.from({ length: 9 }, (_, index) => ({
      id: `point-${index + 1}`,
      title: `知识点 ${index + 1}`,
      content: `正文 ${index + 1}`,
      parentId: null,
      scoreShare: 10,
      mastery: 0,
      estimatedMinutes: 10,
      reviewed: false,
      position: { x: index * 100, y: 0 },
      chapterId: 'chapter',
      tone: 'blue',
      relatedIds: [],
    }));
    points.push({
      ...points[0],
      id: 'pending-point',
      title: '待设置知识点',
      scoreShare: null,
      mastery: null,
      estimatedMinutes: null,
    });

    const model = createModel(points, 60);
    const html = renderToStaticMarkup(
      <ShareCard model={model} generatedAt={new Date(2026, 10, 18).getTime()} />,
    );

    expect(model.selected).toHaveLength(6);
    expect(model.skipped).toHaveLength(3);
    expect(model.pendingCount).toBe(1);
    expect(model.skipped.some((node) => node.id === 'pending-point')).toBe(false);
    expect(html).toContain('另有 1 个选中节点');
    expect(html).toContain('另有 1 个未纳入节点 · 1 个参数待处理');
    expect(html).not.toContain('正文 1');
  });

  it('生成本地日期和安全文件名，并截断超长标题', () => {
    const timestamp = new Date(2026, 10, 18, 8, 30).getTime();

    expect(createShareCardFileName('数据结构/期末:复习', timestamp)).toBe(
      '星图背包-数据结构-期末-复习-2026-11-18.png',
    );
    expect(truncateShareText('  这是一个明显超过展示上限的知识点标题  ', 10)).toBe(
      '这是一个明显超过展…',
    );
  });
});
