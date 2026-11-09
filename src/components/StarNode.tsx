import { memo, type CSSProperties } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { KnowledgeFlowNode } from '../types/knowledge';
import {
  formatMastery,
  formatScoreShare,
  getStarIntensity,
  getStarSize,
} from '../utils/star';
import './StarNode.css';

const handleStyle: CSSProperties = {
  top: 35,
  left: '50%',
  width: 1,
  height: 1,
  minWidth: 0,
  minHeight: 0,
  border: 0,
  borderRadius: '50%',
  background: 'transparent',
  opacity: 0,
  pointerEvents: 'none',
  transform: 'translate(-50%, -50%)',
};

function StarNodeComponent({ data, selected, dragging }: NodeProps<KnowledgeFlowNode>) {
  const starSize = getStarSize(data.scoreShare);
  const intensity = getStarIntensity(data.mastery);
  const nodeStyle = {
    '--star-size': `${starSize}px`,
    '--star-intensity': intensity,
  } as CSSProperties;

  return (
    <div
      className={[
        'star-node',
        `tone-${data.tone}`,
        selected ? 'is-selected' : '',
        dragging ? 'is-dragging' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={nodeStyle}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} style={handleStyle} />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        style={handleStyle}
      />

      <span className="star-node__visual" aria-hidden="true">
        <span className="star-node__halo" />
        <span className="star-node__orbit" />
        <svg className="star-node__glyph" viewBox="0 0 100 100" focusable="false">
          <path
            className="star-node__star-soft"
            transform="rotate(45 50 50)"
            d="M50 15C52.7 36.4 63.6 47.3 85 50C63.6 52.7 52.7 63.6 50 85C47.3 63.6 36.4 52.7 15 50C36.4 47.3 47.3 36.4 50 15Z"
          />
          <path
            className="star-node__star"
            d="M50 3C53.7 33.3 66.7 46.3 97 50C66.7 53.7 53.7 66.7 50 97C46.3 66.7 33.3 53.7 3 50C33.3 46.3 46.3 33.3 50 3Z"
          />
          <circle className="star-node__fuel" cx="50" cy="50" r="3.3" />
        </svg>
        <span className="star-node__selection-orbit" />
      </span>

      <span
        className="star-node__label"
        title={`${data.title} · 分值占比 ${formatScoreShare(data.scoreShare)} · 掌握度 ${formatMastery(data.mastery)}`}
      >
        <span className="star-node__title">{data.title}</span>
        {data.reviewed && <span className="star-node__reviewed-dot" aria-hidden="true" />}
      </span>
    </div>
  );
}

// 编辑预览只替换当前节点 data，其余节点无需跟随重渲染。
export const StarNode = memo(
  StarNodeComponent,
  (previous, next) =>
    previous.data === next.data &&
    previous.selected === next.selected &&
    previous.dragging === next.dragging,
);
