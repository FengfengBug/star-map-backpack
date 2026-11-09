import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, BookOpen, Check, Cpu, Info, X } from 'lucide-react';
import {
  defaultSampleCourseId,
  sampleCoursePackages,
  type SampleCourseId,
  type SampleCoursePackage,
} from '../data/sampleCourses';
import './SampleCoursePicker.css';

interface SampleCoursePickerProps {
  activeCourseId: string | null;
  onClose: () => void;
  onConfirm: (courseId: SampleCourseId) => void;
}

function getCourseStats(coursePackage: SampleCoursePackage) {
  const relatedKeys = new Set<string>();

  coursePackage.points.forEach((point) => {
    point.relatedIds.forEach((relatedId) => {
      relatedKeys.add([point.id, relatedId].sort().join('|'));
    });
  });

  return {
    points: coursePackage.points.length,
    chapters: coursePackage.chapters.length,
    relations:
      coursePackage.points.filter((point) => point.parentId !== null).length +
      relatedKeys.size,
  };
}

export function SampleCoursePicker({
  activeCourseId,
  onClose,
  onConfirm,
}: SampleCoursePickerProps) {
  const [selectedId, setSelectedId] = useState<SampleCourseId>(
    () =>
      (sampleCoursePackages.find((coursePackage) => coursePackage.id === activeCourseId)
        ?.id as SampleCourseId | undefined) ?? defaultSampleCourseId,
  );
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const canConfirm = selectedId !== activeCourseId;

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      className="sample-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="sample-modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sample-modal-title"
      >
        <header className="sample-modal__header">
          <div>
            <span className="eyebrow">SAMPLE COURSES / 示例课程</span>
            <div className="sample-modal__title-row">
              <h2 id="sample-modal-title">选择示例课程</h2>
              <span className="sample-modal__tag">
                <Info size={11} strokeWidth={2} aria-hidden="true" />
                示例数据 · 参数可编辑
              </span>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="sample-modal__close"
            onClick={onClose}
            aria-label="关闭示例课程选择"
          >
            <X size={17} strokeWidth={1.9} aria-hidden="true" />
          </button>
        </header>

        <div className="sample-modal__body">
          <p className="sample-notice">
            以下为示例数据，参数可在右侧详情面板编辑。载入课程会替换当前星图与已保存布局，导入的笔记不会保留。
          </p>

          <div className="sample-list" role="radiogroup" aria-label="示例课程列表">
            {sampleCoursePackages.map((coursePackage) => {
              const stats = getCourseStats(coursePackage);
              const isSelected = coursePackage.id === selectedId;
              const isActive = coursePackage.id === activeCourseId;
              const Icon = coursePackage.id === 'computer-organization' ? Cpu : BookOpen;

              return (
                <button
                  key={coursePackage.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={[
                    'sample-card',
                    `tone-${coursePackage.chapters[0]?.tone ?? 'blue'}`,
                    isSelected ? 'is-selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedId(coursePackage.id)}
                >
                  <span className="sample-card__top">
                    <span className="sample-card__icon" aria-hidden="true">
                      <Icon size={18} strokeWidth={1.7} />
                    </span>
                    <span className="sample-card__identity">
                      <span className="sample-card__title">{coursePackage.course.title}</span>
                      <span className="sample-card__subtitle">
                        {coursePackage.course.subtitle}
                      </span>
                    </span>
                    {isActive ? (
                      <span className="sample-card__badge">
                        <Check size={10} strokeWidth={2.4} aria-hidden="true" />
                        当前课程
                      </span>
                    ) : (
                      <span className="sample-card__badge sample-card__badge--quiet">
                        可载入
                      </span>
                    )}
                  </span>

                  <span className="sample-card__description">{coursePackage.description}</span>

                  <span className="sample-card__meta">
                    <span>{stats.points} 个知识点</span>
                    <span>{stats.chapters} 个章节</span>
                    <span>{stats.relations} 条关系</span>
                    <span>{coursePackage.course.reviewWindowMinutes} 分钟预算</span>
                  </span>

                  <span className="sample-card__state">
                    <span className="sample-card__radio" aria-hidden="true" />
                    {isSelected ? '已选择这门课程' : '选择这门课程'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <footer className="sample-modal__footer">
          <p className="sample-footer-note">
            {selectedId === activeCourseId
              ? '当前课程已载入，可选择另一门示例课程。'
              : '确认后替换当前星图，选中状态与已保存布局会被清空。'}
          </p>
          <div className="sample-actions">
            <button type="button" className="sample-button sample-button--quiet" onClick={onClose}>
              取消
            </button>
            <button
              type="button"
              className="sample-button sample-button--primary"
              disabled={!canConfirm}
              onClick={() => onConfirm(selectedId)}
            >
              载入并替换当前星图
              <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
