import { useCallback, useMemo, useState } from 'react';
import { ChevronDown, Compass, Flag, Play, Route, Sparkles } from 'lucide-react';
import type { KnapsackDecision } from '../algorithms/knapsack';
import type { KnowledgeFlowNode } from '../types/knowledge';
import { formatDuration, formatReviewWindow } from '../utils/star';
import { sumPendingMinutes } from '../utils/knowledgeGraph';
import {
  getRouteEmptyState,
  isPendingDecision,
  type RouteEmptyStateKind,
} from '../utils/routeEmptyState';
import { RouteReasonSheet } from './RouteReasonSheet';
import './ReviewRoute.css';

const MIN_BUDGET_MINUTES = 0;
const MAX_BUDGET_MINUTES = 300;
const BUDGET_STEP_MINUTES = 5;

interface ReviewRouteProps {
  nodes: KnowledgeFlowNode[];
  budgetMinutes: number;
  onBudgetChange: (minutes: number) => void;
  animationEnabled: boolean;
  onAnimationChange: (enabled: boolean) => void;
  onGenerateRoute: () => void;
  routeNodeCount: number;
  decisions: KnapsackDecision[];
  routeSelectedIds: string[];
  totalBenefit: number;
  onLocateNode: (nodeId: string) => void;
  onOpenImport: () => void;
  onLoadSample: () => void;
}

interface EmptyAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateContent {
  status: string;
  title: string;
  description: string;
  primary: EmptyAction | null;
  secondary: EmptyAction | null;
}

const EMPTY_STATUS: Record<RouteEmptyStateKind, string> = {
  'no-nodes': '等待知识点',
  'zero-budget': '预算为 0',
  'pending-parameters': '参数待设置',
  'insufficient-budget': '预算不足',
  'no-mastery-gap': '掌握度已满',
  'all-reviewed': '无待复习',
  'no-solution': '暂无航线',
};

const EMPTY_ACTION_HINT: Record<RouteEmptyStateKind, string> = {
  'no-nodes': '先导入或载入知识点，才能生成航线',
  'zero-budget': '预算为 0，暂无航线可生成',
  'pending-parameters': '补全知识点参数后才能生成航线',
  'insufficient-budget': '提高预算后才能生成航线',
  'no-mastery-gap': '没有可提升的知识点，暂无航线',
  'all-reviewed': '全部知识点已复习，暂无航线',
  'no-solution': '暂无可生成的航线，查看理由了解取舍',
};

function getSuggestedBudget(minutes: number | null) {
  if (minutes === null || minutes > MAX_BUDGET_MINUTES) return null;
  return Math.min(
    MAX_BUDGET_MINUTES,
    Math.ceil(minutes / BUDGET_STEP_MINUTES) * BUDGET_STEP_MINUTES,
  );
}

