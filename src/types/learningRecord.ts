export type LearningRecordCategory = 'review' | 'route';
export type LearningRecordKind = 'reviewed' | 'unreviewed' | 'replanned' | 'undo';

export interface LearningRecordNode {
  id: string;
  title: string;
}

export interface LearningRecord {
  id: string;
  occurredAt: number;
  category: LearningRecordCategory;
  kind: LearningRecordKind;
  nodeId: string | null;
  nodeTitle: string | null;
  summary: string;
  details: string[];
  removed: LearningRecordNode[];
  added: LearningRecordNode[];
  mastery: number | null;
  previousMastery: number | null;
  nextMastery: number | null;
  previousMinutes: number | null;
  nextMinutes: number | null;
}
