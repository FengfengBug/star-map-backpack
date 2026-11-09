import { useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Info,
  Layers3,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  buildImportedCourse,
  getNoteFileKind,
  MAX_IMPORT_CHARACTERS,
  MAX_IMPORT_FILE_BYTES,
  type ImportedCourse,
  type NoteFileKind,
  type NoteSourceKind,
} from '../parsers/importedNote';
import './NoteImportPreview.css';

type ImportStep = 'preview' | 'confirm';

const PASTE_FILE_NAME = '粘贴笔记.md';
const PREVIEW_ROW_LIMIT = 12;

const FILE_KIND_LABEL: Record<NoteFileKind, string> = {
  markdown: 'Markdown',
  txt: 'TXT',
};

interface ImportStats {
  nodes: number;
  parentRelations: number;
  relatedEdges: number;
}

interface NoteImportPreviewProps {
  currentNodeCount: number;
  onClose: () => void;
  onConfirm: (course: ImportedCourse) => void;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error && error.message.trim() !== ''
    ? error.message
    : '解析失败，请检查笔记格式后重试。';
}

function getImportStats(course: ImportedCourse): ImportStats {
  const relatedKeys = new Set<string>();

  course.points.forEach((point) => {
    point.relatedIds.forEach((relatedId) => {
      relatedKeys.add([point.id, relatedId].sort().join('|'));
    });
  });

  return {
    nodes: course.points.length,
    parentRelations: course.points.filter((point) => point.parentId !== null).length,
    relatedEdges: relatedKeys.size,
  };
}

