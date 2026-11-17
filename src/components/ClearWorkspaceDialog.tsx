import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, RotateCcw, Trash2, X } from 'lucide-react';
import './ClearWorkspaceDialog.css';

type ClearDialogIntent = 'clear' | 'blank';

interface ClearWorkspaceDialogProps {
  nodeCount: number;
  chapterCount: number;
  relationCount: number;
  noteLabel: string;
  noteKind: 'sample' | 'imported';
  intent?: ClearDialogIntent;
  inline?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ClearWorkspaceDialog({
  nodeCount,
  chapterCount,
  relationCount,
  noteLabel,
  noteKind,
  intent = 'clear',
  inline = false,
  onCancel,
  onConfirm,
}: ClearWorkspaceDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (inline) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [inline, onCancel]);

  const dialog = (
    <div
      className="clear-workspace-dialog panel"
      role="dialog"
      aria-modal={inline ? undefined : true}
      aria-labelledby="clear-workspace-title"
      aria-describedby="clear-workspace-description"
    >
      <header className="clear-workspace-dialog__header">
        <div>
          <span className="eyebrow">工作区</span>
          <h2 id="clear-workspace-title">
            {intent === 'blank' ? '新建空白星图？' : '清空当前星图？'}
          </h2>
        </div>
        <button
          type="button"
          className="clear-workspace-dialog__close"
          onClick={onCancel}
          aria-label="关闭清空确认"
        >
          <X size={17} strokeWidth={1.9} aria-hidden="true" />
        </button>
      </header>

      <div className="clear-workspace-dialog__body">
        <div className="clear-workspace-dialog__source">
          <span
            className={
              noteKind === 'imported' ? 'demo-tag demo-tag--imported' : 'demo-tag'
            }
          >
            {noteKind === 'imported' ? '导入' : '示例'}
          </span>
          <strong>{noteLabel}</strong>
        </div>

        <div className="clear-workspace-dialog__stats">
          <div>
            <strong>{nodeCount}</strong>
            <span>知识点</span>
          </div>
          <div>
            <strong>{chapterCount}</strong>
            <span>章节</span>
          </div>
          <div>
            <strong>{relationCount}</strong>
            <span>关联</span>
          </div>
        </div>

        <section
          className="clear-workspace-dialog__warning"
          aria-labelledby="clear-workspace-warning"
        >
          <AlertTriangle size={15} strokeWidth={2} aria-hidden="true" />
          <div>
            <h3 id="clear-workspace-warning">将从本机删除</h3>
            <ul>
              <li>
                当前 {nodeCount} 个知识点与 {relationCount} 条关联
              </li>
              <li>分值占比、预计用时与掌握度编辑</li>
              <li>已保存的节点位置</li>
              {noteKind === 'imported' && <li>导入笔记「{noteLabel}」及正文</li>}
            </ul>
          </div>
        </section>

        <section
          className="clear-workspace-dialog__recovery"
          aria-labelledby="clear-workspace-recovery"
          id="clear-workspace-description"
        >
          <RotateCcw size={15} strokeWidth={2} aria-hidden="true" />
          <div>
            <h3 id="clear-workspace-recovery">可以恢复</h3>
            <p>
              清空后 10 秒内可撤销；最近一次清空会保留在本机，刷新页面后仍可恢复。下一次清空会覆盖这份备份。
            </p>
          </div>
        </section>

        <p className="clear-workspace-dialog__footnote">
          {noteKind === 'sample'
            ? '示例课程数据不会被修改，之后仍可从左侧重新载入。'
            : '空白星图不会自动回退示例，确认后会停留在空白状态。'}
        </p>
      </div>

      <footer className="clear-workspace-dialog__footer">
        <button
          ref={cancelButtonRef}
          type="button"
          className="clear-workspace-button clear-workspace-button--quiet"
          onClick={onCancel}
        >
          取消，保留星图
        </button>
        <button
          type="button"
          className="clear-workspace-button clear-workspace-button--danger"
          onClick={onConfirm}
        >
          <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
          {intent === 'blank' ? '备份并新建空白星图' : '清空并新建空白星图'}
        </button>
      </footer>
    </div>
  );

  if (inline) return dialog;

  return createPortal(
    <div
      className="clear-workspace-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      {dialog}
    </div>,
    document.body,
  );
}
