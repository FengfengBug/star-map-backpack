import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type OnNodeDrag,
  type OnNodesChange,
} from '@xyflow/react';
import { DetailPanel } from './components/DetailPanel';
import { Header } from './components/Header';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { ReviewRoute } from './components/ReviewRoute';
import { Sidebar } from './components/Sidebar';
import { StarBackdrop } from './components/StarBackdrop';
import { Toast } from './components/Toast';
import {
  chapters,
  sampleCourse,
  sampleKnowledgePoints,
  sampleNote,
} from './data/sampleCourse';
import {
  defaultSampleCourseId,
  getSampleCoursePackage,
  type SampleCourseId,
  type SampleCoursePackage,
} from './data/sampleCourses';
import type { ImportedCourse } from './parsers/importedNote';
import type {
  ChapterDefinition,
  KnowledgeFlowEdge,
  KnowledgeFlowNode,
  KnowledgePoint,
  KnowledgePointEditableFields,
  KnowledgePointParameterFields,
} from './types/knowledge';
import type { NoteSourceSummary } from './types/noteSource';
import {
  createKnowledgeEdges,
  createKnowledgeNodes,
} from './utils/knowledgeGraph';
import { formatMastery, formatScoreShare } from './utils/star';
import {
  applySavedNodeEdits,
  clearNodePositions,
  loadNodeEdits,
  loadNodePositions,
  saveNodeEdit,
  saveNodePositions,
} from './utils/storage';
import './App.css';

const INITIAL_SELECTED_NODE_ID = 'binary-tree';

function getSampleCourseEditKey(courseId: SampleCourseId) {
  return `sample:${courseId}`;
}

const SAMPLE_NOTE_SOURCE: NoteSourceSummary = {
  fileName: sampleNote.fileName,
  subtitle: sampleCourse.subtitle,
  excerpt: sampleNote.excerpt,
  characterCount: sampleNote.characterCount,
  kind: 'sample',
};

function withSelection(nodes: KnowledgeFlowNode[], selectedNodeId: string | null) {
  return nodes.map((node) => ({
    ...node,
    selected: node.id === selectedNodeId,
  }));
}

function applyNodeFields(
  node: KnowledgeFlowNode,
  fields: KnowledgePointEditableFields,
): KnowledgeFlowNode {
  return {
    ...node,
    ariaLabel: `知识点：${fields.title}，分值占比 ${formatScoreShare(fields.scoreShare)}，掌握度 ${formatMastery(fields.mastery)}`,
    data: { ...node.data, ...fields },
  };
}

function applyNodeParameters(
  node: KnowledgeFlowNode,
  parameters: KnowledgePointParameterFields,
): KnowledgeFlowNode {
  return {
    ...node,
    ariaLabel: `知识点：${node.data.title}，分值占比 ${formatScoreShare(parameters.scoreShare)}，掌握度 ${formatMastery(parameters.mastery)}`,
    data: { ...node.data, ...parameters },
  };
}

interface ToastState {
  id: number;
  message: string;
}

