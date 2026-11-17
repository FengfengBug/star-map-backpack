import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  BookOpen,
  Database,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import './ClearWorkspaceDialog.css';
import './WorkspaceDataDialog.css';

type WorkspaceDataDialogMode = 'manage' | 'recovery';

interface WorkspaceDataDialogProps {
  mode: WorkspaceDataDialogMode;
  workspaceLabel: string;
  backupLabel: string | null;
  backupCorrupt?: boolean;
  storageIssue?: string | null;
  onClose: () => void;
  onRestoreBackup: () => void;
  onLoadSample: () => void;
  onClearAll: () => void;
}

export function WorkspaceDataDialog({
  mode,
  workspaceLabel,
  backupLabel,
  backupCorrupt = false,
  storageIssue = null,
  onClose,
  onRestoreBackup,
  onLoadSample,
  onClearAll,
}: WorkspaceDataDialogProps) {
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const isRecovery = mode === 'recovery';

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    initialFocusRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isRecovery) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isRecovery, onClose]);

  return createPortal(
    <div className="clear-workspace-overlay workspace-data-overlay">
      <div
        className="clear-workspace-dialog workspace-data-dialog panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="workspace-data-title"
        aria-describedby="workspace-data-description"
      >
        <header className="clear-workspace-dialog__header">
          <div>
            <span className="eyebrow">本机数据</span>
            <h2 id="workspace-data-title">
              {isRecovery ? '无法读取本机工作区数据' : '本机工作区数据'}
            </h2>
          </div>
          {!isRecovery && (
            <button
              ref={initialFocusRef}
              type="button"
              className="clear-workspace-dialog__close"
              onClick={onClose}
              aria-label="关闭本机数据管理"
            >
              <X size={17} strokeWidth={1.9} aria-hidden="true" />
            </button>
          )}
        </header>

        <div className="clear-workspace-dialog__body">
          <div className="workspace-data-dialog__summary">
            <span>当前工作区</span>
            <strong>{workspaceLabel}</strong>
          </div>

          {isRecovery ? (
            <>
              <section className="clear-workspace-dialog__warning">
                <AlertTriangle size={15} strokeWidth={2} aria-hidden="true" />
                <div>
                  <h3>没有自动载入示例</h3>
                  <p className="workspace-data-dialog__copy">
                    本机快照可能已损坏。为避免静默覆盖仍可恢复的数据，应用已暂停自动保存；请明确选择下一步。
                  </p>
                </div>
              </section>

              <section className="clear-workspace-dialog__recovery">
                <Database size={15} strokeWidth={2} aria-hidden="true" />
                <div>
                  <h3>最近一次清空备份</h3>
                  <p className="workspace-data-dialog__copy" id="workspace-data-description">
                    {backupCorrupt
                      ? '备份同样无法读取。可载入示例重新开始，或清除本机数据后新建空白星图。'
                      : (backupLabel ?? '没有可用的清空备份。')}
                  </p>
                </div>
              </section>
            </>
          ) : (
            <>
              <section className="clear-workspace-dialog__recovery">
                <Database size={15} strokeWidth={2} aria-hidden="true" />
                <div>
                  <h3>数据仅保存在本机</h3>
                  <p className="workspace-data-dialog__copy" id="workspace-data-description">
                    笔记、星图、参数与坐标均保存在当前浏览器，不会上传。清除后无法撤销。
                  </p>
                </div>
              </section>

              <div className="workspace-data-dialog__rows">
                <div>
                  <span>最近一次清空备份</span>
                  <strong>
                    {backupCorrupt ? '备份已损坏' : (backupLabel ?? '暂无备份')}
                  </strong>
                </div>
              </div>

              {storageIssue && (
                <p className="workspace-data-dialog__issue" role="status">
                  <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" />
                  {storageIssue}
                </p>
              )}
            </>
          )}
        </div>

        <footer className="clear-workspace-dialog__footer workspace-data-dialog__footer">
          {isRecovery ? (
            <>
              {backupLabel && !backupCorrupt && (
                <button
                  ref={initialFocusRef}
                  type="button"
                  className="clear-workspace-button workspace-data-button--primary"
                  onClick={onRestoreBackup}
                >
                  <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
                  恢复上次清空
                </button>
              )}
              <button
                ref={!backupLabel || backupCorrupt ? initialFocusRef : undefined}
                type="button"
                className="clear-workspace-button clear-workspace-button--quiet"
                onClick={onLoadSample}
              >
                <BookOpen size={14} strokeWidth={2} aria-hidden="true" />
                载入示例课程重新开始
              </button>
              <button
                type="button"
                className="clear-workspace-button clear-workspace-button--danger"
                onClick={onClearAll}
              >
                <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                清除数据并新建空白
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="clear-workspace-button clear-workspace-button--quiet"
                onClick={onClose}
              >
                取消
              </button>
              <button
                type="button"
                className="clear-workspace-button clear-workspace-button--danger"
                onClick={onClearAll}
              >
                <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                清除全部本机数据
              </button>
            </>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
