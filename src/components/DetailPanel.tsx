import { ArrowUpRight, MapPin, X } from 'lucide-react';
import type { ChapterDefinition, KnowledgeFlowNode } from '../types/knowledge';
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

export function DetailPanel({
  node,
  chapter,
  parentNode,
  relatedNodes,
  onSelectNode,
  onClearSelection,
}: DetailPanelProps) {
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
          <span className="eyebrow">NODE DETAILS</span>
          <span className="detail-head__label">节点详情</span>
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={onClearSelection}
          title="取消选中"
          aria-label="取消选中当前节点"
        >
          <X size={14} strokeWidth={1.9} />
        </button>
      </header>

      <div className="detail-body">
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
              ? '导入的知识点尚未设置掌握度；在 Sprint 3 节点编辑中补充后，星体亮度才会反映掌握程度。'
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
      </div>
    </aside>
  );
}
