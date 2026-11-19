import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Check, Download, Eye, Share2, ShieldCheck, X } from 'lucide-react';
import type { KnapsackDecision } from '../../algorithms/knapsack';
import type { KnowledgeFlowNode } from '../../types/knowledge';
import { downloadShareCardPng } from './exportShareCard';
import { ShareCard } from './ShareCard';
import { createShareCardFileName, createShareCardModel } from './shareCardModel';
import './ShareCardDialog.css';

interface ShareCardDialogProps {
  courseTitle: string;
  isSampleData: boolean;
  nodes: KnowledgeFlowNode[];
  decisions: KnapsackDecision[];
  routeSelectedIds: string[];
  budgetMinutes: number;
  totalBenefit: number;
  onClose: () => void;
}

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

export function ShareCardDialog({
  courseTitle,
  isSampleData,
  nodes,
  decisions,
  routeSelectedIds,
  budgetMinutes,
  totalBenefit,
  onClose,
}: ShareCardDialogProps) {
  const [generatedAt] = useState(() => Date.now());
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const svgRef = useRef<SVGSVGElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const model = useMemo(
    () => createShareCardModel({
      courseTitle,
      isSampleData,
      nodes,
      decisions,
      routeSelectedIds,
      budgetMinutes,
      totalBenefit,
    }),
    [
      budgetMinutes,
      courseTitle,
      decisions,
      isSampleData,
      nodes,
      routeSelectedIds,
      totalBenefit,
    ],
  );

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), [tabindex="0"]',
      );
      if (!controls || controls.length === 0) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const handleDownload = async () => {
    if (!svgRef.current || exportStatus === 'exporting') return;
    setExportStatus('exporting');

    try {
      await downloadShareCardPng(
        svgRef.current,
        createShareCardFileName(model.courseTitle, generatedAt),
      );
      setExportStatus('success');
    } catch {
      setExportStatus('error');
    }
  };

  return createPortal(
    <div
      className="share-dialog-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="share-dialog"
        id="share-card-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        aria-describedby="share-dialog-description"
      >
        <header className="share-dialog__head">
          <div className="share-dialog__title">
            <span className="share-dialog__icon" aria-hidden="true">
              <Share2 size={20} strokeWidth={1.7} />
            </span>
            <div>
              <h2 id="share-dialog-title">分享复习航线</h2>
              <p id="share-dialog-description">预览航线摘要，确认后再导出图片</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="share-dialog__close"
            onClick={onClose}
            aria-label="关闭分享卡预览"
          >
            <X size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </header>

        <div className="share-dialog__body">
          <div className="share-dialog__preview">
            <ShareCard ref={svgRef} model={model} generatedAt={generatedAt} />
          </div>

          <aside className="share-dialog__side" aria-label="导出信息与操作">
            <span className="share-dialog__badge">
              <Eye size={13} strokeWidth={1.7} aria-hidden="true" />
              图片预览
            </span>
            <h3>把取舍讲清楚</h3>
            <p className="share-dialog__intro">
              保留复习顺序与未纳入理由，让分享的是当前计划，而不是效果承诺。
            </p>
            <ul className="share-dialog__checks">
              <li>
                <span aria-hidden="true"><Check size={12} strokeWidth={2} /></span>
                {model.selected.length} 个选中节点、顺序、预计用时与收益
              </li>
              <li>
                <span aria-hidden="true"><Check size={12} strokeWidth={2} /></span>
                {model.skipped.length} 个未纳入节点及取舍摘要
              </li>
              <li>
                <span aria-hidden="true"><Check size={12} strokeWidth={2} /></span>
                仅包含航线摘要，不包含笔记正文
              </li>
            </ul>
            {model.pendingCount > 0 && (
              <p className="share-dialog__pending">
                另有 {model.pendingCount} 个知识点参数待处理，未计入算法取舍。
              </p>
            )}
            <div className="share-dialog__file">
              <span>PNG 图片 · 4:5</span>
              <strong>1080 × 1350</strong>
            </div>

            <div className="share-dialog__actions">
              <button type="button" className="share-dialog__action" onClick={onClose}>
                取消
              </button>
              <button
                type="button"
                className="share-dialog__action share-dialog__action--primary"
                onClick={handleDownload}
                disabled={exportStatus === 'exporting' || model.selected.length === 0}
              >
                <Download size={15} strokeWidth={1.8} aria-hidden="true" />
                {exportStatus === 'exporting' ? '正在生成…' : '下载 PNG'}
              </button>
            </div>

            <div className="share-dialog__feedback" aria-live="polite">
              {exportStatus === 'success' && (
                <p className="share-dialog__success" role="status">
                  <Check size={13} strokeWidth={2} aria-hidden="true" />
                  PNG 已生成；若未开始下载，请检查浏览器下载权限。
                </p>
              )}
              {exportStatus === 'error' && (
                <p className="share-dialog__error" role="alert">
                  <AlertCircle size={13} strokeWidth={1.9} aria-hidden="true" />
                  图片导出失败，请使用最新版浏览器重试；当前航线和工作区数据未受影响。
                </p>
              )}
            </div>
            <p className="share-dialog__privacy">
              <ShieldCheck size={12} strokeWidth={1.8} aria-hidden="true" />
              图片在本机生成，不会上传笔记或航线。
            </p>
          </aside>
        </div>
      </div>
    </div>,
    document.body,
  );
}
