import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlowProvider,
  useNodesState,
  useReactFlow,
  type OnNodeDrag,
  type OnNodesChange,
} from '@xyflow/react';
import { planReviewRoute } from './algorithms/knapsack';
import { ClearWorkspaceDialog } from './components/ClearWorkspaceDialog';
import { DetailPanel } from './components/DetailPanel';
import { Header } from './components/Header';
import type { ImportMode } from './components/ImportModePicker';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { ReviewRoute } from './components/ReviewRoute';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/Toast';
import { UndoToast } from './components/UndoToast';
import { WorkspaceDataDialog } from './components/WorkspaceDataDialog';
import {
  defaultSampleCourseId,
  getSampleCoursePackage,
  type SampleCourseId,
  type SampleCoursePackage,
} from './data/sampleCourses';
import type { ImportedCourse } from './parsers/importedNote';
import type {
  ChapterDefinition,
  GraphFlowEdge,
  KnowledgeFlowNode,
  KnowledgePoint,
  KnowledgePointEditableFields,
  KnowledgePointParameterFields,
  ReviewRouteState,
} from './types/knowledge';
import type { NoteSourceSummary } from './types/noteSource';
import {
  createKnowledgeEdges,
  createKnowledgeNodes,
} from './utils/knowledgeGraph';
import {
  createReviewRouteEdges,
  createReviewRouteItems,
  createRouteStateMap,
} from './utils/reviewRoute';
import { formatMastery, formatScoreShare } from './utils/star';
import {
  applySavedNodeEdits,
  clearNodeEdits,
  clearNodePositions,
  loadNodeEdits,
  loadNodePositions,
  type SavedNodePositions,
} from './utils/storage';
import {
  appendImportedCourse,
  clearAllLocalWorkspaceData,
  countWorkspaceRelations,
  createBlankWorkspaceSnapshot,
  createWorkspaceSnapshot,
  loadWorkspaceBackup,
  loadWorkspaceSnapshot,
  saveWorkspaceBackup,
  saveWorkspaceSnapshot,
  type WorkspaceBackup,
  type WorkspaceKind,
  type WorkspaceSnapshot,
  type WorkspaceSnapshotInput,
} from './utils/workspace';
import './App.css';

const INITIAL_SELECTED_NODE_ID = 'binary-tree';
const ROUTE_RECALC_DELAY_MS = 200;
const WORKSPACE_SAVE_DELAY_MS = 180;
const UNDO_WINDOW_MS = 10_000;
const STORAGE_UNAVAILABLE_MESSAGE =
  '浏览器本地存储不可用，当前修改仅保留在本次会话。';
const STORAGE_WRITE_FAILURE_MESSAGE =
  '本机存储写入失败，当前修改仅保留在本次会话；可在「本机数据」中清理空间后重试。';
const STORAGE_BACKUP_FAILURE_MESSAGE =
  '无法写入本机备份，清空已取消；请检查浏览器存储空间后重试。';

type ClearIntent = 'clear' | 'blank';
type CourseTag = '示例' | '导入' | '空白';

interface UndoState {
  run: number;
  snapshot: WorkspaceSnapshot;
  message: string;
  detail: string;
}

interface InitialWorkspaceState {
  status: 'ok' | 'empty' | 'corrupt' | 'unavailable';
  snapshot: WorkspaceSnapshot;
  backup: WorkspaceBackup | null;
  backupCorrupt: boolean;
  canPersist: boolean;
  storageIssue: string | null;
  shouldPersistInitial: boolean;
}

function getSampleCourseEditKey(courseId: SampleCourseId) {
  return `sample:${courseId}`;
}

function withSelection(nodes: KnowledgeFlowNode[], selectedNodeId: string | null) {
  return nodes.map((node) => ({
    ...node,
    selected: node.id === selectedNodeId,
  }));
}

function createRouteStates(points: KnowledgePoint[], budgetMinutes: number) {
  return createRouteStateMap(
    planReviewRoute(createReviewRouteItems(points), budgetMinutes),
  );
}

