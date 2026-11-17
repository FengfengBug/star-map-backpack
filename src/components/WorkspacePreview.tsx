import { useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import {
  Check,
  FileText,
  Info,
  LayoutGrid,
  RotateCcw,
  Sparkles,
  Upload,
} from 'lucide-react';
import { ClearWorkspaceDialog } from './ClearWorkspaceDialog';
import { ImportModePicker, type ImportMode } from './ImportModePicker';
import { KnowledgeGraph } from './KnowledgeGraph';
import { StarGlyph } from './StarGlyph';
import { UndoToast } from './UndoToast';
import { WorkspaceActions } from './WorkspaceActions';
import './Sidebar.css';
import './WorkspacePreview.css';

const outlinePreview = [
  {
    id: 'foundation',
    label: '基础结构',
    caption: 'FOUNDATION',
    tone: 'blue' as const,
    rows: [
      { id: 'stack-queue', title: '栈与队列', score: '9%' },
      { id: 'linear-list', title: '线性表', score: '12%' },
    ],
  },
  {
    id: 'trees',
    label: '树与查找',
    caption: 'TREES & SEARCH',
    tone: 'cyan' as const,
    rows: [{ id: 'binary-tree', title: '二叉树', score: '15%' }],
  },
];

export function WorkspacePreview() {
  const [mode, setMode] = useState<ImportMode>('replace');
  const [sidebarFeedback, setSidebarFeedback] = useState<string | null>(null);
  const [graphFeedback, setGraphFeedback] = useState<string | null>(null);
  const [dialogFeedback, setDialogFeedback] = useState<string | null>(null);
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);

  return (
    <ReactFlowProvider>
      <div className="preview-shell">
        <header className="preview-topbar">
          <div className="preview-topbar__copy">
            <span className="preview-kicker">Task 6.1-fix · 静态预览 · 不写入本机存储</span>
            <div className="preview-title-row">
              <h1>工作区生命周期</h1>
              <span className="preview-status">
                <Sparkles size={11} strokeWidth={2} aria-hidden="true" />
                空状态 · 清空恢复 · 导入写入方式
              </span>
            </div>
            <p>
              这一页只渲染真实组件与示例数据，不会清空现有星图、不会写入 LocalStorage，也不会影响正常应用。
              请重点看空星图的恢复入口、清空确认的信息密度，以及导入时替换与追加的区分。
            </p>
          </div>
          <a className="preview-return" href={window.location.pathname}>
            返回应用
          </a>
        </header>

        <main className="preview-grid">
          <section className="preview-card">
            <header className="preview-card__head">
              <span className="preview-card__index">01</span>
              <div>
                <h2>侧边栏工作区入口</h2>
                <p>笔记卡片下方新增「新建空白星图」与「清空星图」，清空为危险色并提前说明可撤销。</p>
              </div>
            </header>

            <div className="preview-sidebar-stage">
              <aside className="sidebar panel preview-sidebar">
                <div className="note-source">
                  <div className="section-heading">
                    <div>
                      <span className="eyebrow">当前笔记</span>
                      <h2>笔记与星图</h2>
                    </div>
                    <span className="icon-button" aria-hidden="true">
                      <FileText size={15} strokeWidth={1.8} />
                    </span>
                  </div>

                  <div className="note-file">
                    <div className="note-file__top">
                      <span className="note-file__icon" aria-hidden="true">
                        <FileText size={17} strokeWidth={1.7} />
                      </span>
                      <span className="note-file__identity">
                        <h3>数据结构与算法_期末复习.md</h3>
                        <span>2,860 字 · 12 个知识点</span>
                      </span>
                      <span className="demo-tag">示例</span>
                    </div>
                    <p className="note-file__excerpt">
                      从线性结构出发，串联树、图与经典算法，整理一份适合考前回看的核心知识清单。
                    </p>
                    <div className="note-file__footer">
                      <span>最近保存 · 刚刚</span>
                      <span className="note-file__loaded">
                        <Check size={10} strokeWidth={2.4} aria-hidden="true" />
                        本机保存
                      </span>
                    </div>
                  </div>

                  <div className="note-actions">
                    <button
                      type="button"
                      className="button button--import"
                      onClick={() =>
                        setSidebarFeedback('静态预览：正式版会打开导入预览，并让你选择替换或追加。')
                      }
                    >
                      <Upload size={14} strokeWidth={1.8} aria-hidden="true" />
                      导入笔记
                      <span className="button__badge">TXT / MD</span>
                    </button>
                    <button
                      type="button"
                      className="button button--quiet"
                      onClick={() =>
                        setSidebarFeedback('静态预览：正式版会打开示例课程选择。')
                      }
                    >
                      <LayoutGrid size={14} strokeWidth={1.8} aria-hidden="true" />
                      选择示例课程
                    </button>
                  </div>

                  <WorkspaceActions
                    onCreateBlank={() =>
                      setSidebarFeedback(
                        '静态预览：正式版会先确认，再进入空白工作区；不会自动回退示例。',
                      )
                    }
                    onClear={() =>
                      setSidebarFeedback(
                        '静态预览：正式版会打开右侧的清空确认框，清空后提供 10 秒撤销。',
                      )
                    }
                  />

                  <p className="preview-feedback" aria-live="polite">
                    {sidebarFeedback ?? '静态预览：点击动作只显示反馈，不会修改数据。'}
                  </p>
                </div>

                <div className="sidebar__rule" />

                <div className="outline">
                  <div className="section-heading section-heading--outline">
                    <span className="eyebrow">知识大纲</span>
                    <span className="count-badge">12</span>
                  </div>
                  <div className="outline-scroll">
                    {outlinePreview.map((group) => (
                      <div
                        key={group.id}
                        className={`outline-group tone-${group.tone}`}
                      >
                        <div className="outline-group__heading">
                          <span className="outline-group__gem" aria-hidden="true" />
                          <span className="outline-group__label">{group.label}</span>
                          <span className="outline-group__count">
                            {group.rows.length}
                          </span>
                        </div>
                        <ul className="outline-list">
                          {group.rows.map((row) => (
                            <li key={row.id}>
                              <button type="button" className="knowledge-row">
                                <span className="knowledge-row__star" aria-hidden="true">
                                  <StarGlyph tone={group.tone} size={9} />
                                </span>
                                <span className="knowledge-row__title">{row.title}</span>
                                <span className="knowledge-row__score">{row.score}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="preview-card">
            <header className="preview-card__head">
              <span className="preview-card__index">02</span>
              <div>
                <h2>空星图与恢复入口</h2>
                <p>空白是合法状态，不会自动回退示例；存在最近一次清空备份时，空状态提供恢复动作。</p>
              </div>
            </header>

            <div className="preview-graph-frame">
              <KnowledgeGraph
                nodes={[]}
                edges={[]}
                onNodesChange={() => undefined}
                onSelectNode={() => undefined}
                onNodeDragStop={() => undefined}
                onResetLayout={() => undefined}
                onOpenImport={() =>
                  setGraphFeedback('静态预览：正式版会打开导入预览。')
                }
                onLoadSample={() =>
                  setGraphFeedback('静态预览：正式版会打开示例课程选择。')
                }
                lastBackupLabel="数据结构与算法 · 12 个知识点"
                onRestoreBackup={() =>
                  setGraphFeedback(
                    '静态预览：正式版会从本机备份恢复 12 个知识点、参数与坐标。',
                  )
                }
              />
            </div>

            <p className="preview-feedback" aria-live="polite">
              {graphFeedback ?? '空状态只展示与当前情况相关的动作，不出现无解释的禁用按钮。'}
            </p>
          </section>

          <section className="preview-card">
            <header className="preview-card__head">
              <span className="preview-card__index">03</span>
              <div>
                <h2>清空确认</h2>
                <p>确认框列出将删除的数据，并明确 10 秒撤销与最近一次清空的本机备份。</p>
              </div>
            </header>

            <div className="preview-dialog-stage">
              {!overlayOpen && (
                <ClearWorkspaceDialog
                  inline
                  nodeCount={12}
                  chapterCount={4}
                  relationCount={18}
                  noteLabel="数据结构与算法_期末复习.md"
                  noteKind="imported"
                  onCancel={() => setDialogFeedback('静态预览：正式版会保留当前星图。')}
                  onConfirm={() =>
                    setDialogFeedback('静态预览：正式版会清空并显示 10 秒撤销条。')
                  }
                />
              )}
            </div>

            <div className="preview-card__foot">
              <p className="preview-feedback" aria-live="polite">
                {dialogFeedback ?? '确认框默认聚焦「取消，保留星图」，Esc 也会关闭。'}
              </p>
              <button
                type="button"
                className="preview-ghost-button"
                onClick={() => setOverlayOpen(true)}
              >
                查看浮层效果
              </button>
            </div>
          </section>

          <section className="preview-card">
            <header className="preview-card__head">
              <span className="preview-card__index">04</span>
              <div>
                <h2>清空后的撤销</h2>
                <p>底部出现 10 秒撤销条；撤销恢复原星图，超时后仍可从空状态恢复最近一次备份。</p>
              </div>
            </header>

            <div className="preview-toast-stage">
              <UndoToast
                inline
                detail="12 个知识点已移到本机备份"
                onUndo={() =>
                  setToastFeedback('静态预览：正式版会立即恢复 12 个知识点与原布局。')
                }
              />
              <ul className="preview-note-list">
                <li>
                  <Check size={12} strokeWidth={2.2} aria-hidden="true" />
                  清空与撤销都不会重复写入示例数据，示例课程仍可从左侧重新载入。
                </li>
                <li>
                  <RotateCcw size={12} strokeWidth={2} aria-hidden="true" />
                  撤销条结束后，空星图保留「恢复上次清空」入口，刷新页面后仍有效。
                </li>
                <li>
                  <Info size={12} strokeWidth={2} aria-hidden="true" />
                  第二次清空会覆盖上一份备份，确认框会提前说明这一点。
                </li>
              </ul>
            </div>

            <p className="preview-feedback" aria-live="polite">
              {toastFeedback ?? '静态预览：撤销按钮只显示反馈，不会修改数据。'}
            </p>
          </section>

          <section className="preview-card preview-card--import">
            <header className="preview-card__head">
              <span className="preview-card__index">05</span>
              <div>
                <h2>导入时选择写入方式</h2>
                <p>替换为默认；追加会生成新章节与稳定 ID，保留现有节点、参数与坐标。当前为空时直接跳过选择。</p>
              </div>
            </header>

            <div className="preview-import-stage">
              <ImportModePicker
                currentCount={12}
                importCount={5}
                mode={mode}
                onChange={(nextMode) => {
                  setMode(nextMode);
                  setImportFeedback(null);
                }}
              />

              <div className="preview-import-actions">
                <span>
                  当前选择：
                  {mode === 'replace'
                    ? `替换现有 12 个知识点，写入 5 个`
                    : `保留现有 12 个知识点，新章节写入 5 个`}
                </span>
                <button
                  type="button"
                  className="preview-primary-button"
                  onClick={() =>
                    setImportFeedback(
                      mode === 'replace'
                        ? '静态预览：正式版会替换当前星图，并清空旧坐标与编辑。'
                        : '静态预览：正式版会保留现有内容，并追加一个新章节。',
                    )
                  }
                >
                  按{mode === 'replace' ? '替换' : '追加'}导入
                </button>
              </div>

              <div className="preview-import-divider">
                <span>当前星图为空时</span>
              </div>

              <ImportModePicker
                currentCount={0}
                importCount={5}
                mode={mode}
                onChange={setMode}
              />
            </div>

            <p className="preview-feedback" aria-live="polite">
              {importFeedback ??
                '追加只影响新章节，不覆盖现有节点、参数与坐标；两种方式都会在确认后写入。'}
            </p>
          </section>
        </main>

        {overlayOpen && (
          <ClearWorkspaceDialog
            nodeCount={12}
            chapterCount={4}
            relationCount={18}
            noteLabel="数据结构与算法_期末复习.md"
            noteKind="imported"
            onCancel={() => {
              setOverlayOpen(false);
              setDialogFeedback('浮层已关闭：正式版会保留当前星图。');
            }}
            onConfirm={() => {
              setOverlayOpen(false);
              setDialogFeedback('浮层已确认：静态预览未修改数据，正式版会进入空白星图并显示撤销条。');
            }}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
}
