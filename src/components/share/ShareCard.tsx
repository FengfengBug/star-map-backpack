import { forwardRef, useId } from 'react';
import type { StarTone } from '../../types/knowledge';
import { formatDuration, starToneColors } from '../../utils/star';
import {
  formatShareCardDate,
  truncateShareText,
  type ShareCardModel,
  type ShareCardNode,
} from './shareCardModel';

interface ShareCardProps {
  model: ShareCardModel;
  generatedAt: number;
}

const WIDTH = 1080;
const HEIGHT = 1350;
const FONT_SANS = "'Noto Sans SC', 'Microsoft YaHei UI', 'PingFang SC', sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Cascadia Mono', Consolas, monospace";
const PAPER = '#fffdf8';
const TEXT = '#202a36';
const SOFT = '#53606c';
const MUTED = '#6b7278';
const LINE = '#dedbd3';
const GOLD = '#aa812f';

function toneColor(tone: StarTone) {
  return starToneColors[tone];
}

export const ShareCard = forwardRef<SVGSVGElement, ShareCardProps>(function ShareCard(
  { model, generatedAt },
  ref,
) {
  const instanceId = useId().replaceAll(':', '');
  const gradientId = `share-paper-${instanceId}`;
  const titleId = `share-title-${instanceId}`;
  const descriptionId = `share-description-${instanceId}`;
  const visibleSelected = model.selected.slice(0, 5);
  const remainingSelected = model.selected.slice(5);
  const rowCount = visibleSelected.length + (remainingSelected.length > 0 ? 1 : 0);
  const rowHeight = remainingSelected.length > 0 ? 75 : 90;
  const routeTop = 548;
  const visibleSkipped = model.skipped.slice(0, 2);
  const remainingSkippedCount = Math.max(0, model.skipped.length - visibleSkipped.length);
  const remainingMinutes = remainingSelected.reduce((total, node) => total + node.minutes, 0);
  const remainingBenefit = remainingSelected.reduce((total, node) => total + node.benefit, 0);
  const supplementary = [
    remainingSkippedCount > 0 ? `另有 ${remainingSkippedCount} 个未纳入节点` : null,
    model.pendingCount > 0 ? `${model.pendingCount} 个参数待处理` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const renderNodeRow = (node: ShareCardNode, index: number) => {
    const centerY = routeTop + index * rowHeight + rowHeight / 2;
    const isLast = index === rowCount - 1 && remainingSelected.length === 0;

    return (
      <g key={node.id}>
        <line
          x1={98}
          x2={98}
          y1={index === 0 ? centerY : routeTop + index * rowHeight}
          y2={isLast ? centerY : routeTop + (index + 1) * rowHeight}
          stroke={GOLD}
          strokeWidth={3}
          opacity={0.42}
        />
        <circle cx={98} cy={centerY} r={27} fill={PAPER} stroke={GOLD} strokeWidth={3} />
        <text
          x={98}
          y={centerY + 9}
          fill={GOLD}
          fontFamily={FONT_MONO}
          fontSize={27}
          textAnchor="middle"
        >
          {index + 1}
        </text>
        <circle cx={151} cy={centerY} r={9} fill={toneColor(node.tone)} />
        <text
          x={176}
          y={centerY + 11}
          fill={TEXT}
          fontFamily={FONT_SANS}
          fontSize={33}
          fontWeight={500}
        >
          {truncateShareText(node.title, 14)}
        </text>
        <text
          x={1008}
          y={centerY - 4}
          fill={TEXT}
          fontFamily={FONT_MONO}
          fontSize={28}
          textAnchor="end"
        >
          {node.minutes} min
        </text>
        <text
          x={1008}
          y={centerY + 31}
          fill={MUTED}
          fontFamily={FONT_SANS}
          fontSize={25}
          textAnchor="end"
        >
          收益 {Math.round(node.benefit)}
        </text>
        {!isLast && (
          <line
            x1={140}
            x2={1008}
            y1={routeTop + (index + 1) * rowHeight}
            y2={routeTop + (index + 1) * rowHeight}
            stroke={LINE}
            strokeWidth={2}
          />
        )}
      </g>
    );
  };

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>{`${model.courseTitle}复习航线分享卡`}</title>
      <desc id={descriptionId}>
        本轮预算 {model.budgetMinutes} 分钟，选中 {model.selected.length} 个知识点，预计{' '}
        {model.totalMinutes} 分钟；仅含航线摘要，不含笔记全文。
      </desc>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={GOLD} stopOpacity={0.075} />
          <stop offset="0.42" stopColor={GOLD} stopOpacity={0} />
        </linearGradient>
      </defs>

      <rect width={WIDTH} height={HEIGHT} rx={48} fill={PAPER} />
      <rect width={WIDTH} height={HEIGHT} rx={48} fill={`url(#${gradientId})`} />
      <rect
        x={2}
        y={2}
        width={WIDTH - 4}
        height={HEIGHT - 4}
        rx={46}
        fill="none"
        stroke={LINE}
        strokeWidth={3}
      />
      <rect
        x={23}
        y={23}
        width={WIDTH - 46}
        height={HEIGHT - 46}
        rx={32}
        fill="none"
        stroke={LINE}
        strokeWidth={2}
        opacity={0.62}
      />

      <g transform="translate(72 62)">
        <path
          d="m24 0 6.5 14.6 15.8 1.2-12.2 10.3 3.8 15.3L24 33.1 10.1 41.4l3.8-15.3L1.7 15.8l15.8-1.2L24 0Z"
          fill="none"
          stroke={GOLD}
          strokeWidth={3.2}
          strokeLinejoin="round"
        />
        <text x={58} y={34} fill={TEXT} fontFamily={FONT_SANS} fontSize={34} fontWeight={500}>
          星图背包
        </text>
      </g>

      <rect x={682} y={57} width={328} height={56} rx={28} fill="none" stroke={LINE} strokeWidth={2} />
      <text x={846} y={94} fill={SOFT} fontFamily={FONT_SANS} fontSize={27} textAnchor="middle">
        {model.sourceLabel}
      </text>

      <text x={70} y={169} fill={MUTED} fontFamily={FONT_SANS} fontSize={29} letterSpacing={1.2}>
        {truncateShareText(`${model.courseTitle} · 本轮复习`, 24)}
      </text>
      <text x={70} y={262} fill={TEXT} fontFamily={FONT_SANS} fontSize={72} fontWeight={500}>
        本轮复习航线
      </text>
      <text x={70} y={320} fill={SOFT} fontFamily={FONT_SANS} fontSize={31}>
        按当前参数与时间预算，安排这一轮优先级。
      </text>

      <rect x={70} y={329} width={940} height={137} rx={30} fill="#222e38" />
      <line x1={438} x2={438} y1={353} y2={442} stroke="#ffffff" strokeOpacity={0.14} strokeWidth={2} />
      <line x1={724} x2={724} y1={353} y2={442} stroke="#ffffff" strokeOpacity={0.14} strokeWidth={2} />
      <text x={102} y={378} fill="#bdc6cc" fontFamily={FONT_SANS} fontSize={27}>
        本轮预算
      </text>
      <text x={102} y={435} fill="#f8f7f1" fontFamily={FONT_MONO} fontSize={45} fontWeight={500}>
        {formatDuration(model.budgetMinutes)}
      </text>
      <text x={470} y={378} fill="#bdc6cc" fontFamily={FONT_SANS} fontSize={27}>
        选中节点
      </text>
      <text x={470} y={435} fill="#f8f7f1" fontFamily={FONT_MONO} fontSize={45} fontWeight={500}>
        {model.selected.length} <tspan fontFamily={FONT_SANS} fontSize={27}>站</tspan>
      </text>
      <text x={756} y={378} fill="#bdc6cc" fontFamily={FONT_SANS} fontSize={27}>
        未纳入
      </text>
      <text x={756} y={435} fill="#f8f7f1" fontFamily={FONT_MONO} fontSize={45} fontWeight={500}>
        {model.skipped.length} <tspan fontFamily={FONT_SANS} fontSize={27}>个</tspan>
      </text>

      <text x={70} y={520} fill={TEXT} fontFamily={FONT_SANS} fontSize={31} fontWeight={500}>
        复习顺序
      </text>
      <text x={1010} y={520} fill={MUTED} fontFamily={FONT_SANS} fontSize={26} textAnchor="end">
        预计 {model.totalMinutes} min · 总收益 {Math.round(model.totalBenefit)}
      </text>

      {visibleSelected.map(renderNodeRow)}
      {remainingSelected.length > 0 && (
        <g>
          {(() => {
            const index = visibleSelected.length;
            const centerY = routeTop + index * rowHeight + rowHeight / 2;
            return (
              <>
                <line
                  x1={98}
                  x2={98}
                  y1={routeTop + index * rowHeight}
                  y2={centerY}
                  stroke={GOLD}
                  strokeWidth={3}
                  opacity={0.42}
                />
                <circle cx={98} cy={centerY} r={27} fill={GOLD} />
                <text
                  x={98}
                  y={centerY + 8}
                  fill="#ffffff"
                  fontFamily={FONT_MONO}
                  fontSize={22}
                  textAnchor="middle"
                >
                  +{remainingSelected.length}
                </text>
                <circle cx={151} cy={centerY} r={9} fill={GOLD} />
                <text x={176} y={centerY + 11} fill={TEXT} fontFamily={FONT_SANS} fontSize={31} fontWeight={500}>
                  另有 {remainingSelected.length} 个选中节点
                </text>
                <text x={1008} y={centerY - 4} fill={TEXT} fontFamily={FONT_MONO} fontSize={28} textAnchor="end">
                  {remainingMinutes} min
                </text>
                <text x={1008} y={centerY + 31} fill={MUTED} fontFamily={FONT_SANS} fontSize={25} textAnchor="end">
                  收益 {Math.round(remainingBenefit)}
                </text>
              </>
            );
          })()}
        </g>
      )}
      {model.selected.length === 0 && (
        <text x={70} y={626} fill={MUTED} fontFamily={FONT_SANS} fontSize={30}>
          当前还没有选中航线，请先在应用内调整预算或参数。
        </text>
      )}

      <line x1={70} x2={1010} y1={1008} y2={1008} stroke={LINE} strokeWidth={2} strokeDasharray="8 10" />
      <text x={70} y={1052} fill={TEXT} fontFamily={FONT_SANS} fontSize={30} fontWeight={500}>
        本轮暂未纳入
      </text>
      <text x={1010} y={1052} fill={MUTED} fontFamily={FONT_SANS} fontSize={25} textAnchor="end">
        当前预算下的组合取舍
      </text>

      {visibleSkipped.map((node, index) => {
        const x = index === 0 ? 70 : 554;
        const right = index === 0 ? 520 : 1010;
        return (
          <g key={node.id}>
            <line x1={x} x2={x} y1={1080} y2={1168} stroke={LINE} strokeWidth={5} />
            <text x={x + 20} y={1110} fill={TEXT} fontFamily={FONT_SANS} fontSize={28} fontWeight={500}>
              {truncateShareText(node.title, 8)}
            </text>
            <text x={right} y={1110} fill={MUTED} fontFamily={FONT_MONO} fontSize={23} textAnchor="end">
              {node.minutes} min · {Math.round(node.benefit)}
            </text>
            <text x={x + 20} y={1156} fill={SOFT} fontFamily={FONT_SANS} fontSize={25}>
              {node.reason}
            </text>
          </g>
        );
      })}
      {model.skipped.length === 0 && (
        <text x={70} y={1124} fill={SOFT} fontFamily={FONT_SANS} fontSize={27}>
          当前预算已覆盖所有可参与规划的知识点。
        </text>
      )}
      {supplementary && (
        <text x={70} y={1214} fill={MUTED} fontFamily={FONT_SANS} fontSize={24}>
          {supplementary}，完整参数与理由请在应用内查看。
        </text>
      )}

      <g transform="translate(70 1250)" fill="none" stroke={MUTED} strokeWidth={2.6}>
        <rect x={0} y={10} width={30} height={23} rx={5} />
        <path d="M7 10V6a8 8 0 0 1 16 0v4" />
      </g>
      <text x={115} y={1275} fill={MUTED} fontFamily={FONT_SANS} fontSize={24}>
        本机参数生成 · 不含笔记全文
      </text>
      <text x={1010} y={1275} fill={MUTED} fontFamily={FONT_MONO} fontSize={24} textAnchor="end">
        {formatShareCardDate(generatedAt)}
      </text>
    </svg>
  );
});