function applyRouteStates(
  nodes: KnowledgeFlowNode[],
  routeStates: Map<string, ReviewRouteState>,
): KnowledgeFlowNode[] {
  let hasChanged = false;
  const nextNodes = nodes.map((node) => {
    const routeState = routeStates.get(node.id) ?? null;
    if (node.data.routeState === routeState) return node;

    hasChanged = true;
    return { ...node, data: { ...node.data, routeState } };
  });

  return hasChanged ? nextNodes : nodes;
}

function applyNodeFields(
  node: KnowledgeFlowNode,
  fields: KnowledgePointEditableFields,
): KnowledgeFlowNode {
  return {
    ...node,
    ariaLabel: `知识点：${fields.title}，分值占比 ${formatScoreShare(fields.scoreShare)}，掌握度 ${formatMastery(fields.mastery)}${node.data.reviewed ? '，已复习' : ''}`,
    data: { ...node.data, ...fields },
  };
}

function applyNodeParameters(
  node: KnowledgeFlowNode,
  parameters: KnowledgePointParameterFields,
): KnowledgeFlowNode {
  return {
    ...node,
    ariaLabel: `知识点：${node.data.title}，分值占比 ${formatScoreShare(parameters.scoreShare)}，掌握度 ${formatMastery(parameters.mastery)}${node.data.reviewed ? '，已复习' : ''}`,
    data: { ...node.data, ...parameters },
  };
}

function applyNodeReviewed(
  node: KnowledgeFlowNode,
  reviewed: boolean,
): KnowledgeFlowNode {
  return {
    ...node,
    ariaLabel: `知识点：${node.data.title}，分值占比 ${formatScoreShare(node.data.scoreShare)}，掌握度 ${formatMastery(node.data.mastery)}${reviewed ? '，已复习' : ''}`,
    data: { ...node.data, reviewed },
  };
}

function collectNodePositions(nodes: KnowledgeFlowNode[]): SavedNodePositions {
  return nodes.reduce<SavedNodePositions>((positions, node) => {
    positions[node.id] = { x: node.position.x, y: node.position.y };
    return positions;
  }, {});
}

function createSampleNoteSource(coursePackage: SampleCoursePackage): NoteSourceSummary {
  return {
    fileName: coursePackage.note.fileName,
    subtitle: coursePackage.course.subtitle,
    excerpt: coursePackage.note.excerpt,
    characterCount: coursePackage.note.characterCount,
    kind: 'sample',
  };
}

function createSampleSnapshot(coursePackage: SampleCoursePackage): WorkspaceSnapshot {
  return createWorkspaceSnapshot({
    id: `sample:${coursePackage.id}`,
    kind: 'sample',
    courseTitle: coursePackage.course.title,
    chapters: coursePackage.chapters,
    points: coursePackage.points,
    noteSource: createSampleNoteSource(coursePackage),
    activeSampleCourseId: coursePackage.id,
    positions: {},
    budgetMinutes: coursePackage.course.reviewWindowMinutes,
  });
}

function createLegacySampleSnapshot(): WorkspaceSnapshot {
  const coursePackage =
    getSampleCoursePackage(defaultSampleCourseId) ??
    getSampleCoursePackage('data-structures');

  if (!coursePackage) {
    return createBlankWorkspaceSnapshot();
  }

  const points = applySavedNodeEdits(
    coursePackage.points,
    loadNodeEdits(getSampleCourseEditKey(coursePackage.id)),
  );
  const pointIds = new Set(points.map((point) => point.id));
  const positions = Object.entries(loadNodePositions()).reduce<SavedNodePositions>(
    (saved, [nodeId, position]) => {
      if (pointIds.has(nodeId)) saved[nodeId] = position;
      return saved;
    },
    {},
  );

  return createWorkspaceSnapshot({
    id: `sample:${coursePackage.id}`,
    kind: 'sample',
    courseTitle: coursePackage.course.title,
    chapters: coursePackage.chapters,
    points,
    noteSource: createSampleNoteSource(coursePackage),
    activeSampleCourseId: coursePackage.id,
    positions,
    budgetMinutes: coursePackage.course.reviewWindowMinutes,
  });
}

