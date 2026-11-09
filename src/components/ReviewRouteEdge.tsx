import type { CSSProperties } from 'react';
import { getBezierPath, type EdgeProps } from '@xyflow/react';
import type { ReviewRouteFlowEdge } from '../types/knowledge';
import './ReviewRouteEdge.css';

export function ReviewRouteEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<ReviewRouteFlowEdge>) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.24,
  });
  const animated = data?.animated ?? false;

  return (
    <g
      className={`route-edge ${animated ? 'is-animated' : 'is-static'}`}
      style={{ '--route-delay': `${data?.delayMs ?? 0}ms` } as CSSProperties}
      aria-hidden="true"
    >
      <path
        d={edgePath}
        className="route-edge__halo"
        pathLength={1}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={edgePath}
        className="route-edge__line"
        pathLength={1}
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}
