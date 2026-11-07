import { Compass, Flag, Lock, Route } from 'lucide-react';
import type { KnowledgeFlowNode } from '../types/knowledge';
import { formatDuration } from '../utils/star';
import { sumPendingMinutes } from '../utils/knowledgeGraph';
import './ReviewRoute.css';

interface ReviewRouteProps {
  nodes: KnowledgeFlowNode[];
  reviewWindowMinutes: number;
}

export function ReviewRoute({ nodes, reviewWindowMinutes }: ReviewRouteProps) {
  const pendingNodes = nodes.filter((node) => !node.data.reviewed);
  const pendingMinutes = sumPendingMinutes(nodes);

  return (
    <section className="route-panel panel" aria-labelledby="review-route-heading">
      <div className="route-intro">
        <span className="eyebrow">REVIEW ROUTE</span>
        <div className="route-intro__title">
          <h2 id="review-route-heading">复习航线</h2>
          <span className="route-status">
            <Lock size={9} strokeWidth={2} aria-hidden="true" />
            未生成
          </span>
        </div>
        <p>把有限的时间，留给最值得复习的知识点。</p>
      </div>

      <div className="route-map" role="img" aria-label="复习航线，等待背包算法生成路径">
        <div className="route-map__track" aria-hidden="true">
          <span className="route-map__line" />
          <span className="route-map__stop route-map__stop--start">
            <Compass size={12} strokeWidth={1.8} />
          </span>
          <span className="route-map__waypoint route-map__waypoint--one" />
          <span className="route-map__waypoint route-map__waypoint--two" />
          <span className="route-map__waypoint route-map__waypoint--three" />
          <span className="route-map__stop route-map__stop--end">
            <Flag size={11} strokeWidth={1.8} />
          </span>
        </div>
        <div className="route-map__labels" aria-hidden="true">
          <span>现在</span>
          <span className="route-map__waiting">
            <span className="route-map__waiting-dot" />
            等待规划复习顺序
          </span>
          <span>复习完成</span>
        </div>
      </div>

      <div className="route-side">
        <div className="route-stats">
          <div className="route-stat">
            <span>复习池</span>
            <strong>
              {pendingNodes.length}
              <small> 个</small>
            </strong>
          </div>
          <div className="route-stat">
            <span>待复习</span>
            <strong>{formatDuration(pendingMinutes)}</strong>
          </div>
          <div className="route-stat">
            <span>可用</span>
            <strong>{formatDuration(reviewWindowMinutes)}</strong>
          </div>
        </div>
        <button
          type="button"
          className="route-action"
          disabled
          title="0-1 背包航线规划将在算法阶段接入"
        >
          <Route size={14} strokeWidth={1.8} aria-hidden="true" />
          生成复习航线
          <Lock size={10} strokeWidth={2} aria-hidden="true" />
        </button>
        <p className="route-side__hint">0-1 背包规划将在算法阶段接入</p>
      </div>
    </section>
  );
}
