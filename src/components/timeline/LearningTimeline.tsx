import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  History,
  Info,
  RotateCcw,
  Route,
  ShieldCheck,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import type {
  LearningRecord,
  LearningRecordCategory,
} from '../../types/learningRecord';
import { formatMastery } from '../../utils/star';
import { formatLocalTime, groupLearningRecords } from './timelineUtils';
import './LearningTimeline.css';

type TimelineFilter = 'all' | LearningRecordCategory;

const FILTERS: Array<{ value: TimelineFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'review', label: '复习状态' },
  { value: 'route', label: '航线变化' },
];

const RECORD_TITLES: Record<LearningRecord['kind'], string> = {
  reviewed: '标记为已复习',
  unreviewed: '撤销已复习标记',
  replanned: '航线已重新规划',
  undo: '恢复上一版航线',
};

interface LearningTimelineProps {
  records: LearningRecord[];
  storageIssue: string | null;
  onClose: () => void;
  onClear: () => void;
}

function formatMasteryChange(record: LearningRecord) {
  if (record.category === 'review') {
    return `掌握度保持 ${formatMastery(record.mastery)}`;
  }
  if (record.nextMastery !== null) {
    return `掌握度 ${formatMastery(record.previousMastery)} → ${formatMastery(record.nextMastery)}`;
  }
  return null;
}

