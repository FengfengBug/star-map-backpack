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
} from './data/sampleCourse';
import type {
  KnowledgeFlowEdge,
  KnowledgeFlowNode,
} from './types/knowledge';
import {
  createKnowledgeEdges,
  createKnowledgeNodes,
} from './utils/knowledgeGraph';
import {
  clearNodePositions,
  loadNodePositions,
  saveNodePositions,
} from './utils/storage';
import './App.css';

const INITIAL_SELECTED_NODE_ID = 'binary-tree';

function withSelection(nodes: KnowledgeFlowNode[], selectedNodeId: string | null) {
  return nodes.map((node) => ({
    ...node,
    selected: node.id === selectedNodeId,
  }));
}

interface ToastState {
  id: number;
  message: string;
}

function StarMapWorkspace() {
  const [initialNodes] = useState(() =>
    withSelection(
      createKnowledgeNodes(sampleKnowledgePoints, loadNodePositions()),
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

  const handleLoadSample = useCallback(() => {
    clearNodePositions();
    setNodes(
      withSelection(createKnowledgeNodes(sampleKnowledgePoints), INITIAL_SELECTED_NODE_ID),
    );
    setSelectedNodeId(INITIAL_SELECTED_NODE_ID);
    notify('示例笔记已载入，可拖动星体调整布局');
    fitMapToCanvas();
  }, [fitMapToCanvas, notify, setNodes]);

  const handleResetLayout = useCallback(() => {
    setNodes(
      withSelection(createKnowledgeNodes(sampleKnowledgePoints), selectedNodeId),
    );
    clearNodePositions();
    notify('星图布局已恢复');
    fitMapToCanvas();
  }, [fitMapToCanvas, notify, selectedNodeId, setNodes]);

  const handleImportPreviewConfirm = useCallback(() => {
    notify('静态预览：确认操作未写入星图');
  }, [notify]);

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

  const edges = useMemo(
    () => createKnowledgeEdges(nodes, selectedNodeId),
    [nodes, selectedNodeId],
  );

  const selectedNode = selectedNodeId
    ? (nodes.find((node) => node.id === selectedNodeId) ?? null)
    : null;
  const selectedChapter = selectedNode
    ? (chapters.find((chapter) => chapter.id === selectedNode.data.chapterId) ?? null)
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
        courseTitle={sampleCourse.title}
        reviewWindowMinutes={sampleCourse.reviewWindowMinutes}
      />

      <main className="workspace">
        <Sidebar
          chapters={chapters}
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          onLoadSample={handleLoadSample}
          onPreviewConfirm={handleImportPreviewConfirm}
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
