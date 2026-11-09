import { useCallback, useState } from 'react';
import { Check, FileText, RefreshCw, Sparkles, Upload } from 'lucide-react';
import type { ImportedCourse } from '../parsers/importedNote';
import type { ChapterDefinition, KnowledgeFlowNode } from '../types/knowledge';
import type { NoteSourceSummary } from '../types/noteSource';
import { formatMastery, formatScoreShare } from '../utils/star';
import { NoteImportPreview } from './NoteImportPreview';
import { StarGlyph } from './StarGlyph';
import './Sidebar.css';

interface SidebarProps {
  chapters: ChapterDefinition[];
  nodes: KnowledgeFlowNode[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onLoadSample: () => void;
  noteSource: NoteSourceSummary;
  onImportConfirm: (course: ImportedCourse) => void;
}

export function Sidebar({
  chapters,
  nodes,
  selectedNodeId,
  onSelectNode,
  onLoadSample,
  noteSource,
  onImportConfirm,
}: SidebarProps) {
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);

  const closeImportPreview = useCallback(() => setIsImportPreviewOpen(false), []);
  const handleImportConfirm = useCallback(
    (course: ImportedCourse) => {
      setIsImportPreviewOpen(false);
      onImportConfirm(course);
    },
    [onImportConfirm],
  );

  return (
    <>
    <aside className="sidebar panel" aria-label="笔记与知识点目录">
      <section className="note-source" aria-labelledby="note-source-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">NOTE SOURCE</span>
            <h2 id="note-source-heading">复习笔记</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onLoadSample}
            title="重新载入示例笔记"
            aria-label="重新载入示例笔记"
          >
            <RefreshCw size={14} strokeWidth={1.9} />
          </button>
        </div>

        <div className="note-file">
          <div className="note-file__top">
            <span className="note-file__icon" aria-hidden="true">
              <FileText size={17} strokeWidth={1.7} />
            </span>
            <div className="note-file__identity">
              <h3 title={noteSource.fileName}>{noteSource.fileName}</h3>
              <span>{noteSource.subtitle}</span>
            </div>
            <span
              className={
                noteSource.kind === 'sample' ? 'demo-tag' : 'demo-tag demo-tag--imported'
              }
            >
              {noteSource.kind === 'sample' ? '示例' : '导入'}
            </span>
          </div>
          <p className="note-file__excerpt">{noteSource.excerpt}</p>
          <div className="note-file__footer">
            <span className="note-file__loaded">
              <Check size={11} strokeWidth={2.5} aria-hidden="true" />
              已载入星图
            </span>
            <span>
              {noteSource.characterCount.toLocaleString('zh-CN')} 字 · {nodes.length}{' '}
              个知识点
            </span>
          </div>
        </div>

        <div className="note-actions">
          <button type="button" className="button button--primary" onClick={onLoadSample}>
            <Sparkles size={15} strokeWidth={1.9} aria-hidden="true" />
            载入示例笔记
          </button>
          <button
            type="button"
            className="button button--import"
            onClick={() => setIsImportPreviewOpen(true)}
            aria-haspopup="dialog"
            title="导入 Markdown / TXT 笔记"
          >
            <Upload size={14} strokeWidth={1.9} aria-hidden="true" />
            导入笔记
            <span className="button__badge">MD / TXT</span>
          </button>
        </div>
        <p className="note-source__hint">
          {noteSource.kind === 'sample'
            ? '支持 Markdown / TXT 文件；导入将替换当前星图'
            : '导入结果仅保存在本次会话，刷新后恢复示例笔记'}
        </p>
      </section>

      <div className="sidebar__rule" aria-hidden="true" />

      <section className="outline" aria-labelledby="outline-heading">
        <div className="section-heading section-heading--outline">
          <div>
            <span className="eyebrow">KNOWLEDGE INDEX</span>
            <h2 id="outline-heading">知识点目录</h2>
          </div>
          <span className="count-badge">{nodes.length}</span>
        </div>

        <nav className="outline-scroll" aria-label="知识点章节目录">
          {chapters.map((chapter) => {
            const chapterNodes = nodes.filter((node) => node.data.chapterId === chapter.id);

            return (
              <section className={`outline-group tone-${chapter.tone}`} key={chapter.id}>
                <div className="outline-group__heading">
                  <span className="outline-group__gem" aria-hidden="true" />
                  <span className="outline-group__label">{chapter.label}</span>
                  <span className="outline-group__count">{chapterNodes.length}</span>
                </div>
                <ul className="outline-list">
                  {chapterNodes.map((node) => {
                    const isSelected = node.id === selectedNodeId;
                    const scoreLabel = formatScoreShare(node.data.scoreShare);
                    const masteryLabel = formatMastery(node.data.mastery);

                    return (
                      <li key={node.id}>
                        <button
                          type="button"
                          className={[
                            'knowledge-row',
                            `tone-${node.data.tone}`,
                            node.data.parentId ? 'knowledge-row--child' : '',
                            isSelected ? 'is-selected' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => onSelectNode(node.id)}
                          aria-pressed={isSelected}
                          title={`${node.data.title} · 分值占比 ${scoreLabel} · 掌握度 ${masteryLabel}`}
                        >
                          <StarGlyph
                            tone={node.data.tone}
                            size={13}
                            className="knowledge-row__star"
                          />
                          <span className="knowledge-row__title">{node.data.title}</span>
                          <span
                            className={[
                              'knowledge-row__score',
                              node.data.scoreShare === null ? 'is-pending' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                          >
                            {scoreLabel}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </nav>
      </section>
    </aside>

    {isImportPreviewOpen && (
      <NoteImportPreview
        currentNodeCount={nodes.length}
        onClose={closeImportPreview}
        onConfirm={handleImportConfirm}
      />
    )}
    </>
  );
}
