import type { StarTone } from '../types/knowledge';

export const starToneColors: Record<StarTone, string> = {
  blue: '#7eaeff',
  cyan: '#63e1da',
  violet: '#b09aff',
  gold: '#f2c86d',
};

export const starToneLabels: Record<StarTone, string> = {
  blue: '蓝色 · 基础',
  cyan: '青色 · 方法',
  violet: '紫色 · 结构',
  gold: '金色 · 重点',
};

const MIN_SCORE_SHARE = 4;
const MAX_SCORE_SHARE = 12;
const MIN_STAR_SIZE = 28;
const MAX_STAR_SIZE = 56;
const PENDING_STAR_SIZE = 32;
const PENDING_STAR_INTENSITY = 0.5;

export function getStarSize(scoreShare: number | null) {
  if (scoreShare === null) return PENDING_STAR_SIZE;

  const clamped = Math.min(Math.max(scoreShare, MIN_SCORE_SHARE), MAX_SCORE_SHARE);
  const ratio = (clamped - MIN_SCORE_SHARE) / (MAX_SCORE_SHARE - MIN_SCORE_SHARE);
  return Math.round(MIN_STAR_SIZE + ratio * (MAX_STAR_SIZE - MIN_STAR_SIZE));
}

export function getStarIntensity(mastery: number | null) {
  if (mastery === null) return PENDING_STAR_INTENSITY;

  return Number((0.46 + (Math.min(Math.max(mastery, 0), 100) / 100) * 0.54).toFixed(2));
}

export function getMasteryLabel(mastery: number) {
  if (mastery >= 85) return '掌握扎实';
  if (mastery >= 70) return '基本熟练';
  if (mastery >= 45) return '仍需巩固';
  return '优先复习';
}

export function formatScoreShare(scoreShare: number | null) {
  return scoreShare === null ? '待设置' : `${scoreShare}%`;
}

export function formatMastery(mastery: number | null) {
  return mastery === null ? '待设置' : `${mastery}%`;
}

export function formatEstimatedMinutes(minutes: number | null) {
  return minutes === null ? '待设置' : `${minutes} min`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function formatReviewWindow(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} 分钟`;
  if (rest === 0) return `${hours} 小时`;
  return `${hours} 小时 ${rest} 分`;
}
