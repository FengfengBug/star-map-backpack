import { useEffect, useState, type FormEvent } from 'react';
import { ArrowUpRight, Check, Info, MapPin, Pencil, X } from 'lucide-react';
import type {
  ChapterDefinition,
  KnowledgeFlowNode,
  KnowledgePointEditableFields,
} from '../types/knowledge';
import { getMasteryLabel } from '../utils/star';
import { StarGlyph } from './StarGlyph';
import './DetailPanel.css';

interface DetailPanelProps {
  node: KnowledgeFlowNode | null;
  chapter: ChapterDefinition | null;
  parentNode: KnowledgeFlowNode | null;
  relatedNodes: KnowledgeFlowNode[];
  onSelectNode: (nodeId: string) => void;
  onClearSelection: () => void;
  onSaveNode: (nodeId: string, fields: KnowledgePointEditableFields) => void;
}

interface RelationRowProps {
  label: string;
  node: KnowledgeFlowNode;
  onSelectNode: (nodeId: string) => void;
}

function RelationRow({ label, node, onSelectNode }: RelationRowProps) {
  return (
    <button
      type="button"
      className={`relation-row tone-${node.data.tone}`}
      onClick={() => onSelectNode(node.id)}
    >
      <StarGlyph tone={node.data.tone} size={12} className="relation-row__star" />
      <span className="relation-row__copy">
        <span className="relation-row__label">{label}</span>
        <span className="relation-row__title">{node.data.title}</span>
      </span>
      <ArrowUpRight size={13} strokeWidth={1.7} aria-hidden="true" />
    </button>
  );
}

const EDITOR_TITLE_MAX = 60;
const EDITOR_CONTENT_MAX = 500;

interface EditorDraft {
  title: string;
  content: string;
  scoreShare: string;
  estimatedMinutes: string;
  mastery: string;
}

type EditorErrors = Partial<Record<keyof EditorDraft, string>>;