export function NoteImportPreview({
  currentNodeCount,
  onClose,
  onConfirm,
}: NoteImportPreviewProps) {
  const [step, setStep] = useState<ImportStep>('preview');
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState(PASTE_FILE_NAME);
  const [fileKind, setFileKind] = useState<NoteFileKind>('markdown');
  const [sourceKind, setSourceKind] = useState<NoteSourceKind>('paste');
  const [result, setResult] = useState<ImportedCourse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const stats = result ? getImportStats(result) : null;

  const handleTextChange = (value: string) => {
    setText(value);
    setResult(null);
    setError(null);
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    const kind = getNoteFileKind(file.name);

    if (!kind) {
      setResult(null);
      setError('仅支持 Markdown（.md / .markdown）或 TXT 文件。');
      return;
    }

    if (file.size > MAX_IMPORT_FILE_BYTES) {
      setResult(null);
      setError(
        `文件超过 ${MAX_IMPORT_FILE_BYTES / 1024} KB 上限，请选择更小的笔记文件或改用粘贴。`,
      );
      return;
    }

    try {
      const content = await file.text();
      setText(content);
      setFileName(file.name);
      setFileKind(kind);
      setSourceKind('file');
      setError(null);

      try {
        setResult(buildImportedCourse(content, { fileName: file.name, sourceKind: 'file' }));
      } catch (parseError) {
        setResult(null);
        setError(getErrorMessage(parseError));
      }
    } catch {
      setResult(null);
      setError('文件读取失败，请重试或改用粘贴方式。');
    }
  };

  const handleParse = () => {
    try {
      setResult(buildImportedCourse(text, { fileName, sourceKind }));
      setError(null);
    } catch (parseError) {
      setResult(null);
      setError(getErrorMessage(parseError));
    }
  };

  const handleClear = () => {
    setText('');
    setFileName(PASTE_FILE_NAME);
    setFileKind('markdown');
    setSourceKind('paste');
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
                本地解析 · 不上传
              </span>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="import-modal__close"
            onClick={onClose}
            aria-label="关闭笔记导入"
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
            <PreviewStep
              text={text}
              fileName={fileName}
              fileKind={fileKind}
              sourceKind={sourceKind}
              result={result}
              stats={stats}
              error={error}
              fileInputRef={fileInputRef}
              onTextChange={handleTextChange}
              onFileChange={(file) => void handleFileChange(file)}
              onParse={handleParse}
              onClear={handleClear}
            />
          ) : (
            result &&
            stats && (
              <ConfirmStep
                result={result}
                stats={stats}
                currentNodeCount={currentNodeCount}
              />
            )
          )}
        </div>

        <footer className="import-modal__footer">
          {step === 'preview' ? (
            <>
              <p className="import-modal__note">
                <Info size={12} strokeWidth={2} aria-hidden="true" />
                {result
                  ? '解析结果尚未写入星图'
                  : `支持 Markdown / TXT · 单文件不超过 ${MAX_IMPORT_FILE_BYTES / 1024} KB`}
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
                  disabled={!result}
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
                确认后替换当前星图，导入结果仅保存在本次会话
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
                  onClick={() => {
                    if (result) onConfirm(result);
                  }}
                >
                  <Check size={14} strokeWidth={2.2} aria-hidden="true" />
                  确认导入 {stats?.nodes ?? 0} 个知识点
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

interface PreviewStepProps {
  text: string;
  fileName: string;
  fileKind: NoteFileKind;
  sourceKind: NoteSourceKind;
  result: ImportedCourse | null;
  stats: ImportStats | null;
  error: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onTextChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onParse: () => void;
  onClear: () => void;
}

function PreviewStep({
  text,
  fileName,
  fileKind,
  sourceKind,
  result,
  stats,
  error,
  fileInputRef,
  onTextChange,
  onFileChange,
  onParse,
  onClear,
}: PreviewStepProps) {
  const parentTitleById = new Map(
    result?.points.map((point) => [point.id, point.title]) ?? [],
  );
  const hiddenCount = result ? Math.max(0, result.points.length - PREVIEW_ROW_LIMIT) : 0;

  return (
    <div className="import-preview">
      <div className="import-source">
        <span className="import-source__icon" aria-hidden="true">
          <FileText size={18} strokeWidth={1.7} />
        </span>
        <div className="import-source__copy">
          <strong>{fileName}</strong>
          <span>
            {text.length.toLocaleString('zh-CN')} 字 ·{' '}
            {sourceKind === 'file' ? '本地文件' : '粘贴内容'}
            {result ? ` · 解析出 ${result.points.length} 个知识点` : ''}
          </span>
        </div>
        <span className="import-source__badge">{FILE_KIND_LABEL[fileKind]}</span>
      </div>

      <div className="import-input">
        <div className="import-input__head">
          <span className="eyebrow">PASTE OR UPLOAD</span>
          <span className="import-input__hint">
            支持标题层级：# / ## / ###；上限 {MAX_IMPORT_CHARACTERS.toLocaleString('zh-CN')}{' '}
            字符
          </span>
        </div>
        <textarea
          className="import-textarea"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="在此粘贴 Markdown 或 TXT 笔记内容……"
          aria-label="笔记内容"
          spellCheck={false}
        />
        <div className="import-input__toolbar">
          <span className="import-input__count">
            {text.length.toLocaleString('zh-CN')} /{' '}
            {MAX_IMPORT_CHARACTERS.toLocaleString('zh-CN')} 字符
          </span>
          <div className="import-input__actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,.txt"
              className="import-file-input"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                event.target.value = '';
                onFileChange(file);
              }}
            />
            <button
              type="button"
              className="import-button import-button--file"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={13} strokeWidth={1.9} aria-hidden="true" />
              选择文件
            </button>
            {text !== '' && (
              <button
                type="button"
                className="import-button import-button--quiet"
                onClick={onClear}
              >
                清空
              </button>
            )}
            <button
              type="button"
              className="import-button import-button--primary"
              onClick={onParse}
              disabled={text.trim() === ''}
            >
              <Sparkles size={13} strokeWidth={1.9} aria-hidden="true" />
              解析预览
            </button>
          </div>
        </div>
        {error && (
          <p className="import-error" role="alert">
            <AlertTriangle size={13} strokeWidth={2} aria-hidden="true" />
            {error}
          </p>
        )}
      </div>

      {result && stats && (
        <>
          <div className="import-preview__notice">
            <Sparkles size={13} strokeWidth={1.9} aria-hidden="true" />
            解析已完成，以下结果尚未写入星图；进入下一步确认后才会替换当前知识星图。
          </div>

          <div className="import-preview__grid">
            <section className="import-result" aria-labelledby="import-result-heading">
              <div className="import-result__head">
                <h3 id="import-result-heading">解析结果预览</h3>
                <span>{result.points.length} 个知识点</span>
              </div>
              <ol className="import-result__list">
                {result.points.slice(0, PREVIEW_ROW_LIMIT).map((point) => {
                  const parentTitle = point.parentId
                    ? (parentTitleById.get(point.parentId) ?? null)
                    : null;

                  return (
                    <li className={`import-result__item tone-${point.tone}`} key={point.id}>
                      <span
                        className="import-result__level"
                        aria-label={
                          point.level === 0 ? '无标题正文' : `标题层级 ${point.level}`
                        }
                      >
                        L{point.level}
                      </span>
                      <div className="import-result__copy">
                        <div className="import-result__title-row">
                          <strong>{point.title}</strong>
                          <span>{parentTitle ? `上级 · ${parentTitle}` : '根节点'}</span>
                        </div>
                        <p>{point.content}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {hiddenCount > 0 && (
                <p className="import-result__more">
                  另有 {hiddenCount} 个知识点未展开，确认后会完整写入星图。
                </p>
              )}
            </section>

            <aside className="import-summary" aria-label="导入摘要">
              <div className="import-summary__card">
                <span className="eyebrow">IMPORT SUMMARY</span>
                <h3>本次将生成</h3>
                <dl className="import-summary__stats">
                  <div>
                    <dt>知识点</dt>
                    <dd>{stats.nodes}</dd>
                  </div>
                  <div>
                    <dt>层级关系</dt>
                    <dd>{stats.parentRelations}</dd>
                  </div>
                  <div>
                    <dt>关联边</dt>
                    <dd>{stats.relatedEdges}</dd>
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
        </>
      )}
    </div>
  );
}

interface ConfirmStepProps {
  result: ImportedCourse;
  stats: ImportStats;
  currentNodeCount: number;
}

function ConfirmStep({ result, stats, currentNodeCount }: ConfirmStepProps) {
  return (
    <div className="import-confirm">
      <div className="import-confirm__hero">
        <span className="import-confirm__icon" aria-hidden="true">
          <Layers3 size={20} strokeWidth={1.8} />
        </span>
        <span className="import-confirm__eyebrow">READY TO IMPORT</span>
        <h3>确认导入 {stats.nodes} 个知识点？</h3>
        <p>
          “{result.summary.fileName}”的解析结果将替换当前星图；确认前不会修改现有节点。
        </p>
      </div>

      <div className="import-confirm__stats">
        <div>
          <strong>{stats.nodes}</strong>
          <span>知识点</span>
        </div>
        <div>
          <strong>{stats.parentRelations}</strong>
          <span>层级关系</span>
        </div>
        <div>
          <strong>{stats.relatedEdges}</strong>
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
              用本次解析的 {stats.nodes} 个知识点替换当前星图中的 {currentNodeCount}{' '}
              个知识点及其关联边
            </li>
            <li>清除当前选中状态与已保存的节点位置</li>
            <li>按标题层级生成 {stats.parentRelations} 条层级关系</li>
            <li>按同级相邻关系生成 {stats.relatedEdges} 条关联边</li>
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
            <li>导入结果仅保存在本次会话，刷新页面会恢复示例笔记</li>
          </ul>
        </section>
      </div>

      <p className="import-confirm__footnote">
        示例数据文件不会被修改；需要时仍可从左侧重新载入示例笔记。
      </p>
    </div>
  );
}