function getDefaultSelection(snapshot: WorkspaceSnapshot): string | null {
  if (snapshot.kind !== 'sample') return null;
  if (snapshot.points.some((point) => point.id === INITIAL_SELECTED_NODE_ID)) {
    return INITIAL_SELECTED_NODE_ID;
  }
  return snapshot.points[0]?.id ?? null;
}

function createWorkspaceNodes(
  snapshot: WorkspaceSnapshot,
  selection: string | null,
): KnowledgeFlowNode[] {
  return withSelection(
    applyRouteStates(
      createKnowledgeNodes(snapshot.points, snapshot.positions),
      createRouteStates(snapshot.points, snapshot.budgetMinutes),
    ),
    selection,
  );
}

function createInitialWorkspaceState(): InitialWorkspaceState {
  const loaded = loadWorkspaceSnapshot();
  const backupResult = loadWorkspaceBackup();
  const backup = backupResult.status === 'ok' ? backupResult.backup : null;
  const backupCorrupt = backupResult.status === 'corrupt';

  if (loaded.status === 'ok') {
    return {
      status: 'ok',
      snapshot: loaded.snapshot,
      backup,
      backupCorrupt,
      canPersist: true,
      storageIssue: null,
      shouldPersistInitial: false,
    };
  }

  if (loaded.status === 'corrupt') {
    return {
      status: 'corrupt',
      snapshot: createBlankWorkspaceSnapshot(),
      backup,
      backupCorrupt,
      canPersist: false,
      storageIssue: null,
      shouldPersistInitial: false,
    };
  }

  if (loaded.status === 'unavailable') {
    return {
      status: 'unavailable',
      snapshot: createLegacySampleSnapshot(),
      backup,
      backupCorrupt,
      canPersist: false,
      storageIssue: STORAGE_UNAVAILABLE_MESSAGE,
      shouldPersistInitial: false,
    };
  }

  return {
    status: 'empty',
    snapshot: createLegacySampleSnapshot(),
    backup,
    backupCorrupt,
    canPersist: true,
    storageIssue: null,
    shouldPersistInitial: true,
  };
}

function formatBackupLabel(backup: WorkspaceBackup) {
  const date = new Date(backup.clearedAt);
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
  return `${date.getMonth() + 1}月${date.getDate()}日 ${time} · ${backup.workspace.courseTitle} · ${backup.workspace.points.length} 个知识点`;
}

function getWorkspaceLabel(kind: WorkspaceKind, courseTitle: string) {
  if (kind === 'blank') return '空白星图';
  return `${kind === 'sample' ? '示例' : '导入'} · ${courseTitle}`;
}

interface ToastState {
  id: number;
  message: string;
}

