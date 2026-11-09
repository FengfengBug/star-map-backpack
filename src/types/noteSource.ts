export interface NoteSourceSummary {
  fileName: string;
  subtitle: string;
  excerpt: string;
  characterCount: number;
  kind: 'sample' | 'imported';
}