export function ReviewRoute({
  nodes,
  budgetMinutes,
  onBudgetChange,
  animationEnabled,
  onAnimationChange,
  onGenerateRoute,
  routeNodeCount,
  decisions,
  routeSelectedIds,
  totalBenefit,
  onLocateNode,
  onOpenImport,
  onLoadSample,
}: ReviewRouteProps) {
  const [reasonsOpen, setReasonsOpen] = useState(false);
  const closeReasons = useCallback(() => setReasonsOpen(false), []);
  const pendingNodes = nodes.filter((node) => !node.data.reviewed);
  const pendingMinutes = sumPendingMinutes(nodes);
  const selectedCount = decisions.filter((decision) => decision.selected).length;
  const skippedCount = decisions.filter(
    (decision) => !decision.selected && !isPendingDecision(decision),
  ).length;
  const pendingCount = decisions.filter(isPendingDecision).length;
  const emptyState = getRouteEmptyState({
    nodeCount: nodes.length,
    budgetMinutes,
    decisions,
  });
  const titleById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node.data.title])),
    [nodes],
  );
  const titleFor = useCallback(
    (nodeId: string | null) =>
      nodeId ? (titleById.get(nodeId) ?? '该知识点') : '该知识点',
    [titleById],
  );
  const suggestedBudget = getSuggestedBudget(
    emptyState?.minRequiredMinutes ?? null,
  );
  const pendingNodeTitle = titleFor(emptyState?.firstPendingNodeId ?? null);
  const shortestNodeTitle = titleFor(emptyState?.shortestNodeId ?? null);
  const zeroGapNodeTitle = titleFor(emptyState?.firstZeroGapNodeId ?? null);
  const showReasons = useCallback(() => setReasonsOpen(true), []);

  let emptyContent: EmptyStateContent | null = null;

  if (emptyState) {
    const content: EmptyStateContent = {
      status: EMPTY_STATUS[emptyState.kind],
      title: '',
      description: '',
      primary: null,
      secondary: null,
    };

    switch (emptyState.kind) {
      case 'no-nodes':
        content.title = '还没有可规划的航线';
        content.description =
          '先导入 Markdown / TXT 笔记，或载入一套示例课程，再设置时间预算。';
        content.primary = { label: '导入笔记', onClick: onOpenImport };
        content.secondary = { label: '载入示例', onClick: onLoadSample };
        break;

      case 'zero-budget':
        content.title = '本次没有安排复习时间';
        content.description =
          emptyState.minRequiredMinutes !== null &&
          emptyState.minRequiredMinutes <= MAX_BUDGET_MINUTES
            ? `把预算调到至少 ${formatReviewWindow(suggestedBudget ?? emptyState.minRequiredMinutes)}，才能生成复习航线。`
            : emptyState.minRequiredMinutes !== null
              ? `最短的知识点需要 ${formatReviewWindow(emptyState.minRequiredMinutes)}，已超过 ${MAX_BUDGET_MINUTES} 分钟预算上限，先调整预计用时。`
              : emptyState.pendingCount > 0
                ? '预算为 0；先补全知识点参数，再安排复习时间。'
                : '预算为 0，暂无复习时间可分配。';

        if (suggestedBudget !== null) {
          content.primary = {
            label: `调到 ${formatReviewWindow(suggestedBudget)}`,
            onClick: () => onBudgetChange(suggestedBudget),
          };
        } else if (emptyState.shortestNodeId) {
          content.primary = {
            label: `调整「${shortestNodeTitle}」`,
            onClick: () => onLocateNode(emptyState.shortestNodeId as string),
          };
        } else if (emptyState.firstPendingNodeId) {
          content.primary = {
            label: `去设置「${pendingNodeTitle}」`,
            onClick: () => onLocateNode(emptyState.firstPendingNodeId as string),
          };
        } else if (decisions.length > 0) {
          content.primary = { label: '查看理由', onClick: showReasons };
        }

        if (decisions.length > 0 && content.primary?.onClick !== showReasons) {
          content.secondary = { label: '查看理由', onClick: showReasons };
        }
        break;

      case 'pending-parameters':
        content.status = emptyState.invalidCount > 0 ? '参数待修正' : '参数待设置';
        content.title =
          emptyState.invalidCount > 0 ? '参数还需要修正' : '参数还没有设置';
        content.description =
          '补全分值占比、用时与掌握度后，才能规划航线。';
        content.primary = {
          label: `去设置「${pendingNodeTitle}」`,
          onClick: () => onLocateNode(emptyState.firstPendingNodeId as string),
        };
        content.secondary = { label: '查看待处理原因', onClick: showReasons };
        break;

      case 'insufficient-budget':
        content.title = '当前预算还不足以覆盖任何知识点';
        content.description =
          emptyState.minRequiredMinutes === null
            ? '先调整知识点用时或预算，再生成复习航线。'
            : emptyState.minRequiredMinutes > MAX_BUDGET_MINUTES
              ? `最短的知识点需要 ${formatReviewWindow(emptyState.minRequiredMinutes)}，已超过 ${MAX_BUDGET_MINUTES} 分钟预算上限。`
              : emptyState.pendingCount > 0
                ? `最短的知识点需要 ${formatReviewWindow(emptyState.minRequiredMinutes)}；另有 ${emptyState.pendingCount} 个知识点待处理。`
                : `最短知识点需 ${formatReviewWindow(emptyState.minRequiredMinutes)}；预算提到 ${formatReviewWindow(suggestedBudget ?? emptyState.minRequiredMinutes)}即可开始规划。`;

        if (suggestedBudget !== null) {
          content.primary = {
            label: `提高到 ${formatReviewWindow(suggestedBudget)}`,
            onClick: () => onBudgetChange(suggestedBudget),
          };
        } else if (emptyState.shortestNodeId) {
          content.primary = {
            label: `调整「${shortestNodeTitle}」`,
            onClick: () => onLocateNode(emptyState.shortestNodeId as string),
          };
        }
        content.secondary = { label: '查看理由', onClick: showReasons };
        break;

      case 'no-mastery-gap':
        content.title = '没有可提升的知识点';
        content.description =
          emptyState.pendingCount > 0
            ? `现有知识点掌握度均为 100%；另有 ${emptyState.pendingCount} 个知识点待处理。`
            : '待复习知识点的掌握度均为 100%，没有收益可提升。';
        if (emptyState.firstZeroGapNodeId) {
          content.primary = {
            label: `检查「${zeroGapNodeTitle}」`,
            onClick: () => onLocateNode(emptyState.firstZeroGapNodeId as string),
          };
        }
        content.secondary = { label: '查看理由', onClick: showReasons };
        break;

      case 'all-reviewed':
        content.title = '复习池是空的';
        content.description =
          '所有知识点都已标记为已复习，当前没有需要安排的航线。';
        content.primary = { label: '导入新笔记', onClick: onOpenImport };
        break;

      case 'no-solution':
        content.title = '当前没有可生成的航线';
        content.description = '查看理由，确认每个知识点的参数与预算取舍。';
        content.primary = { label: '查看理由', onClick: showReasons };
        break;
    }

    emptyContent = content;
  }

  const routeActionHint = emptyState
    ? EMPTY_ACTION_HINT[emptyState.kind]
    : selectedCount < 2
      ? '再选中 1 个知识点，即可生成航线'
      : animationEnabled
        ? '点击按钮按算法顺序重播航线'
        : '航线动画已关闭，航线完整显示';

  return (
    <>
      <section
        className={[
          'route-panel',
          'panel',
          emptyContent ? 'route-panel--empty' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-labelledby="review-route-heading"
      >
        <div className="route-intro">
          <span className="eyebrow">复习规划</span>
          <div className="route-intro__title">
            <h2 id="review-route-heading">复习航线</h2>
            <span className="route-status">
              <Route size={9} strokeWidth={2} aria-hidden="true" />
              {emptyContent?.status ?? '按预算规划'}
            </span>
          </div>
          <p>把有限的时间，留给最值得复习的知识点。</p>
        </div>

        <div
          className={[
            'route-map',
            emptyContent ? 'route-map--empty' : '',
            emptyState?.kind === 'no-nodes' ? 'route-map--blank' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {emptyContent ? (
            <div className="route-empty">
              <span className="route-empty__icon" aria-hidden="true">
                <span className="route-empty__ring route-empty__ring--outer" />
                <span className="route-empty__ring route-empty__ring--inner" />
                <Sparkles size={13} strokeWidth={1.7} />
              </span>
              <div className="route-empty__copy" role="status">
                <strong>{emptyContent.title}</strong>
                <p>{emptyContent.description}</p>
              </div>
              {(emptyContent.primary || emptyContent.secondary) && (
                <div className="route-empty__actions">
                  {emptyContent.primary && (
                    <button
                      type="button"
                      className="route-empty__action route-empty__action--primary"
                      onClick={emptyContent.primary.onClick}
                    >
                      {emptyContent.primary.label}
                    </button>
                  )}
                  {emptyContent.secondary && (
                    <button
                      type="button"
                      className="route-empty__action"
                      onClick={emptyContent.secondary.onClick}
                    >
                      {emptyContent.secondary.label}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="route-map__track" aria-hidden="true">
              <span className="route-map__line" />
              <span className="route-map__stop route-map__stop--start">
                <Compass size={12} strokeWidth={1.8} />
              </span>
              <span className="route-map__waypoint route-map__waypoint--one" />
              <span className="route-map__waypoint route-map__waypoint--two" />
              <span className="route-map__waypoint route-map__waypoint--three" />
              <span className="route-map__stop route-map__stop--end">
                <Flag size={11} strokeWidth={1.8} />
              </span>
            </div>
          )}

          {emptyState?.kind !== 'no-nodes' && (
            <>
              <div className="route-map__labels">
                <span>现在</span>
                {decisions.length > 0 ? (
                  <button
                    type="button"
                    className="route-reasons-trigger"
                    aria-expanded={reasonsOpen}
                    aria-controls="route-reason-sheet"
                    onClick={() => setReasonsOpen((open) => !open)}
                  >
                    <span className="route-count">
                      <span className="route-count__dot route-count__dot--selected" />
                      选中 {selectedCount}
                    </span>
                    <span className="route-count">
                      <span className="route-count__dot route-count__dot--skipped" />
                      放弃 {skippedCount}
                    </span>
                    {pendingCount > 0 && (
                      <span className="route-count">
                        <span className="route-count__dot route-count__dot--pending" />
                        待设置 {pendingCount}
                      </span>
                    )}
                    <span className="route-reasons-trigger__action">
                      {reasonsOpen ? '收起理由' : '查看理由'}
                      <ChevronDown size={9} strokeWidth={2} aria-hidden="true" />
                    </span>
                  </button>
                ) : (
                  <span className="route-counts-empty">全部知识点已复习</span>
                )}
                <span>复习完成</span>
              </div>

              <div className="route-budget">
                <div className="route-budget__head">
                  <label htmlFor="route-budget">时间预算</label>
                  <span className="route-budget__tag">按预算重算</span>
                  <strong>{formatDuration(budgetMinutes)}</strong>
                </div>
                <input
                  id="route-budget"
                  className="route-budget__slider"
                  type="range"
                  min={MIN_BUDGET_MINUTES}
                  max={MAX_BUDGET_MINUTES}
                  step={BUDGET_STEP_MINUTES}
                  value={budgetMinutes}
                  aria-valuetext={`${formatDuration(budgetMinutes)}，选中 ${selectedCount} 个，放弃 ${skippedCount} 个${pendingCount > 0 ? `，待设置 ${pendingCount} 个` : ''}`}
                  onChange={(event) => onBudgetChange(Number(event.target.value))}
                />
                <div className="route-budget__scale" aria-hidden="true">
                  <span>{MIN_BUDGET_MINUTES} min</span>
                  <span>{MAX_BUDGET_MINUTES} min</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="route-side">
          <div className="route-stats">
            <div className="route-stat">
              <span>复习池</span>
              <strong>
                {pendingNodes.length}
                <small> 个</small>
              </strong>
            </div>
            <div className="route-stat">
              <span>待复习</span>
              <strong
                className={pendingMinutes === null ? 'is-pending' : undefined}
                title={
                  pendingMinutes === null
                    ? '导入的知识点尚未设置预计用时'
                    : undefined
                }
              >
                {pendingMinutes === null
                  ? '待设置'
                  : pendingNodes.length === 0
                    ? '—'
                    : formatDuration(pendingMinutes)}
              </strong>
            </div>
            <div className="route-stat">
              <span>可用</span>
              <strong>
                {nodes.length === 0 ? '—' : formatDuration(budgetMinutes)}
              </strong>
            </div>
          </div>
          <label className="route-animation">
            <input
              type="checkbox"
              checked={animationEnabled}
              onChange={(event) => onAnimationChange(event.target.checked)}
            />
            <span className="route-animation__track" aria-hidden="true">
              <span className="route-animation__thumb" />
            </span>
            航线动画
          </label>
          <button
            type="button"
            className="route-action"
            onClick={onGenerateRoute}
            disabled={emptyContent !== null || routeNodeCount < 2}
            title={routeActionHint}
            aria-describedby="route-action-hint"
          >
            <Route size={14} strokeWidth={1.8} aria-hidden="true" />
            生成复习航线
            {animationEnabled && <Play size={10} strokeWidth={2} aria-hidden="true" />}
          </button>
          <p className="route-side__hint" id="route-action-hint">
            {routeActionHint}
          </p>
        </div>
      </section>

      {reasonsOpen && decisions.length > 0 && (
        <RouteReasonSheet
          nodes={nodes}
          decisions={decisions}
          selectedIds={routeSelectedIds}
          budgetMinutes={budgetMinutes}
          totalBenefit={totalBenefit}
          onClose={closeReasons}
          onLocate={onLocateNode}
        />
      )}
    </>
  );
}
