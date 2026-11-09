import type { ChapterDefinition, KnowledgePoint } from '../types/knowledge';
import {
  computerOrganizationChapters,
  computerOrganizationCourse,
  computerOrganizationKnowledgePoints,
  computerOrganizationNote,
} from './computerOrganizationCourse';
import {
  chapters,
  sampleCourse,
  sampleKnowledgePoints,
  sampleNote,
} from './sampleCourse';

export type SampleCourseId = 'data-structures' | 'computer-organization';

export interface SampleCoursePackage {
  id: SampleCourseId;
  description: string;
  course: {
    title: string;
    subtitle: string;
    reviewWindowMinutes: number;
  };
  note: {
    fileName: string;
    excerpt: string;
    characterCount: number;
    updatedLabel: string;
  };
  chapters: ChapterDefinition[];
  points: KnowledgePoint[];
}

export const defaultSampleCourseId: SampleCourseId = 'data-structures';

export const sampleCoursePackages: SampleCoursePackage[] = [
  {
    id: 'data-structures',
    description: '从线性结构出发，串联树、图与经典算法，侧重复杂度与算法思想。',
    course: sampleCourse,
    note: sampleNote,
    chapters,
    points: sampleKnowledgePoints,
  },
  {
    id: 'computer-organization',
    description: '从数据表示出发，串联运算器、指令系统、存储层次与总线 I/O。',
    course: computerOrganizationCourse,
    note: computerOrganizationNote,
    chapters: computerOrganizationChapters,
    points: computerOrganizationKnowledgePoints,
  },
];

export function getSampleCoursePackage(id: string | null) {
  if (!id) return null;
  return sampleCoursePackages.find((coursePackage) => coursePackage.id === id) ?? null;
}
