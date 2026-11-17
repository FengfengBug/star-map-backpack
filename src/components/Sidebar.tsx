import { useCallback, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  FileText,
  RefreshCw,
  Upload,
} from 'lucide-react';
import type { SampleCourseId } from '../data/sampleCourses';
import type { ImportedCourse } from '../parsers/importedNote';
import type { ChapterDefinition, KnowledgeFlowNode } from '../types/knowledge';
import type { NoteSourceSummary } from '../types/noteSource';
import { formatMastery, formatScoreShare } from '../utils/star';
import type { ImportMode } from './ImportModePicker';
import { NoteImportPreview } from './NoteImportPreview';
import { SampleCoursePicker } from './SampleCoursePicker';
import { StarGlyph } from './StarGlyph';
import { WorkspaceActions } from './WorkspaceActions';
import './Sidebar.css';

interface SidebarProps {
  chapters: ChapterDefinition[];
  nodes: KnowledgeFlowNode[];
  selectedNodeId: string | null;
  activeCourseId: string | null;
  onSelectNode: (nodeId: string) => void;
  onLoadSample: () => void;
  onLoadCourse: (courseId: SampleCourseId) => void;
  noteSource: NoteSourceSummary;
  onImportConfirm: (course: ImportedCourse, mode: ImportMode) => void;
  importPreviewOpen: boolean;
  onOpenImportPreview: () => void;
  onCloseImportPreview: () => void;
  onCreateBlank: () => void;
  onClearWorkspace: () => void;
  onManageLocalData: () => void;
  storageIssue: string | null;
}

const NOTE_TAG_CLASS: Record<NoteSourceSummary['kind'], string> = {
  sample: 'demo-tag',
  imported: 'demo-tag demo-tag--imported',
  blank: 'demo-tag demo-tag--blank',
};

const NOTE_TAG_LABEL: Record<NoteSourceSummary['kind'], string> = {
  sample: '示例',
  imported: '导入',
  blank: '空白',
};

export function Sidebar({
  chapters,
  nodes,
  selectedNodeId,
  activeCourseId,
  onSelectNode,
  onLoadSample,
  onLoadCourse,
  noteSource,
  onImportConfirm,
  importPreviewOpen,
  onOpenImportPreview,
  onCloseImportPreview,
  onCreateBlank,
  onClearWorkspace,
  onManageLocalData,
  storageIssue,
}: SidebarProps) {
  const [isSamplePickerOpen, setIsSamplePickerOpen] = useState(false);

  const closeSamplePicker = useCallback(() => setIsSamplePickerOpen(false), []);

  const handleSampleConfirm = useCallback(
    (courseId: SampleCourseId) => {
      setIsSamplePickerOpen(false);
      onLoadCourse(courseId);
    },
    [onLoadCourse],
  );

  const handleImportConfirm = useCallback(
    (course: ImportedCourse, mode: ImportMode) => {
      onCloseImportPreview();
      onImportConfirm(course, mode);
    },
    [onCloseImportPreview, onImportConfirm],
  );

  return (
    <>
    <aside className="sidebar panel" aria-label="笔记与知识点目录">
      <section className="note-source" aria-labelledby="note-source-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">资料来源</span>
            <h2 id="note-source-heading">复习笔记</h2>
          </div>
          {noteSource.kind === 'sample' && (
            <button
              type="button"
              className="icon-button"
              onClick={onLoadSample}
              title="重新载入当前示例课程"
              aria-label="重新载入当前示例课程"
            >
              <RefreshCw size={14} strokeWidth={1.9} />
            </button>
          )}
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
            <span className={NOTE_TAG_CLASS[noteSource.kind]}>
              {NOTE_TAG_LABEL[noteSource.kind]}
            </span>
          </div>
          <p className="note-file__excerpt">{noteSource.excerpt}</p>
          {noteSource.kind === 'sample' && (
            <p className="note-file__notice">
              示例数据，参数可在右侧详情面板编辑
            </p>
          )}
          <div className="note-file__footer">
            <span className="note-file__loaded">
              <Check size={11} strokeWidth={2.5} aria-hidden="true" />
              {noteSource.kind === 'blank' ? '空白工作区' : '已载入星图'}
            </span>
            <span>
              {noteSource.characterCount.toLocaleString('zh-CN')} 字 · {nodes.length}{' '}
              个知识点
            </span>
          </div>
        </div>

        <div className="note-actions">
          <button
            type="button"
            className="button button--primary"
            onClick={() => setIsSamplePickerOpen(true)}
            aria-haspopup="dialog"
            title="选择并载入示例课程"
          >
            <BookOpen size={15} strokeWidth={1.9} aria-hidden="true" />
            载入示例课程
            <span className="button__badge">2 套</span>
          </button>
          <button
            type="button"
            className="button button--import"
            onClick={onOpenImportPreview}
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
            ? '支持 Markdown / TXT 文件；导入时可选择替换或追加'
            : noteSource.kind === 'imported'
              ? '导入笔记已保存在本机，刷新页面后仍会恢复'
              : '空白星图会保留在本机；导入笔记或载入示例开始构建'}
        </p>

        <WorkspaceActions
          onCreateBlank={onCreateBlank}
          onClear={onClearWorkspace}
          onManageLocalData={onManageLocalData}
          createDisabled={nodes.length === 0}
          clearDisabled={nodes.length === 0}
        />

        {storageIssue && (
          <p className="sidebar-storage-issue" role="status">
            <AlertTriangle size={12} strokeWidth={2} aria-hidden="true" />
            {storageIssue}
          </p>
        )}
      </section>

      <div className="sidebar__rule" aria-hidden="true" />

      <section className="outline" aria-labelledby="outline-heading">
        <div className="section-heading section-heading--outline">
          <div>
            <span className="eyebrow">课程结构</span>
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

    {importPreviewOpen && (
      <NoteImportPreview
        currentNodeCount={nodes.length}
        onClose={onCloseImportPreview}
        onConfirm={handleImportConfirm}
      />
    )}

    {isSamplePickerOpen && (
      <SampleCoursePicker
        activeCourseId={activeCourseId}
        onClose={closeSamplePicker}
        onConfirm={handleSampleConfirm}
      />
    )}
    </>
  );
}
