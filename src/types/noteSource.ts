export type NoteSourceKind = 'sample' | 'imported' | 'blank';

export interface NoteSourceSummary {
  fileName: string;
  subtitle: string;
  excerpt: string;
  characterCount: number;
  kind: NoteSourceKind;
}
