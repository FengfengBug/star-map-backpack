import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Info,
  Layers3,
  Sparkles,
  X,
} from 'lucide-react';
import type { StarTone } from '../types/knowledge';
import './NoteImportPreview.css';

type ImportStep = 'preview' | 'confirm';

interface PreviewItem {
  id: string;
  title: string;
  level: number;
  parentTitle: string | null;
  excerpt: string;
  tone: StarTone;
}

const STATIC_PREVIEW_SOURCE = {
  fileName: '计算机组成原理_期末复习.md',
  characterCount: 1248,
};

const STATIC_PREVIEW_ITEMS: PreviewItem[] = [
  {
    id: 'preview-1',
    title: '计算机组成原理',
    level: 1,
    parentTitle: null,
    excerpt: '从数据表示、运算器与存储层次出发，建立整机结构的复习框架。',
    tone: 'gold',
  },
  {
    id: 'preview-2',
    title: '数据表示',
    level: 2,
    parentTitle: '计算机组成原理',
    excerpt: '定点数与浮点数的编码方式，补码、移码与 IEEE 754 的对应关系。',
    tone: 'blue',
  },
  {
    id: 'preview-3',
    title: '运算器',
    level: 2,
    parentTitle: '计算机组成原理',
    excerpt: 'ALU 的组成与加法器进位链，理解算术运算与逻辑运算的数据通路。',
    tone: 'cyan',
  },
];

const PREVIEW_STATS = {
  nodes: STATIC_PREVIEW_ITEMS.length,
  parentRelations: STATIC_PREVIEW_ITEMS.filter((item) => item.parentTitle !== null).length,
  relatedEdges: 1,
};

interface NoteImportPreviewProps {
  currentNodeCount: number;
  onClose: () => void;
  onPreviewConfirm: () => void;
}