interface NodeEditorFormProps {
  node: KnowledgeFlowNode;
  chapter: ChapterDefinition | null;
  draft: EditorDraft;
  errors: EditorErrors;
  onChange: (field: keyof EditorDraft, value: string) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function createEditorDraft(node: KnowledgeFlowNode): EditorDraft {
  return {
    title: node.data.title,
    content: node.data.content,
    scoreShare: node.data.scoreShare === null ? '' : String(node.data.scoreShare),
    estimatedMinutes:
      node.data.estimatedMinutes === null ? '' : String(node.data.estimatedMinutes),
    mastery: node.data.mastery === null ? '' : String(node.data.mastery),
  };
}

function validateNumberField(
  value: string,
  min: number,
  max: number,
  label: string,
) {
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  if (!/^\d+$/.test(trimmed)) return `${label}需为整数`;
  const parsed = Number(trimmed);
  if (parsed < min || parsed > max) return `${label}需在 ${min}–${max} 之间`;
  return undefined;
}

function validateEditorDraft(draft: EditorDraft): EditorErrors {
  const errors: EditorErrors = {};

  if (draft.title.trim() === '') {
    errors.title = '标题不能为空';
  } else if (draft.title.trim().length > EDITOR_TITLE_MAX) {
    errors.title = `标题最多 ${EDITOR_TITLE_MAX} 个字符`;
  }

  if (draft.content.trim() === '') {
    errors.content = '知识摘要不能为空';
  } else if (draft.content.trim().length > EDITOR_CONTENT_MAX) {
    errors.content = `知识摘要最多 ${EDITOR_CONTENT_MAX} 个字符`;
  }

  const scoreError = validateNumberField(draft.scoreShare, 1, 100, '分值占比');
  if (scoreError) errors.scoreShare = scoreError;

  const minutesError = validateNumberField(
    draft.estimatedMinutes,
    1,
    600,
    '预计用时',
  );
  if (minutesError) errors.estimatedMinutes = minutesError;

  const masteryError = validateNumberField(draft.mastery, 0, 100, '掌握度');
  if (masteryError) errors.mastery = masteryError;

  return errors;
}

function parseOptionalInteger(value: string) {
  const trimmed = value.trim();
  return trimmed === '' ? null : Number(trimmed);
}

function NodeEditorForm({
  node,
  chapter,
  draft,
  errors,
  onChange,
  onCancel,
  onSubmit,
}: NodeEditorFormProps) {
  const contentLength = draft.content.length;

  return (
    <form className="node-editor" onSubmit={onSubmit} noValidate>
      <div className="editor-hero">
        <span className="editor-hero__visual" aria-hidden="true">
          <StarGlyph tone={node.data.tone} size={28} />
        </span>
        <div className="editor-hero__copy">
          <span className="detail-chapter">{chapter?.label ?? '知识节点'}</span>
          <p>保存后星体尺寸与亮度同步变化。</p>
        </div>
        <span className="editor-local-tag">本机保存</span>
      </div>

      <div className="editor-field">
        <div className="editor-field__head">
          <label htmlFor="editor-title">标题</label>
          <span className={`editor-field__count ${errors.title ? 'is-error' : ''}`}>
            {draft.title.length}/{EDITOR_TITLE_MAX}
          </span>
        </div>
        <input
          id="editor-title"
          className={`editor-input ${errors.title ? 'is-invalid' : ''}`}
          type="text"
          value={draft.title}
          maxLength={EDITOR_TITLE_MAX}
          autoFocus
          onChange={(event) => onChange('title', event.target.value)}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'editor-title-message' : undefined}
        />
        <p
          id="editor-title-message"
          className={errors.title ? 'editor-field__error' : 'editor-field__hint'}
        >
          {errors.title ?? '必填，最多 60 个字符'}
        </p>
      </div>

      <div className="editor-field">
        <div className="editor-field__head">
          <label htmlFor="editor-content">知识摘要</label>
          <span className={`editor-field__count ${errors.content ? 'is-error' : ''}`}>
            {contentLength}/{EDITOR_CONTENT_MAX}
          </span>
        </div>
        <textarea
          id="editor-content"
          className={`editor-textarea ${errors.content ? 'is-invalid' : ''}`}
          rows={4}
          value={draft.content}
          maxLength={EDITOR_CONTENT_MAX}
          onChange={(event) => onChange('content', event.target.value)}
          aria-invalid={Boolean(errors.content)}
          aria-describedby={errors.content ? 'editor-content-message' : undefined}
        />
        <p
          id="editor-content-message"
          className={errors.content ? 'editor-field__error' : 'editor-field__hint'}
        >
          {errors.content ?? '必填，最多 500 个字符'}
        </p>
      </div>

      <div className="editor-grid">
        <div className="editor-field">
          <label htmlFor="editor-score">分值占比</label>
          <div className="editor-number">
            <input
              id="editor-score"
              className={`editor-input ${errors.scoreShare ? 'is-invalid' : ''}`}
              type="number"
              min={1}
              max={100}
              step={1}
              inputMode="numeric"
              placeholder="待设置"
              value={draft.scoreShare}
              onChange={(event) => onChange('scoreShare', event.target.value)}
              aria-invalid={Boolean(errors.scoreShare)}
              aria-describedby={errors.scoreShare ? 'editor-score-message' : undefined}
            />
            <span aria-hidden="true">%</span>
          </div>
          <p
            id="editor-score-message"
            className={errors.scoreShare ? 'editor-field__error' : 'editor-field__hint'}
          >
            {errors.scoreShare ?? '1–100，留空保持待设置'}
          </p>
        </div>

        <div className="editor-field">
          <label htmlFor="editor-minutes">预计用时</label>
          <div className="editor-number">
            <input
              id="editor-minutes"
              className={`editor-input ${errors.estimatedMinutes ? 'is-invalid' : ''}`}
              type="number"
              min={1}
              max={600}
              step={1}
              inputMode="numeric"
              placeholder="待设置"
              value={draft.estimatedMinutes}
              onChange={(event) => onChange('estimatedMinutes', event.target.value)}
              aria-invalid={Boolean(errors.estimatedMinutes)}
              aria-describedby={
                errors.estimatedMinutes ? 'editor-minutes-message' : undefined
              }
            />
            <span aria-hidden="true">min</span>
          </div>
          <p
            id="editor-minutes-message"
            className={
              errors.estimatedMinutes ? 'editor-field__error' : 'editor-field__hint'
            }
          >
            {errors.estimatedMinutes ?? '1–600，留空保持待设置'}
          </p>
        </div>
      </div>

      <div className="editor-field">
        <label htmlFor="editor-mastery">掌握度</label>
        <div className="editor-number">
          <input
            id="editor-mastery"
            className={`editor-input ${errors.mastery ? 'is-invalid' : ''}`}
            type="number"
            min={0}
            max={100}
            step={1}
            inputMode="numeric"
            placeholder="待设置"
            value={draft.mastery}
            onChange={(event) => onChange('mastery', event.target.value)}
            aria-invalid={Boolean(errors.mastery)}
            aria-describedby={errors.mastery ? 'editor-mastery-message' : undefined}
          />
          <span aria-hidden="true">%</span>
        </div>
        <p
          id="editor-mastery-message"
          className={errors.mastery ? 'editor-field__error' : 'editor-field__hint'}
        >
          {errors.mastery ?? '0–100，影响星体亮度；留空保持待设置'}
        </p>
      </div>

      <p className="editor-persist-note">
        <Info size={12} strokeWidth={1.9} aria-hidden="true" />
        修改会同步到星图并保存在本机；导入笔记的修改仅本次会话有效。
      </p>

      <div className="editor-actions">
        <button type="button" className="button editor-cancel" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="button button--primary editor-save">
          <Check size={13} strokeWidth={2.2} aria-hidden="true" />
          保存修改
        </button>
      </div>
    </form>
  );
}