function TimelineEvent({ record }: { record: LearningRecord }) {
  const changeCount = record.removed.length + record.added.length;
  const contextLabel =
    record.kind === 'replanned'
      ? `${changeCount} 处成员变化`
      : record.kind === 'undo'
        ? '一次撤销'
        : record.nodeTitle;
  const masteryLabel = formatMasteryChange(record);
  const MarkerIcon =
    record.kind === 'reviewed'
      ? Check
      : record.kind === 'unreviewed'
        ? RotateCcw
        : record.kind === 'undo'
          ? Undo2
          : Route;

  return (
    <article
      className={`learning-event learning-event--${record.kind}`}
      aria-label={`${formatLocalTime(record.occurredAt)} ${RECORD_TITLES[record.kind]}`}
    >
      <time
        className="learning-event__time"
        dateTime={new Date(record.occurredAt).toISOString()}
      >
        {formatLocalTime(record.occurredAt)}
      </time>
      <span className="learning-event__marker" aria-hidden="true">
        <MarkerIcon size={11} strokeWidth={2} />
      </span>
      <div className="learning-event__card">
        <div className="learning-event__top">
          <span>{record.category === 'review' ? '复习状态' : '航线变化'}</span>
          <strong title={contextLabel ?? undefined}>{contextLabel}</strong>
        </div>
        <h4>{RECORD_TITLES[record.kind]}</h4>
        <p>{record.summary}</p>
        {record.details.map((detail) => (
          <p className="learning-event__detail" key={detail}>
            {detail}
          </p>
        ))}
        {(masteryLabel || record.previousMinutes !== null) && (
          <div className="learning-event__meta">
            {masteryLabel && <span>{masteryLabel}</span>}
            {record.previousMinutes !== null && (
              <span>
                {record.previousMinutes === record.nextMinutes
                  ? `航线 ${record.nextMinutes} min`
                  : `${record.previousMinutes} → ${record.nextMinutes} min`}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function LearningTimeline({
  records,
  storageIssue,
  onClose,
  onClear,
}: LearningTimelineProps) {
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmDialogRef = useRef<HTMLDivElement>(null);
  const confirmOpenRef = useRef(confirmOpen);
  confirmOpenRef.current = confirmOpen;

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const compact = window.matchMedia('(max-width: 840px)').matches;
    const previousOverflow = document.body.style.overflow;

    if (compact) document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (confirmOpenRef.current) {
        setConfirmOpen(false);
      } else {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (compact) document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    if (!confirmOpen) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelButtonRef.current?.focus();

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const buttons = confirmDialogRef.current?.querySelectorAll('button');
      if (!buttons || buttons.length === 0) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', trapFocus);
    return () => {
      window.removeEventListener('keydown', trapFocus);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [confirmOpen]);

  const counts = useMemo(
    () => ({
      all: records.length,
      review: records.filter((record) => record.category === 'review').length,
      route: records.filter((record) => record.category === 'route').length,
    }),
    [records],
  );
  const visibleRecords =
    filter === 'all'
      ? records
      : records.filter((record) => record.category === filter);
  const days = useMemo(() => groupLearningRecords(visibleRecords), [visibleRecords]);

  const handleConfirmClear = () => {
    onClear();
    setConfirmOpen(false);
  };

  return (
    <>
      <aside
        className="learning-timeline"
        id="learning-timeline"
        role="dialog"
        aria-modal="false"
        aria-labelledby="learning-timeline-title"
      >
        <span className="learning-timeline__grab" aria-hidden="true" />
        <header className="learning-timeline__head">
          <div>
            <span className="eyebrow">本机学习轨迹</span>
            <h2 id="learning-timeline-title">学习记录</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="learning-timeline__close"
            onClick={onClose}
            aria-label="关闭学习记录"
          >
            <X size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </header>
        <p className="learning-timeline__sub">
          按本地时间回看复习状态与航线变化，不改变当前规划。
        </p>

        <div className="learning-timeline__summary" aria-label="学习记录统计">
          <div>
            <span>全部记录</span>
            <strong>{counts.all}</strong>
          </div>
          <div>
            <span>复习状态</span>
            <strong>{counts.review}</strong>
          </div>
          <div>
            <span>航线变化</span>
            <strong>{counts.route}</strong>
          </div>
          <span className="learning-timeline__local">
            <ShieldCheck size={11} strokeWidth={1.8} aria-hidden="true" />
            仅本机
          </span>
        </div>

        <div className="learning-timeline__tabs" role="group" aria-label="学习记录筛选">
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

        {storageIssue && (
          <p className="learning-timeline__issue" role="status">
            <AlertTriangle size={12} strokeWidth={1.8} aria-hidden="true" />
            {storageIssue}
          </p>
        )}

        <div className="learning-timeline__scroll" aria-live="polite">
          {days.map((day, dayIndex) => (
            <section
              className="learning-day"
              key={day.key}
              aria-labelledby={`learning-day-${day.key}`}
            >
              <h3
                className={dayIndex > 0 ? 'learning-day__date learning-day__date--later' : 'learning-day__date'}
                id={`learning-day-${day.key}`}
              >
                {day.label} <span>{day.dateLabel}</span>
              </h3>
              <div className="learning-day__events">
                {day.records.map((record) => (
                  <TimelineEvent key={record.id} record={record} />
                ))}
              </div>
            </section>
          ))}

          {days.length === 0 && (
            <div className="learning-timeline__empty">
              <span aria-hidden="true">
                <History size={20} strokeWidth={1.5} />
              </span>
              <h3>{records.length === 0 ? '还没有学习记录' : '这一组暂无记录'}</h3>
              <p>
                {records.length === 0
                  ? '标记已复习、撤销标记或触发航线重排后，摘要会按本地时间出现在这里。'
                  : '切换到其他筛选，可查看已经保存的学习记录。'}
              </p>
            </div>
          )}
        </div>

        <footer className="learning-timeline__footer">
          <span>
            <ShieldCheck size={12} strokeWidth={1.8} aria-hidden="true" />
            只保存时间、节点与变更摘要，不保存敏感笔记全文。
          </span>
          <button
            type="button"
            className="learning-timeline__clear"
            onClick={() => setConfirmOpen(true)}
            disabled={records.length === 0}
          >
            <Trash2 size={12} strokeWidth={1.8} aria-hidden="true" />
            清空记录
          </button>
        </footer>
      </aside>

      {confirmOpen && (
        <div className="learning-clear-overlay">
          <div
            ref={confirmDialogRef}
            className="learning-clear-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="learning-clear-title"
            aria-describedby="learning-clear-description"
          >
            <div className="learning-clear-dialog__body">
              <span className="learning-clear-dialog__icon" aria-hidden="true">
                <Trash2 size={18} strokeWidth={1.7} />
              </span>
              <h2 id="learning-clear-title">清空 {records.length} 条学习记录？</h2>
              <p id="learning-clear-description">
                此操作会删除本机保存的时间线，<strong>清空后无法恢复</strong>。
              </p>
              <div className="learning-clear-dialog__boundary">
                <Info size={14} strokeWidth={1.7} aria-hidden="true" />
                知识点、掌握度、复习状态、当前航线与笔记内容均不受影响。
              </div>
            </div>
            <footer className="learning-clear-dialog__footer">
              <button
                ref={cancelButtonRef}
                type="button"
                className="learning-clear-dialog__button"
                onClick={() => setConfirmOpen(false)}
              >
                取消，保留记录
              </button>
              <button
                type="button"
                className="learning-clear-dialog__button learning-clear-dialog__button--danger"
                onClick={handleConfirmClear}
              >
                <Trash2 size={13} strokeWidth={1.8} aria-hidden="true" />
                确认清空
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
