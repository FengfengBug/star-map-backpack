import type { LearningRecord } from '../../types/learningRecord';

export interface LearningRecordDay {
  key: string;
  label: string;
  dateLabel: string;
  records: LearningRecord[];
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function getLocalDayStart(timestamp: number) {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatLocalTime(timestamp: number) {
  const date = new Date(timestamp);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function groupLearningRecords(
  records: LearningRecord[],
  now = Date.now(),
): LearningRecordDay[] {
  const groups = new Map<string, LearningRecordDay>();
  const today = getLocalDayStart(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = getLocalDayStart(yesterday.getTime());

  for (const record of [...records].sort((a, b) => b.occurredAt - a.occurredAt)) {
    const date = new Date(record.occurredAt);
    const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const dayStart = getLocalDayStart(record.occurredAt);
    const label =
      dayStart === today ? '今天' : dayStart === yesterdayStart ? '昨天' : `${date.getMonth() + 1}月${date.getDate()}日`;
    const dateLabel = `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
    const group = groups.get(key);

    if (group) {
      group.records.push(record);
    } else {
      groups.set(key, { key, label, dateLabel, records: [record] });
    }
  }

  return [...groups.values()];
}