function StarMapWorkspace() {
  const [initialWorkspace] = useState(createInitialWorkspaceState);
  const initialSnapshot = initialWorkspace.snapshot;
  const initialSelection = getDefaultSelection(initialSnapshot);
  const [initialNodes] = useState(() =>
    createWorkspaceNodes(initialSnapshot, initialSelection),
  );

  const [workspaceId, setWorkspaceId] = useState(initialSnapshot.id);
  const [workspaceKind, setWorkspaceKind] = useState<WorkspaceKind>(
    initialSnapshot.kind,
  );
  const [coursePoints, setCoursePoints] = useState<KnowledgePoint[]>(
    initialSnapshot.points,
  );
  const [courseChapters, setCourseChapters] = useState<ChapterDefinition[]>(
    initialSnapshot.chapters,
  );
  const [courseTitle, setCourseTitle] = useState(initialSnapshot.courseTitle);
  const [noteSource, setNoteSource] = useState<NoteSourceSummary>(
    initialSnapshot.noteSource,
  );
  const [activeSampleCourseId, setActiveSampleCourseId] =
    useState<SampleCourseId | null>(initialSnapshot.activeSampleCourseId);
  const [nodePositions, setNodePositions] = useState<SavedNodePositions>(
    initialSnapshot.positions,
  );
  const [nodes, setNodes, onNodesChange] =
    useNodesState<KnowledgeFlowNode>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    initialSelection,
  );
  const [budgetMinutes, setBudgetMinutes] = useState(
    initialSnapshot.budgetMinutes,
  );
  const [plannedBudgetMinutes, setPlannedBudgetMinutes] = useState(
    initialSnapshot.budgetMinutes,
  );
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [routeAnimationEnabled, setRouteAnimationEnabled] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [routeAnimationRun, setRouteAnimationRun] = useState(0);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [clearIntent, setClearIntent] = useState<ClearIntent | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(
    initialWorkspace.status === 'corrupt',
  );
  const [backup, setBackup] = useState<WorkspaceBackup | null>(
    initialWorkspace.backup,
  );
  const [backupCorrupt, setBackupCorrupt] = useState(
    initialWorkspace.backupCorrupt,
  );
  const [storageIssue, setStorageIssue] = useState<string | null>(
    initialWorkspace.storageIssue,
  );
  const [persistEnabled, setPersistEnabled] = useState(
    initialWorkspace.canPersist,
  );

  const toastCounter = useRef(0);
  const persistEnabledRef = useRef(initialWorkspace.canPersist);
  const storageNoticeShownRef = useRef(false);
  const undoTimerRef = useRef<number | null>(null);
  const undoRunRef = useRef(0);
  const { fitView, getNodes, getZoom, setCenter } = useReactFlow<
    KnowledgeFlowNode,
    GraphFlowEdge
  >();

  const notify = useCallback((message: string) => {
    toastCounter.current += 1;
    setToast({ id: toastCounter.current, message });
  }, []);

  const openImportPreview = useCallback(() => setIsImportPreviewOpen(true), []);
  const closeImportPreview = useCallback(() => setIsImportPreviewOpen(false), []);

  const handlePersistFailure = useCallback(() => {
    persistEnabledRef.current = false;
    setPersistEnabled(false);
    setStorageIssue(STORAGE_WRITE_FAILURE_MESSAGE);

    if (!storageNoticeShownRef.current) {
      storageNoticeShownRef.current = true;
      notify('本机存储写入失败，当前修改仅保留在本次会话');
    }
  }, [notify]);

  const resumePersistence = useCallback(() => {
    persistEnabledRef.current = true;
    setPersistEnabled(true);
    setStorageIssue(null);
    storageNoticeShownRef.current = false;
  }, []);

  const persistSnapshot = useCallback(
    (snapshot: WorkspaceSnapshot) => {
      if (!persistEnabledRef.current) return false;
      if (saveWorkspaceSnapshot(snapshot)) return true;
      handlePersistFailure();
      return false;
    },
    [handlePersistFailure],
  );

  const buildCurrentSnapshot = useCallback(
    (overrides: Partial<WorkspaceSnapshotInput> = {}) =>
      createWorkspaceSnapshot({
        id: workspaceId,
        kind: workspaceKind,
        courseTitle,
        chapters: courseChapters,
        points: coursePoints,
        noteSource,
        activeSampleCourseId,
        positions: nodePositions,
        budgetMinutes,
        ...overrides,
      }),
    [
      activeSampleCourseId,
      budgetMinutes,
      courseChapters,
      coursePoints,
      courseTitle,
      nodePositions,
      noteSource,
      workspaceId,
      workspaceKind,
    ],
  );

  const persistCurrentWorkspace = useCallback(
    (overrides: Partial<WorkspaceSnapshotInput> = {}) =>
      persistSnapshot(buildCurrentSnapshot(overrides)),
    [buildCurrentSnapshot, persistSnapshot],
  );

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (initialWorkspace.status !== 'unavailable') return;
    if (storageNoticeShownRef.current) return;

    storageNoticeShownRef.current = true;
    notify('本地存储不可用，当前修改仅保留在本次会话');
  }, [initialWorkspace.status, notify]);

  useEffect(() => {
    if (!initialWorkspace.shouldPersistInitial) return;
    if (!persistEnabledRef.current) return;

    if (saveWorkspaceSnapshot(initialWorkspace.snapshot)) {
      clearNodePositions();
      clearNodeEdits(getSampleCourseEditKey(defaultSampleCourseId));
    } else {
      handlePersistFailure();
    }
  }, [handlePersistFailure, initialWorkspace]);

  useEffect(() => {
    if (recoveryOpen || !persistEnabled) return;

    const snapshot = buildCurrentSnapshot();
    const timer = window.setTimeout(
      () => persistSnapshot(snapshot),
      WORKSPACE_SAVE_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [
    buildCurrentSnapshot,
    persistEnabled,
    persistSnapshot,
    recoveryOpen,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fitView({ padding: 0.12, maxZoom: 1.05 });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [fitView]);

  useEffect(() => {
    if (plannedBudgetMinutes === budgetMinutes) return;

    const timer = window.setTimeout(
      () => setPlannedBudgetMinutes(budgetMinutes),
      ROUTE_RECALC_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [budgetMinutes, plannedBudgetMinutes]);

  const routePlan = useMemo(
    () => planReviewRoute(createReviewRouteItems(coursePoints), plannedBudgetMinutes),
    [coursePoints, plannedBudgetMinutes],
  );
  const routeStates = useMemo(() => createRouteStateMap(routePlan), [routePlan]);

  useEffect(() => {
    setNodes((currentNodes) => applyRouteStates(currentNodes, routeStates));
  }, [routeStates, setNodes]);

  const fitMapToCanvas = useCallback(() => {
    window.requestAnimationFrame(() => {
      fitView({ padding: 0.12, maxZoom: 1.05, duration: 420 });
    });
  }, [fitView]);

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current === null) return;
    window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
  }, []);

  useEffect(() => clearUndoTimer, [clearUndoTimer]);

  const openUndoWindow = useCallback(
    (
      snapshot: WorkspaceSnapshot,
      message: string,
      detail: string,
    ) => {
      clearUndoTimer();
      undoRunRef.current += 1;
      setUndoState({
        run: undoRunRef.current,
        snapshot,
        message,
        detail,
      });
      undoTimerRef.current = window.setTimeout(() => {
        setUndoState(null);
        undoTimerRef.current = null;
      }, UNDO_WINDOW_MS);
    },
    [clearUndoTimer],
  );

  const applyWorkspaceSnapshot = useCallback(
    (snapshot: WorkspaceSnapshot, selection: string | null) => {
      setWorkspaceId(snapshot.id);
      setWorkspaceKind(snapshot.kind);
      setCoursePoints(snapshot.points);
      setCourseChapters(snapshot.chapters);
      setCourseTitle(snapshot.courseTitle);
      setNoteSource(snapshot.noteSource);
      setActiveSampleCourseId(snapshot.activeSampleCourseId);
      setNodePositions(snapshot.positions);
      setBudgetMinutes(snapshot.budgetMinutes);
      setPlannedBudgetMinutes(snapshot.budgetMinutes);
      setSelectedNodeId(selection);
      setNodes(createWorkspaceNodes(snapshot, selection));

      if (snapshot.points.length > 0) {
        fitMapToCanvas();
      }
    },
    [fitMapToCanvas, setNodes],
  );

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

  const loadSampleCourse = useCallback(
    (coursePackage: SampleCoursePackage) => {
      const snapshot = createSampleSnapshot(coursePackage);
      applyWorkspaceSnapshot(snapshot, getDefaultSelection(snapshot));
      persistSnapshot(snapshot);
      setRecoveryOpen(false);
      setDataDialogOpen(false);
      notify(`已载入「${coursePackage.course.title}」示例课程，可拖动星体调整布局`);
    },
    [applyWorkspaceSnapshot, notify, persistSnapshot],
  );

  const handleLoadSample = useCallback(() => {
    const coursePackage =
      getSampleCoursePackage(activeSampleCourseId) ??
      getSampleCoursePackage(defaultSampleCourseId);

    if (!coursePackage) return;
    if (recoveryOpen) resumePersistence();
    loadSampleCourse(coursePackage);
  }, [activeSampleCourseId, loadSampleCourse, recoveryOpen, resumePersistence]);

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

      notify(
        persistEnabledRef.current
          ? `已更新「${fields.title}」并保存到本机`
          : `已更新「${fields.title}」，当前修改仅保留在本次会话`,
      );
    },
    [notify, setNodes],
  );

  const handleToggleReviewed = useCallback(
    (nodeId: string, reviewed: boolean) => {
      const point = coursePoints.find((candidate) => candidate.id === nodeId);
      if (!point) return;

      setCoursePoints((currentPoints) =>
        currentPoints.map((candidate) =>
          candidate.id === nodeId ? { ...candidate, reviewed } : candidate,
        ),
      );
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === nodeId ? applyNodeReviewed(node, reviewed) : node,
        ),
      );

      const persistSuffix = persistEnabledRef.current
        ? '，已保存到本机'
        : '，当前修改仅保留在本次会话';
      notify(
        reviewed
          ? `已将「${point.title}」标记为已复习${persistSuffix}`
          : `已撤销「${point.title}」的已复习标记${persistSuffix}`,
      );
    },
    [coursePoints, notify, setNodes],
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
    const positions: SavedNodePositions = {};
    setNodePositions(positions);
    setNodes(
      withSelection(
        applyRouteStates(
          createKnowledgeNodes(coursePoints),
          createRouteStates(coursePoints, plannedBudgetMinutes),
        ),
        selectedNodeId,
      ),
    );
    persistCurrentWorkspace({ positions });
    notify('星图布局已恢复');
    fitMapToCanvas();
  }, [
    coursePoints,
    fitMapToCanvas,
    notify,
    persistCurrentWorkspace,
    plannedBudgetMinutes,
    selectedNodeId,
    setNodes,
  ]);

  const handleImportConfirm = useCallback(
    (course: ImportedCourse, mode: ImportMode) => {
      const isAppend = mode === 'append' && coursePoints.length > 0;
      const importSource: NoteSourceSummary = {
        fileName: course.summary.fileName,
        subtitle: '导入笔记 · 仅存本机',
        excerpt: course.summary.excerpt,
        characterCount: course.summary.characterCount,
        kind: 'imported',
      };
      const now = Date.now();
      let snapshot: WorkspaceSnapshot;
      let message: string;

      if (isAppend) {
        const merged = appendImportedCourse(
          {
            points: coursePoints,
            chapters: courseChapters,
            positions: nodePositions,
          },
          course,
        );
        snapshot = createWorkspaceSnapshot({
          id: `imported:${now}`,
          kind: 'imported',
          courseTitle,
          chapters: merged.chapters,
          points: merged.points,
          noteSource: importSource,
          activeSampleCourseId: null,
          positions: merged.positions,
          budgetMinutes,
        });
        message = `已追加 ${course.points.length} 个知识点，原有节点与参数已保留`;
      } else {
        snapshot = createWorkspaceSnapshot({
          id: `imported:${now}`,
          kind: 'imported',
          courseTitle: course.summary.courseTitle,
          chapters: course.chapters,
          points: course.points,
          noteSource: importSource,
          activeSampleCourseId: null,
          positions: {},
          budgetMinutes,
        });
        message = `已导入 ${course.points.length} 个知识点，分值占比等参数待设置`;
      }

      applyWorkspaceSnapshot(snapshot, isAppend ? selectedNodeId : null);
      persistSnapshot(snapshot);
      notify(`${message}，结果仅保存在本机`);
    },
    [
      applyWorkspaceSnapshot,
      budgetMinutes,
      courseChapters,
      coursePoints,
      courseTitle,
      nodePositions,
      notify,
      persistSnapshot,
      selectedNodeId,
    ],
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
    (_event, _node, draggedNodes) => {
      const draggedById = new Map(draggedNodes.map((node) => [node.id, node]));
      const positions = collectNodePositions(
        getNodes().map((node) => draggedById.get(node.id) ?? node),
      );
      setNodePositions(positions);
      persistCurrentWorkspace({ positions });
    },
    [getNodes, persistCurrentWorkspace],
  );

  const handleGenerateRoute = useCallback(() => {
    setRouteAnimationRun((run) => run + 1);
  }, []);

  const handleLocateNode = useCallback(
    (nodeId: string) => {
      const targetNode = getNodes().find((node) => node.id === nodeId);
      if (!targetNode) return;

      handleSelectNode(nodeId);

      const width = targetNode.measured?.width ?? 120;
      const height = targetNode.measured?.height ?? 90;
      const zoom = Math.max(getZoom(), 1.15);
      // 桌面理由抽屉覆盖右侧 480px，右移节点中心让它在剩余画布中居中。
      const drawerOffset =
        window.matchMedia('(min-width: 841px)').matches ? 240 / zoom : 0;

      setCenter(
        targetNode.position.x + width / 2 + drawerOffset,
        targetNode.position.y + height / 2,
        { zoom, duration: 480 },
      );
      notify(`已定位「${targetNode.data.title}」`);
    },
    [getNodes, getZoom, handleSelectNode, notify, setCenter],
  );

  const handleCreateBlank = useCallback(() => {
    if (coursePoints.length === 0) return;
    setClearIntent('blank');
  }, [coursePoints.length]);

  const handleClearWorkspace = useCallback(() => {
    if (coursePoints.length === 0) return;
    setClearIntent('clear');
  }, [coursePoints.length]);

  const handleConfirmClear = useCallback(() => {
    if (!clearIntent) return;

    const intent = clearIntent;
    const source = buildCurrentSnapshot();
    const clearedAt = Date.now();

    if (!saveWorkspaceBackup(source, clearedAt)) {
      persistEnabledRef.current = false;
      setPersistEnabled(false);
      setStorageIssue(STORAGE_BACKUP_FAILURE_MESSAGE);
      notify('无法写入本机备份，已取消清空，当前星图保持不变');
      return;
    }

    const nextBackup: WorkspaceBackup = {
      version: 1,
      clearedAt,
      workspace: source,
    };
    setBackup(nextBackup);
    setBackupCorrupt(false);
    setClearIntent(null);
    if (!persistEnabledRef.current) resumePersistence();

    const blank = createBlankWorkspaceSnapshot();
    applyWorkspaceSnapshot(blank, null);
    persistSnapshot(blank);

    openUndoWindow(
      source,
      intent === 'blank' ? '已新建空白星图' : '已清空当前星图',
      `${source.points.length} 个知识点已移到本机备份`,
    );
  }, [
    applyWorkspaceSnapshot,
    buildCurrentSnapshot,
    clearIntent,
    notify,
    openUndoWindow,
    persistSnapshot,
    resumePersistence,
  ]);

  const handleUndoClear = useCallback(() => {
    if (!undoState) return;

    const snapshot = undoState.snapshot;
    clearUndoTimer();
    setUndoState(null);
    applyWorkspaceSnapshot(snapshot, getDefaultSelection(snapshot));
    persistSnapshot(snapshot);
    notify('已恢复清空前的星图');
  }, [
    applyWorkspaceSnapshot,
    clearUndoTimer,
    notify,
    persistSnapshot,
    undoState,
  ]);

  const handleRestoreBackup = useCallback(() => {
    if (!backup) return;

    clearUndoTimer();
    setUndoState(null);
    setDataDialogOpen(false);
    setRecoveryOpen(false);
    resumePersistence();
    applyWorkspaceSnapshot(backup.workspace, getDefaultSelection(backup.workspace));
    persistSnapshot(backup.workspace);
    notify('已恢复最近一次清空的星图');
  }, [
    applyWorkspaceSnapshot,
    backup,
    clearUndoTimer,
    notify,
    persistSnapshot,
    resumePersistence,
  ]);

  const handleClearAllLocalData = useCallback(() => {
    clearAllLocalWorkspaceData();
    clearUndoTimer();
    setUndoState(null);
    setBackup(null);
    setBackupCorrupt(false);
    setClearIntent(null);
    setDataDialogOpen(false);
    setRecoveryOpen(false);
    resumePersistence();

    const blank = createBlankWorkspaceSnapshot();
    applyWorkspaceSnapshot(blank, null);
    persistSnapshot(blank);
    notify('已清除本机数据，并新建空白星图');
  }, [
    applyWorkspaceSnapshot,
    clearUndoTimer,
    notify,
    persistSnapshot,
    resumePersistence,
  ]);

  const edges = useMemo(
    () => [
      ...createKnowledgeEdges(createKnowledgeNodes(coursePoints), selectedNodeId),
      ...createReviewRouteEdges(routePlan.selectedIds, {
        animated: routeAnimationEnabled,
        animationRun: routeAnimationRun,
      }),
    ],
    [coursePoints, routeAnimationEnabled, routeAnimationRun, routePlan, selectedNodeId],
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

  const courseTag: CourseTag =
    noteSource.kind === 'sample'
      ? '示例'
      : noteSource.kind === 'imported'
        ? '导入'
        : '空白';
  const backupLabel = backup ? formatBackupLabel(backup) : null;
  const workspaceLabel = recoveryOpen
    ? '本机快照损坏'
    : getWorkspaceLabel(workspaceKind, courseTitle);

  return (
    <div className="app-shell">
      <Header
        courseTitle={courseTitle}
        courseTag={courseTag}
        budgetMinutes={budgetMinutes}
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
          importPreviewOpen={isImportPreviewOpen}
          onOpenImportPreview={openImportPreview}
          onCloseImportPreview={closeImportPreview}
          onCreateBlank={handleCreateBlank}
          onClearWorkspace={handleClearWorkspace}
          onManageLocalData={() => setDataDialogOpen(true)}
          storageIssue={storageIssue}
        />
        <KnowledgeGraph
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onSelectNode={handleSelectNode}
          onNodeDragStop={handleNodeDragStop}
          onResetLayout={handleResetLayout}
          onOpenImport={openImportPreview}
          onLoadSample={handleLoadSample}
          lastBackupLabel={backup && !backupCorrupt ? backupLabel : null}
          onRestoreBackup={
            backup && !backupCorrupt ? handleRestoreBackup : undefined
          }
        />
        <DetailPanel
          node={selectedNode}
          chapter={selectedChapter}
          parentNode={parentNode}
          relatedNodes={relatedNodes}
          onSelectNode={handleSelectNode}
          onClearSelection={() => handleSelectNode(null)}
          onSaveNode={handleSaveNode}
          onToggleReviewed={handleToggleReviewed}
          onPreviewNode={handlePreviewNode}
        />
        <ReviewRoute
          nodes={nodes}
          budgetMinutes={budgetMinutes}
          onBudgetChange={setBudgetMinutes}
          animationEnabled={routeAnimationEnabled}
          onAnimationChange={setRouteAnimationEnabled}
          onGenerateRoute={handleGenerateRoute}
          routeNodeCount={routePlan.selectedIds.length}
          decisions={routePlan.decisions}
          routeSelectedIds={routePlan.selectedIds}
          totalBenefit={routePlan.totalBenefit}
          onLocateNode={handleLocateNode}
          onOpenImport={openImportPreview}
          onLoadSample={handleLoadSample}
        />
      </main>

      {toast && <Toast key={toast.id} message={toast.message} />}
      {undoState && (
        <UndoToast
          key={undoState.run}
          message={undoState.message}
          detail={undoState.detail}
          onUndo={handleUndoClear}
        />
      )}

      {clearIntent && noteSource.kind !== 'blank' && (
        <ClearWorkspaceDialog
          nodeCount={coursePoints.length}
          chapterCount={courseChapters.length}
          relationCount={countWorkspaceRelations(coursePoints)}
          noteLabel={noteSource.fileName}
          noteKind={noteSource.kind}
          intent={clearIntent}
          onCancel={() => setClearIntent(null)}
          onConfirm={handleConfirmClear}
        />
      )}

      {(dataDialogOpen || recoveryOpen) && (
        <WorkspaceDataDialog
          mode={recoveryOpen ? 'recovery' : 'manage'}
          workspaceLabel={workspaceLabel}
          backupLabel={backup && !backupCorrupt ? backupLabel : null}
          backupCorrupt={backupCorrupt}
          storageIssue={storageIssue}
          onClose={() => setDataDialogOpen(false)}
          onRestoreBackup={handleRestoreBackup}
          onLoadSample={handleLoadSample}
          onClearAll={handleClearAllLocalData}
        />
      )}
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
