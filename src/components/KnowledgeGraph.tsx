import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type OnNodeDrag,
  type OnNodesChange,
} from '@xyflow/react';
import { Move, RotateCcw } from 'lucide-react';
import type { GraphFlowEdge, KnowledgeFlowNode } from '../types/knowledge';
import { ConstellationEdge } from './ConstellationEdge';
import { ReviewRouteEdge } from './ReviewRouteEdge';
import { StarNode } from './StarNode';
import './KnowledgeGraph.css';

const nodeTypes = { knowledge: StarNode };
const edgeTypes = { constellation: ConstellationEdge, reviewRoute: ReviewRouteEdge };

interface KnowledgeGraphProps {
  nodes: KnowledgeFlowNode[];
  edges: GraphFlowEdge[];
  onNodesChange: OnNodesChange<KnowledgeFlowNode>;
  onSelectNode: (nodeId: string | null) => void;
  onNodeDragStop: OnNodeDrag<KnowledgeFlowNode>;
  onResetLayout: () => void;
}

export function KnowledgeGraph({
  nodes,
  edges,
  onNodesChange,
  onSelectNode,
  onNodeDragStop,
  onResetLayout,
}: KnowledgeGraphProps) {
  const relationCount = edges.filter((edge) => edge.type === 'constellation').length;

  return (
    <section className="graph-panel panel" aria-labelledby="graph-heading">
      <header className="graph-header">
        <div>
          <span className="eyebrow">KNOWLEDGE CONSTELLATION</span>
          <div className="graph-header__title-row">
            <h2 id="graph-heading">知识星图</h2>
            <span className="graph-sync">
              <span className="graph-sync__dot" aria-hidden="true" />
              布局自动保存
            </span>
          </div>
        </div>

        <div className="graph-actions">
          <span className="graph-count">
            <strong>{nodes.length}</strong> 颗星
            <span className="graph-count__divider" aria-hidden="true" />
            <strong>{relationCount}</strong> 条关联
          </span>
          <button
            type="button"
            className="graph-reset"
            onClick={onResetLayout}
            title="恢复所有知识点的初始位置"
          >
            <RotateCcw size={13} strokeWidth={1.9} aria-hidden="true" />
            恢复布局
          </button>
        </div>
      </header>

      <div className="graph-canvas">
        <ReactFlow<KnowledgeFlowNode, GraphFlowEdge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={(_, node) => onSelectNode(node.id)}
          onPaneClick={() => onSelectNode(null)}
          onNodeDragStop={onNodeDragStop}
          fitView
          fitViewOptions={{ padding: 0.12, maxZoom: 1.05 }}
          minZoom={0.4}
          maxZoom={1.7}
          nodesConnectable={false}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={30}
            size={1}
            color="rgba(132, 163, 224, 0.14)"
          />
          <Controls showInteractive={false} position="bottom-right" />
        </ReactFlow>

        <div className="graph-legend" role="note" aria-label="星图操作与视觉说明">
          <span className="graph-legend__title">星体编码</span>
          <span className="graph-legend__item">
            <span className="legend-size-scale" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            分值
          </span>
          <span className="graph-legend__divider" aria-hidden="true" />
          <span className="graph-legend__item">
            <span className="legend-brightness" aria-hidden="true" />
            掌握度
          </span>
          <span className="graph-legend__divider" aria-hidden="true" />
          <span className="graph-legend__hint">
            <Move size={11} strokeWidth={1.8} aria-hidden="true" />
            拖拽 / 滚轮缩放
          </span>
        </div>
      </div>
    </section>
  );
}
