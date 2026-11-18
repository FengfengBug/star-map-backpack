import { ArrowRight, Info, Minus, Plus, Route, Undo2 } from 'lucide-react';
import { describePlanChangeCause, type PlanChange } from '../utils/planChange';
import { formatReviewWindow } from '../utils/star';
import './PlanChangeNotice.css';

interface PlanChangeNoticeProps {
  change: PlanChange;
  onUndo: () => void;
  onDismiss: () => void;
}

function formatMastery(value: number | null | undefined) {
  return value === null || value === undefined ? '待设置' : `${value}%`;
}

export function PlanChangeNotice({
  change,
  onUndo,
  onDismiss,
}: PlanChangeNoticeProps) {
  const changeCount = change.removed.length + change.added.length;
  const { cause, previousPlan, nextPlan } = change;
  const unchangedMinutes = previousPlan.totalMinutes === nextPlan.totalMinutes;
  const undoBoundary =
    cause.kind === 'mastery'
      ? '不会回退掌握度'
      : cause.kind === 'reviewed'
        ? '不会回退复习状态'
        : '不会回退节点参数';

  return (
    <section
      className="plan-change-notice"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="航线变更提示"
    >
      <div className="plan-change-notice__body">
        <div className="plan-change-notice__head">
          <span className="plan-change-notice__icon" aria-hidden="true">
            <Route size={17} strokeWidth={1.7} />
          </span>
          <div className="plan-change-notice__heading">
            <span>可解释取舍 · 自动重算</span>
            <strong>航线已重新规划</strong>
          </div>
          <span className="plan-change-notice__badge">{changeCount} 处变化</span>
        </div>

        <div className="plan-change-notice__cause">
          <div>
            <span>本次变化原因</span>
            <strong>{describePlanChangeCause(cause)}</strong>
          </div>
          {cause.kind === 'mastery' && (
            <span
              className="plan-change-notice__mastery"
              aria-label={`掌握度从 ${formatMastery(cause.previousMastery)} 调整为 ${formatMastery(cause.nextMastery)}`}
            >
              <del>{formatMastery(cause.previousMastery)}</del>
              <ArrowRight size={13} strokeWidth={1.5} aria-hidden="true" />
              <strong>{formatMastery(cause.nextMastery)}</strong>
            </span>
          )}
        </div>

        <div className="plan-change-notice__changes" aria-label="航线节点变化">
          {change.removed.map((node) => (
            <div
              className="plan-change-node plan-change-node--out"
              key={`removed-${node.id}`}
            >
              <span className="plan-change-node__icon" aria-hidden="true">
                <Minus size={9} strokeWidth={1.7} />
              </span>
              <div className="plan-change-node__label">
                <span>移出预算</span>
                <span>{node.estimatedMinutes ?? '—'} min</span>
              </div>
              <strong>{node.title}</strong>
              <small>收益 {node.benefit ?? '—'}</small>
            </div>
          ))}
          {change.added.map((node) => (
            <div
              className="plan-change-node plan-change-node--in"
              key={`added-${node.id}`}
            >
              <span className="plan-change-node__icon" aria-hidden="true">
                <Plus size={9} strokeWidth={1.7} />
              </span>
              <div className="plan-change-node__label">
                <span>加入航线</span>
                <span>{node.estimatedMinutes ?? '—'} min</span>
              </div>
              <strong>{node.title}</strong>
              <small>收益 {node.benefit ?? '—'}</small>
            </div>
          ))}
        </div>

        <p className="plan-change-notice__summary">
          <Info size={12} strokeWidth={1.4} aria-hidden="true" />
          <span>
            原节点仍保留在星图中；
            {unchangedMinutes
              ? `航线用时保持 ${formatReviewWindow(nextPlan.totalMinutes)}`
              : `用时 ${formatReviewWindow(previousPlan.totalMinutes)} → ${formatReviewWindow(nextPlan.totalMinutes)}`}
          </span>
        </p>
      </div>

      <footer className="plan-change-notice__footer">
        <span>撤销仅恢复上一版航线，{undoBoundary}。</span>
        <div className="plan-change-notice__actions">
          <button
            type="button"
            className="plan-change-notice__button plan-change-notice__button--quiet"
            onClick={onDismiss}
          >
            知道了
          </button>
          <button
            type="button"
            className="plan-change-notice__button plan-change-notice__button--undo"
            onClick={onUndo}
            aria-label="撤销本次重排，恢复上一版航线，不修改节点参数或复习状态"
          >
            <Undo2 size={12} strokeWidth={1.7} aria-hidden="true" />
            撤销本次重排
          </button>
        </div>
      </footer>
    </section>
  );
}
