import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crosshair, X } from 'lucide-react';
import type { KnapsackDecision } from '../algorithms/knapsack';
import type { KnowledgeFlowNode } from '../types/knowledge';
import {
  formatDuration,
  formatEstimatedMinutes,
  formatMastery,
  formatScoreShare,
} from '../utils/star';
import './RouteReasonSheet.css';

type ReasonFilter = 'all' | 'selected' | 'skipped';
type ReasonKind = 'selected' | 'skipped' | 'pending';

const FILTERS: Array<{ value: ReasonFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'selected', label: '选中' },
  { value: 'skipped', label: '放弃' },
];

function getReasonKind(decision: KnapsackDecision): ReasonKind {
  if (decision.selected) return 'selected';

  if (
    decision.reason.code === 'skipped-pending-parameters' ||
    decision.reason.code === 'skipped-invalid-parameters'
  ) {
    return 'pending';
  }

  return 'skipped';
}

interface RouteReasonSheetProps {
  nodes: KnowledgeFlowNode[];
  decisions: KnapsackDecision[];
  selectedIds: string[];
  budgetMinutes: number;
  totalBenefit: number;
  onClose: () => void;
  onLocate: (nodeId: string) => void;
}

export function RouteReasonSheet({
  nodes,
  decisions,
  selectedIds,
  budgetMinutes,
  totalBenefit,
  onClose,
  onLocate,
}: RouteReasonSheetProps) {
  const [filter, setFilter] = useState<ReasonFilter>('all');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const compact = window.matchMedia('(max-width: 840px)').matches;
    const previousOverflow = document.body.style.overflow;

    if (compact) document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (compact) document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const titleById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node.data.title])),
    [nodes],
  );
  const orderById = useMemo(
    () => new Map(selectedIds.map((id, index) => [id, index + 1])),
    [selectedIds],
  );
  const cards = useMemo(
    () =>
      decisions.map((decision) => ({
        decision,
        kind: getReasonKind(decision),
        title: titleById.get(decision.id) ?? decision.id,
        order: orderById.get(decision.id) ?? null,
      })),
    [decisions, orderById, titleById],
  );
  const counts = useMemo(
    () => ({
      all: cards.length,
      selected: cards.filter((card) => card.kind === 'selected').length,
      skipped: cards.filter((card) => card.kind === 'skipped').length,
    }),
    [cards],
  );
  const visibleCards =
    filter === 'all' ? cards : cards.filter((card) => card.kind === filter);

  const handleLocate = (nodeId: string) => {
    if (window.matchMedia('(max-width: 840px)').matches) onClose();
    onLocate(nodeId);
  };

  return createPortal(
    <aside
      className="reason-sheet"
      id="route-reason-sheet"
      role="dialog"
      aria-modal="false"
      aria-labelledby="reason-sheet-title"
    >
      <span className="reason-sheet__grab" aria-hidden="true" />
      <header className="reason-sheet__head">
        <div>
          <span className="eyebrow">选择理由</span>
          <h3 id="reason-sheet-title">
            {counts.selected > 0
              ? `为什么是这 ${counts.selected} 个`
              : '这一轮为什么没有航线'}
          </h3>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          className="reason-sheet__close"
          onClick={onClose}
          aria-label="收起理由"
        >
          <X size={15} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </header>
      <p className="reason-sheet__sub">理由来自 0-1 背包结果；点击卡片定位节点。</p>

      <div className="reason-sheet__summary" aria-label="航线统计">
        <div>
          <span>时间预算</span>
          <strong>{formatDuration(budgetMinutes)}</strong>
        </div>
        <div>
          <span>选中</span>
          <strong>{counts.selected}</strong>
        </div>
        <div>
          <span>放弃</span>
          <strong>{counts.skipped}</strong>
        </div>
        <div>
          <span>总收益</span>
          <strong>{Math.round(totalBenefit)}</strong>
        </div>
      </div>

      <div className="reason-sheet__tabs" role="group" aria-label="理由筛选">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={filter === value ? 'is-active' : undefined}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label} <b>{counts[value]}</b>
          </button>
        ))}
      </div>

      <div className="reason-sheet__list" role="group" aria-label="选择理由列表">
        <div className="reason-sheet__caption" aria-hidden="true">
          <span>按算法输入顺序</span>
          <span>
            <b>{visibleCards.length}</b> 条理由
          </span>
        </div>

        {visibleCards.map(({ decision, kind, title, order }) => (
          <button
            key={decision.id}
            type="button"
            className={`reason-card is-${kind}`}
            onClick={() => handleLocate(decision.id)}
            title={`定位「${title}」`}
          >
            <span className="reason-card__index">
              {order === null ? '—' : String(order).padStart(2, '0')}
            </span>
            <span className="reason-card__body">
              <span className="reason-card__row">
                <strong className="reason-card__title">{title}</strong>
                <span className="reason-card__tag">
                  {kind === 'selected' ? '选中' : kind === 'skipped' ? '放弃' : '待设置'}
                </span>
                <span className="reason-card__focus">
                  <Crosshair size={10} strokeWidth={1.9} aria-hidden="true" />
                  定位
                </span>
              </span>
              <span className="reason-card__message">{decision.message}</span>
              <span className="reason-card__meta">
                <span>
                  分值 <b>{formatScoreShare(decision.reason.params.scoreShare)}</b>
                </span>
                <span>
                  掌握度 <b>{formatMastery(decision.reason.params.mastery)}</b>
                </span>
                <span>
                  用时 <b>{formatEstimatedMinutes(decision.reason.params.estimatedMinutes)}</b>
                </span>
              </span>
            </span>
          </button>
        ))}

        {visibleCards.length === 0 && (
          <p className="reason-sheet__empty">这一组暂无可展示的理由。</p>
        )}
      </div>

      <footer className="reason-sheet__foot">
        理由与航线结果同步；交互只改变选中与视图，不改变算法取舍。
      </footer>
    </aside>,
    document.body,
  );
}