function StarMapWorkspace() {
  const [coursePoints, setCoursePoints] = useState<KnowledgePoint[]>(() =>
    applySavedNodeEdits(
      sampleKnowledgePoints,
      loadNodeEdits(getSampleCourseEditKey(defaultSampleCourseId)),
    ),
  );
  const [courseChapters, setCourseChapters] = useState<ChapterDefinition[]>(chapters);
  const [courseTitle, setCourseTitle] = useState(sampleCourse.title);
  const [noteSource, setNoteSource] = useState<NoteSourceSummary>(SAMPLE_NOTE_SOURCE);
  const [activeSampleCourseId, setActiveSampleCourseId] = useState<SampleCourseId | null>(
    defaultSampleCourseId,
  );
  const [initialNodes] = useState(() =>
    withSelection(
      createKnowledgeNodes(coursePoints, loadNodePositions()),
      INITIAL_SELECTED_NODE_ID,
    ),
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<KnowledgeFlowNode>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(INITIAL_SELECTED_NODE_ID);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastCounter = useRef(0);
  const { fitView, getNodes } = useReactFlow<KnowledgeFlowNode, KnowledgeFlowEdge>();

  const notify = useCallback((message: string) => {
    toastCounter.current += 1;
    setToast({ id: toastCounter.current, message });
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fitView({ padding: 0.12, maxZoom: 1.05 });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [fitView]);

  const handleSelectNode = useCallback(
    (nodeId: string | null) => {
      setSelectedNodeId(nodeId);
      setNodes((currentNodes) => {
        const nextNodes = withSelection(currentNodes, nodeId);
        const hasChanged = currentNodes.some(
          (node, index) => node.selected !== nextNodes[index].selected,
        );
        return hasChanged ? nextNodes : currentNodes;
      });
    },
    [setNodes],
  );

  const fitMapToCanvas = useCallback(() => {
    window.requestAnimationFrame(() => {
      fitView({ padding: 0.12, maxZoom: 1.05, duration: 420 });
    });
  }, [fitView]);

  const loadSampleCourse = useCallback(
    (coursePackage: SampleCoursePackage) => {
      clearNodePositions();
      const points = applySavedNodeEdits(
        coursePackage.points,
        loadNodeEdits(getSampleCourseEditKey(coursePackage.id)),
      );
      setCoursePoints(points);
      setCourseChapters(coursePackage.chapters);
      setCourseTitle(coursePackage.course.title);
      setNoteSource({
        fileName: coursePackage.note.fileName,
        subtitle: coursePackage.course.subtitle,
        excerpt: coursePackage.note.excerpt,
        characterCount: coursePackage.note.characterCount,
        kind: 'sample',
      });
      setActiveSampleCourseId(coursePackage.id);

      const defaultSelection = points.some(
        (point) => point.id === INITIAL_SELECTED_NODE_ID,
      )
        ? INITIAL_SELECTED_NODE_ID
        : (points[0]?.id ?? null);

      setSelectedNodeId(defaultSelection);
      setNodes(withSelection(createKnowledgeNodes(points), defaultSelection));
      notify(`已载入「${coursePackage.course.title}」示例课程，可拖动星体调整布局`);
      fitMapToCanvas();
    },
    [fitMapToCanvas, notify, setNodes],
  );

  const handleLoadSample = useCallback(() => {
    const coursePackage =
      getSampleCoursePackage(activeSampleCourseId) ??
      getSampleCoursePackage(defaultSampleCourseId);

    if (coursePackage) loadSampleCourse(coursePackage);
  }, [activeSampleCourseId, loadSampleCourse]);

  const handleLoadCourse = useCallback(
    (courseId: SampleCourseId) => {
      const coursePackage = getSampleCoursePackage(courseId);
      if (coursePackage) loadSampleCourse(coursePackage);
    },
    [loadSampleCourse],
  );

  const handleSaveNode = useCallback(
    (nodeId: string, fields: KnowledgePointEditableFields) => {
      setCoursePoints((currentPoints) =>
        currentPoints.map((point) =>
          point.id === nodeId ? { ...point, ...fields } : point,
        ),
      );
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === nodeId ? applyNodeFields(node, fields) : node,
        ),
      );

      if (activeSampleCourseId) {
        saveNodeEdit(getSampleCourseEditKey(activeSampleCourseId), nodeId, fields);
        notify(`已更新「${fields.title}」并保存到本机`);
      } else {
        notify(`已更新「${fields.title}」，导入笔记的修改仅本次会话保留`);
      }
    },
    [activeSampleCourseId, notify, setNodes],
  );

  const handlePreviewNode = useCallback(
    (nodeId: string, parameters: KnowledgePointParameterFields | null) => {
      if (parameters) {
        setNodes((currentNodes) =>
          currentNodes.map((node) =>
            node.id === nodeId ? applyNodeParameters(node, parameters) : node,
          ),
        );
        return;
      }

      const point = coursePoints.find((candidate) => candidate.id === nodeId);
      if (!point) return;

      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === nodeId
            ? applyNodeFields(node, {
                title: point.title,
                content: point.content,
                scoreShare: point.scoreShare,
                estimatedMinutes: point.estimatedMinutes,
                mastery: point.mastery,
              })
            : node,
        ),
      );
    },
    [coursePoints, setNodes],
  );

  const handleResetLayout = useCallback(() => {
    setNodes(
      withSelection(createKnowledgeNodes(coursePoints), selectedNodeId),
    );
    clearNodePositions();
    notify('星图布局已恢复');
    fitMapToCanvas();
  }, [coursePoints, fitMapToCanvas, notify, selectedNodeId, setNodes]);

  const handleImportConfirm = useCallback(
    (course: ImportedCourse) => {
      clearNodePositions();
      setCoursePoints(course.points);
      setCourseChapters(course.chapters);
      setCourseTitle(course.summary.courseTitle);
      setNoteSource({
        fileName: course.summary.fileName,
        subtitle: '导入笔记 · 仅本次会话',
        excerpt: course.summary.excerpt,
        characterCount: course.summary.characterCount,
        kind: 'imported',
      });
      setActiveSampleCourseId(null);
      setSelectedNodeId(null);
      setNodes(withSelection(createKnowledgeNodes(course.points), null));
      notify(`已导入 ${course.points.length} 个知识点，分值占比等参数待设置`);
      fitMapToCanvas();
    },
    [fitMapToCanvas, notify, setNodes],
  );

  const handleNodesChange = useCallback<OnNodesChange<KnowledgeFlowNode>>(
    (changes) => {
      const selectionChange = changes.find(
        (change) => change.type === 'select' && change.selected,
      );
      if (selectionChange?.type === 'select') {
        handleSelectNode(selectionChange.id);
      } else if (changes.some((change) => change.type === 'select')) {
        handleSelectNode(null);
      }

      const layoutChanges = changes.filter((change) => change.type !== 'select');
      if (layoutChanges.length > 0) onNodesChange(layoutChanges);
    },
    [handleSelectNode, onNodesChange],
  );

  const handleNodeDragStop = useCallback<OnNodeDrag<KnowledgeFlowNode>>(
    () => {
      saveNodePositions(getNodes());
    },
    [getNodes],
  );

  // 编辑预览只更新 nodes，不重建边；边仅依赖课程数据与选中态。
  const edges = useMemo(
    () => createKnowledgeEdges(createKnowledgeNodes(coursePoints), selectedNodeId),
    [coursePoints, selectedNodeId],
  );

  const selectedNode = selectedNodeId
    ? (nodes.find((node) => node.id === selectedNodeId) ?? null)
    : null;
  const selectedChapter = selectedNode
    ? (courseChapters.find((chapter) => chapter.id === selectedNode.data.chapterId) ?? null)
    : null;
  const parentNode = selectedNode?.data.parentId
    ? (nodes.find((node) => node.id === selectedNode.data.parentId) ?? null)
    : null;
  const relatedNodes = selectedNode
    ? selectedNode.data.relatedIds
        .map((relatedId) => nodes.find((node) => node.id === relatedId))
        .filter((node): node is KnowledgeFlowNode => Boolean(node))
    : [];

  return (
    <div className="app-shell">
      <StarBackdrop />
      <Header
        courseTitle={courseTitle}
        courseTag={noteSource.kind === 'sample' ? '示例' : '导入'}
        reviewWindowMinutes={sampleCourse.reviewWindowMinutes}
      />

      <main className="workspace">
        <Sidebar
          chapters={courseChapters}
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          activeCourseId={activeSampleCourseId}
          onSelectNode={handleSelectNode}
          onLoadSample={handleLoadSample}
          onLoadCourse={handleLoadCourse}
          noteSource={noteSource}
          onImportConfirm={handleImportConfirm}
        />
        <KnowledgeGraph
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onSelectNode={handleSelectNode}
          onNodeDragStop={handleNodeDragStop}
          onResetLayout={handleResetLayout}
        />
        <DetailPanel
          node={selectedNode}
          chapter={selectedChapter}
          parentNode={parentNode}
          relatedNodes={relatedNodes}
          onSelectNode={handleSelectNode}
          onClearSelection={() => handleSelectNode(null)}
          onSaveNode={handleSaveNode}
          onPreviewNode={handlePreviewNode}
        />
        <ReviewRoute
          nodes={nodes}
          reviewWindowMinutes={sampleCourse.reviewWindowMinutes}
        />
      </main>

      {toast && <Toast key={toast.id} message={toast.message} />}
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <StarMapWorkspace />
    </ReactFlowProvider>
  );
}