export function NoteImportPreview({
  currentNodeCount,
  onClose,
  onPreviewConfirm,
}: NoteImportPreviewProps) {
  const [step, setStep] = useState<ImportStep>('preview');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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
      className="import-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="import-modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
      >
        <header className="import-modal__header">
          <div className="import-modal__heading">
            <span className="eyebrow">NOTE IMPORT / 笔记导入</span>
            <div className="import-modal__title-row">
              <h2 id="import-modal-title">{step === 'preview' ? '解析预览' : '确认导入'}</h2>
              <span className="import-preview-tag">
                <Info size={11} strokeWidth={2} aria-hidden="true" />
                静态预览 · 未接入解析
              </span>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="import-modal__close"
            onClick={onClose}
            aria-label="关闭导入预览"
          >
            <X size={17} strokeWidth={1.9} aria-hidden="true" />
          </button>
        </header>

        <div className="import-steps" aria-label="导入步骤">
          <span className={`import-step ${step === 'preview' ? 'is-active' : 'is-done'}`}>
            <span className="import-step__index">
              {step === 'confirm' ? (
                <Check size={11} strokeWidth={2.4} aria-hidden="true" />
              ) : (
                '01'
              )}
            </span>
            解析预览
          </span>
          <span className="import-step__line" aria-hidden="true" />
          <span className={`import-step ${step === 'confirm' ? 'is-active' : ''}`}>
            <span className="import-step__index">02</span>
            确认导入
          </span>
        </div>

        <div className="import-modal__body">
          {step === 'preview' ? (
            <PreviewStep />
          ) : (
            <ConfirmStep currentNodeCount={currentNodeCount} />
          )}
        </div>

        <footer className="import-modal__footer">
          {step === 'preview' ? (
            <>
              <p className="import-modal__note">
                <Info size={12} strokeWidth={2} aria-hidden="true" />
                静态预览，不会写入星图
              </p>
              <div className="import-modal__actions">
                <button
                  type="button"
                  className="import-button import-button--quiet"
                  onClick={onClose}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="import-button import-button--primary"
                  onClick={() => setStep('confirm')}
                >
                  下一步
                  <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="import-modal__note">
                <Info size={12} strokeWidth={2} aria-hidden="true" />
                静态预览，点击确认不会修改当前星图
              </p>
              <div className="import-modal__actions">
                <button
                  type="button"
                  className="import-button import-button--quiet"
                  onClick={() => setStep('preview')}
                >
                  <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
                  返回预览
                </button>
                <button
                  type="button"
                  className="import-button import-button--primary"
                  onClick={onPreviewConfirm}
                >
                  <Check size={14} strokeWidth={2.2} aria-hidden="true" />
                  确认导入 {PREVIEW_STATS.nodes} 个知识点
                </button>
              </div>
            </>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function PreviewStep() {
  return (
    <div className="import-preview">
      <div className="import-source">
        <span className="import-source__icon" aria-hidden="true">
          <FileText size={18} strokeWidth={1.7} />
        </span>
        <div className="import-source__copy">
          <strong>{STATIC_PREVIEW_SOURCE.fileName}</strong>
          <span>
            {STATIC_PREVIEW_SOURCE.characterCount.toLocaleString('zh-CN')} 字 · 静态示例数据
          </span>
        </div>
        <span className="import-source__badge">Markdown</span>
      </div>

      <div className="import-preview__notice">
        <Sparkles size={13} strokeWidth={1.9} aria-hidden="true" />
        以下为静态示例数据，用于确认信息层级与操作路径；接入解析后将显示真实解析结果。
      </div>

      <div className="import-preview__grid">
        <section className="import-result" aria-labelledby="import-result-heading">
          <div className="import-result__head">
            <h3 id="import-result-heading">解析结果预览</h3>
            <span>{PREVIEW_STATS.nodes} 个知识点</span>
          </div>
          <ol className="import-result__list">
            {STATIC_PREVIEW_ITEMS.map((item) => (
              <li className={`import-result__item tone-${item.tone}`} key={item.id}>
                <span className="import-result__level" aria-label={`标题层级 ${item.level}`}>
                  L{item.level}
                </span>
                <div className="import-result__copy">
                  <div className="import-result__title-row">
                    <strong>{item.title}</strong>
                    <span>{item.parentTitle ? `上级 · ${item.parentTitle}` : '根节点'}</span>
                  </div>
                  <p>{item.excerpt}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className="import-summary" aria-label="导入摘要">
          <div className="import-summary__card">
            <span className="eyebrow">IMPORT SUMMARY</span>
            <h3>本次将生成</h3>
            <dl className="import-summary__stats">
              <div>
                <dt>知识点</dt>
                <dd>{PREVIEW_STATS.nodes}</dd>
              </div>
              <div>
                <dt>层级关系</dt>
                <dd>{PREVIEW_STATS.parentRelations}</dd>
              </div>
              <div>
                <dt>关联边</dt>
                <dd>{PREVIEW_STATS.relatedEdges}</dd>
              </div>
            </dl>
          </div>

          <div className="import-summary__note">
            <Info size={14} strokeWidth={2} aria-hidden="true" />
            <div>
              <strong>参数不会自动生成</strong>
              <p>分值占比、掌握度与复习时间将在导入后保持“待设置”，需在 Sprint 3 由你补充。</p>
            </div>
          </div>

          <p className="import-summary__hint">
            关联边按同级相邻知识点生成；层级关系来自标题层级。
          </p>
        </aside>
      </div>
    </div>
  );
}

function ConfirmStep({ currentNodeCount }: { currentNodeCount: number }) {
  return (
    <div className="import-confirm">
      <div className="import-confirm__hero">
        <span className="import-confirm__icon" aria-hidden="true">
          <Layers3 size={20} strokeWidth={1.8} />
        </span>
        <span className="import-confirm__eyebrow">READY TO IMPORT</span>
        <h3>确认导入 {PREVIEW_STATS.nodes} 个知识点？</h3>
        <p>写入前请确认替换范围；本次操作会更新当前星图，而不是把示例数据继续混在解析结果里。</p>
      </div>

      <div className="import-confirm__stats">
        <div>
          <strong>{PREVIEW_STATS.nodes}</strong>
          <span>知识点</span>
        </div>
        <div>
          <strong>{PREVIEW_STATS.parentRelations}</strong>
          <span>层级关系</span>
        </div>
        <div>
          <strong>{PREVIEW_STATS.relatedEdges}</strong>
          <span>关联边</span>
        </div>
        <div>
          <strong>{currentNodeCount}</strong>
          <span>当前节点将被替换</span>
        </div>
      </div>

      <div className="import-confirm__grid">
        <section className="import-confirm__box">
          <h4>
            <Check size={14} strokeWidth={2.2} aria-hidden="true" />
            将执行
          </h4>
          <ul>
            <li>
              用本次解析的 {PREVIEW_STATS.nodes} 个知识点替换当前星图中的 {currentNodeCount}{' '}
              个知识点及其关联边
            </li>
            <li>清除当前选中状态与已保存的节点位置</li>
            <li>按标题层级生成 {PREVIEW_STATS.parentRelations} 条层级关系</li>
            <li>按同级相邻关系生成 {PREVIEW_STATS.relatedEdges} 条关联边</li>
          </ul>
        </section>

        <section className="import-confirm__box import-confirm__box--attention">
          <h4>
            <Info size={14} strokeWidth={2} aria-hidden="true" />
            导入后需补充
          </h4>
          <ul>
            <li>分值占比、掌握度、预计复习时间不会自动生成</li>
            <li>导入后显示为“待设置”，在 Sprint 3 节点编辑中补充</li>
          </ul>
        </section>
      </div>

      <p className="import-confirm__footnote">
        示例数据文件不会被修改；需要时仍可从左侧重新载入示例笔记。
      </p>
    </div>
  );
}
