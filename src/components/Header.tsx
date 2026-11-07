import { Clock3, ShieldCheck } from 'lucide-react';
import { formatReviewWindow } from '../utils/star';
import { StarGlyph } from './StarGlyph';
import './Header.css';

interface HeaderProps {
  courseTitle: string;
  reviewWindowMinutes: number;
}

export function Header({ courseTitle, reviewWindowMinutes }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="brand" aria-label="星图背包">
        <span className="brand__mark" aria-hidden="true">
          <span className="brand__orbit" />
          <StarGlyph tone="cyan" size={22} />
        </span>
        <span className="brand__copy">
          <span className="brand__name">星图背包</span>
          <span className="brand__sub">STAR MAP BACKPACK</span>
        </span>
      </div>

      <span className="topbar__rule" aria-hidden="true" />

      <div className="course-summary">
        <span className="context-label">当前课程</span>
        <span className="course-summary__row">
          <span className="course-summary__title">{courseTitle}</span>
          <span className="demo-tag">示例</span>
        </span>
      </div>

      <span className="topbar__spacer" />

      <div className="review-clock">
        <span className="review-clock__icon" aria-hidden="true">
          <Clock3 size={16} strokeWidth={1.8} />
        </span>
        <span className="review-clock__copy">
          <span className="context-label">剩余复习时间</span>
          <strong>{formatReviewWindow(reviewWindowMinutes)}</strong>
        </span>
      </div>

      <div className="local-state" title="星图位置仅保存在当前浏览器">
        <ShieldCheck size={14} strokeWidth={1.8} aria-hidden="true" />
        <span>数据仅存本机</span>
      </div>
    </header>
  );
}