export function DetailPanel({
  node,
  chapter,
  parentNode,
  relatedNodes,
  onSelectNode,
  onClearSelection,
  onSaveNode,
}: DetailPanelProps) {
  const [editorDraft, setEditorDraft] = useState<EditorDraft | null>(null);
  const [editorErrors, setEditorErrors] = useState<EditorErrors>({});

  useEffect(() => {
    setEditorDraft(null);
    setEditorErrors({});
  }, [node?.id]);

  const isEditing = editorDraft !== null;

  const handleStartEdit = () => {
    if (!node) return;
    setEditorDraft(createEditorDraft(node));
    setEditorErrors({});
  };

  const handleCancelEdit = () => {
    setEditorDraft(null);
    setEditorErrors({});
  };

  const handleEditorChange = (field: keyof EditorDraft, value: string) => {
    setEditorDraft((currentDraft) =>
      currentDraft ? { ...currentDraft, [field]: value } : currentDraft,
    );
    setEditorErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
  };

  const handleEditorSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!node || !editorDraft) return;

    const nextErrors = validateEditorDraft(editorDraft);
    setEditorErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSaveNode(node.id, {
      title: editorDraft.title.trim(),
      content: editorDraft.content.trim(),
      scoreShare: parseOptionalInteger(editorDraft.scoreShare),
      estimatedMinutes: parseOptionalInteger(editorDraft.estimatedMinutes),
      mastery: parseOptionalInteger(editorDraft.mastery),
    });
    setEditorDraft(null);
    setEditorErrors({});
  };

  if (!node) {
    return (
      <aside className="detail-panel panel" aria-label="选中知识点详情">
        <header className="detail-head">
          <div>
            <span className="eyebrow">NODE DETAILS</span>
            <span className="detail-head__label">节点详情</span>
          </div>
        </header>

        <div className="detail-empty">
          <div className="detail-empty__visual" aria-hidden="true">
            <span className="detail-empty__orbit detail-empty__orbit--outer" />
            <span className="detail-empty__orbit detail-empty__orbit--inner" />
            <span className="detail-empty__core" />
            <span className="detail-empty__satellite" />
          </div>
          <span className="eyebrow">NO STAR SELECTED</span>
          <h2>选择一颗知识星</h2>
          <p>点击星图中的星体，或从左侧目录选择知识点，查看它的摘要、权重与掌握度。</p>
          <div className="detail-empty__hints">
            <span>尺寸 = 分值占比</span>
            <span>亮度 = 掌握度</span>
          </div>
        </div>
      </aside>
    );
  }

  const relationCount = relatedNodes.length + (parentNode ? 1 : 0);
  const masteryLabel =
    node.data.mastery === null ? null : getMasteryLabel(node.data.mastery);
  const hasPendingMastery = node.data.mastery === null;

  return (
    <aside
      className={`detail-panel panel tone-${node.data.tone}`}
      aria-label={`知识点详情：${node.data.title}`}
    >
      <header className="detail-head">
        <div>
          <span className="eyebrow">{isEditing ? 'EDIT NODE' : 'NODE DETAILS'}</span>
          <span className="detail-head__label">
            {isEditing ? '编辑知识点' : '节点详情'}
          </span>
        </div>
        <div className="detail-head__actions">
          {!isEditing && (
            <button
              type="button"
              className="detail-edit-button"
              onClick={handleStartEdit}
            >
              <Pencil size={12} strokeWidth={2} aria-hidden="true" />
              编辑
            </button>
          )}
          <button
            type="button"
            className="icon-button"
            onClick={isEditing ? handleCancelEdit : onClearSelection}
            title={isEditing ? '取消编辑' : '取消选中'}
            aria-label={isEditing ? '取消编辑当前节点' : '取消选中当前节点'}
          >
            <X size={14} strokeWidth={1.9} />
          </button>
        </div>
      </header>

      <div className="detail-body">
        {editorDraft ? (
          <NodeEditorForm
            node={node}
            chapter={chapter}
            draft={editorDraft}
            errors={editorErrors}
            onChange={handleEditorChange}
            onCancel={handleCancelEdit}
            onSubmit={handleEditorSubmit}
          />
        ) : (
          <>
        <div className="detail-hero">
          <span className="detail-hero__visual" aria-hidden="true">
            <span className="detail-hero__halo" />
            <StarGlyph tone={node.data.tone} size={38} />
          </span>
          <div className="detail-hero__copy">
            <div className="detail-hero__meta">
              <span className="detail-chapter">{chapter?.label ?? '知识节点'}</span>
              <span
                className={`review-status ${node.data.reviewed ? 'is-reviewed' : 'is-pending'}`}
              >
                <span aria-hidden="true" />
                {node.data.reviewed ? '已复习' : '待复习'}
              </span>
            </div>
            <h2>{node.data.title}</h2>
          </div>
        </div>

        <section className="detail-section" aria-labelledby="summary-heading">
          <h3 id="summary-heading" className="detail-section__label">
            知识摘要
          </h3>
          <p className="detail-summary">{node.data.content}</p>
        </section>

        <div className="detail-facts">
          <div className="detail-fact">
            <span>分值占比</span>
            {node.data.scoreShare === null ? (
              <strong className="is-pending">待设置</strong>
            ) : (
              <strong>
                {node.data.scoreShare}
                <small>%</small>
              </strong>
            )}
          </div>
          <div className="detail-fact">
            <span>预计用时</span>
            {node.data.estimatedMinutes === null ? (
              <strong className="is-pending">待设置</strong>
            ) : (
              <strong>
                {node.data.estimatedMinutes}
                <small> min</small>
              </strong>
            )}
          </div>
        </div>

        <section className="mastery-card" aria-label="掌握度">
          <div className="mastery-card__head">
            <span>掌握度</span>
            {hasPendingMastery ? (
              <strong className="is-pending">待设置</strong>
            ) : (
              <strong>
                {node.data.mastery}%<small>{masteryLabel}</small>
              </strong>
            )}
          </div>
          {hasPendingMastery ? (
            <div className="mastery-bar mastery-bar--pending" aria-hidden="true" />
          ) : (
            <div
              className="mastery-bar"
              role="progressbar"
              aria-label="知识点掌握度"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={node.data.mastery ?? undefined}
            >
              <span style={{ width: `${node.data.mastery ?? 0}%` }} />
            </div>
          )}
          <p>
            {hasPendingMastery
              ? '导入的知识点尚未设置掌握度；点击右侧“编辑”补充后，星体亮度才会反映掌握程度。'
              : '星体亮度映射掌握程度，掌握越充分，星光越明亮。'}
          </p>
        </section>

        <section className="relations" aria-labelledby="relations-heading">
          <div className="relations__head">
            <h3 id="relations-heading" className="detail-section__label">
              知识关联
            </h3>
            <span>{relationCount}</span>
          </div>

          <div className="relations__list">
            {parentNode && (
              <RelationRow label="上级节点" node={parentNode} onSelectNode={onSelectNode} />
            )}
            {relatedNodes.map((relatedNode) => (
              <RelationRow
                key={relatedNode.id}
                label="关联节点"
                node={relatedNode}
                onSelectNode={onSelectNode}
              />
            ))}
            {relationCount === 0 && (
              <p className="relations__empty">这个知识点暂时是一座孤岛。</p>
            )}
          </div>
        </section>

        <footer className="detail-footer">
          <span>
            <MapPin size={11} strokeWidth={1.8} aria-hidden="true" />
            星图数据保存在本机
          </span>
          {chapter && <span className="detail-footer__caption">{chapter.caption}</span>}
        </footer>
          </>
        )}
      </div>
    </aside>
  );
}
