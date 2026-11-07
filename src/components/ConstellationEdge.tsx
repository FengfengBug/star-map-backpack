import { getStraightPath, type EdgeProps } from '@xyflow/react';
import type { KnowledgeFlowEdge } from '../types/knowledge';
import { starToneColors } from '../utils/star';
import './ConstellationEdge.css';

export function ConstellationEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps<KnowledgeFlowEdge>) {
  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const color = data?.tone ? starToneColors[data.tone] : '#7eaeff';
  const relation = data?.relation ?? 'parent';
  const isActive = data?.active ?? false;

  return (
    <g
      className={[
        'constellation-edge',
        `constellation-edge--${relation}`,
        isActive ? 'is-active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <path
        d={edgePath}
        className="constellation-edge__halo"
        stroke={color}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={edgePath}
        className="constellation-edge__line"
        stroke={color}
        vectorEffect="non-scaling-stroke"
      />
      {isActive && (
        <circle
          cx={(sourceX + targetX) / 2}
          cy={(sourceY + targetY) / 2}
          r={1.8}
          fill={color}
          className="constellation-edge__beacon"
        />
      )}
    </g>
  );
}
