import { Compass, Flag, Play, Route } from 'lucide-react';
import type { KnowledgeFlowNode } from '../types/knowledge';
import { formatDuration } from '../utils/star';
import { sumPendingMinutes } from '../utils/knowledgeGraph';
import './ReviewRoute.css';

const MIN_BUDGET_MINUTES = 15;
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
}

export function ReviewRoute({
  nodes,
  budgetMinutes,
  onBudgetChange,
  animationEnabled,
  onAnimationChange,
  onGenerateRoute,
  routeNodeCount,
}: ReviewRouteProps) {
  const pendingNodes = nodes.filter((node) => !node.data.reviewed);
  const pendingMinutes = sumPendingMinutes(nodes);
  const selectedCount = nodes.filter(
    (node) => node.data.routeState === 'selected',
  ).length;
  const skippedCount = nodes.filter(
    (node) => node.data.routeState === 'skipped',
  ).length;

  return (
    <section className="route-panel panel" aria-labelledby="review-route-heading">
      <div className="route-intro">
        <span className="eyebrow">REVIEW ROUTE</span>
        <div className="route-intro__title">
          <h2 id="review-route-heading">复习航线</h2>
          <span className="route-status">
            <Route size={9} strokeWidth={2} aria-hidden="true" />
            按预算规划
          </span>
        </div>
        <p>把有限的时间，留给最值得复习的知识点。</p>
      </div>

      <div className="route-map">
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
        <div className="route-map__labels" aria-hidden="true">
          <span>现在</span>
          <span className="route-map__waiting">
            <span className="route-count">
              <span className="route-count__dot route-count__dot--selected" />
              选中 {selectedCount}
            </span>
            <span className="route-count">
              <span className="route-count__dot route-count__dot--skipped" />
              放弃 {skippedCount}
            </span>
          </span>
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
            aria-valuetext={`${formatDuration(budgetMinutes)}，选中 ${selectedCount} 个，放弃 ${skippedCount} 个`}
            onChange={(event) => onBudgetChange(Number(event.target.value))}
          />
          <div className="route-budget__scale" aria-hidden="true">
            <span>{MIN_BUDGET_MINUTES} min</span>
            <span>{MAX_BUDGET_MINUTES} min</span>
          </div>
        </div>
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
              {pendingMinutes === null ? '待设置' : formatDuration(pendingMinutes)}
            </strong>
          </div>
          <div className="route-stat">
            <span>可用</span>
            <strong>{formatDuration(budgetMinutes)}</strong>
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
          disabled={routeNodeCount < 2}
          title={
            routeNodeCount < 2
              ? '选中节点不足 2 个，暂不生成航线'
              : animationEnabled
                ? '按算法顺序播放航线绘制动画'
                : '航线动画已关闭，点击完整显示航线'
          }
        >
          <Route size={14} strokeWidth={1.8} aria-hidden="true" />
          生成复习航线
          {animationEnabled && <Play size={10} strokeWidth={2} aria-hidden="true" />}
        </button>
        <p className="route-side__hint">
          {routeNodeCount < 2
            ? '航线需要至少两个选中知识点'
            : animationEnabled
              ? '点击按钮按算法顺序重播航线'
              : '航线动画已关闭，航线完整显示'}
        </p>
      </div>
    </section>
  );
}
