import { describe, expect, it } from 'vitest';
import type { StarTone } from '../types/knowledge';
import { sampleCoursePackages } from './sampleCourses';

const STAR_TONES: StarTone[] = ['blue', 'cyan', 'violet', 'gold'];

describe('sample course packages', () => {
  it('keeps both sample courses available', () => {
    expect(sampleCoursePackages.map((coursePackage) => coursePackage.id)).toEqual([
      'data-structures',
      'computer-organization',
    ]);
  });

  for (const coursePackage of sampleCoursePackages) {
    describe(coursePackage.course.title, () => {
      it('contains 12 to 16 knowledge points and four chapters', () => {
        expect(coursePackage.points.length).toBeGreaterThanOrEqual(12);
        expect(coursePackage.points.length).toBeLessThanOrEqual(16);
        expect(coursePackage.chapters).toHaveLength(4);
      });

      it('uses unique ids and valid internal references', () => {
        const ids = new Set(coursePackage.points.map((point) => point.id));
        const chapterIds = new Set(coursePackage.chapters.map((chapter) => chapter.id));

        expect(ids.size).toBe(coursePackage.points.length);

        for (const point of coursePackage.points) {
          if (point.parentId) expect(ids.has(point.parentId)).toBe(true);
          if (point.chapterId) expect(chapterIds.has(point.chapterId)).toBe(true);
          expect(STAR_TONES).toContain(point.tone);
          expect(Number.isFinite(point.position.x)).toBe(true);
          expect(Number.isFinite(point.position.y)).toBe(true);

          for (const relatedId of point.relatedIds) {
            expect(relatedId).not.toBe(point.id);
            expect(ids.has(relatedId)).toBe(true);
          }
        }
      });

      it('has complete editable parameters and a score share total of 100', () => {
        const scoreTotal = coursePackage.points.reduce(
          (total, point) => total + (point.scoreShare ?? 0),
          0,
        );

        expect(scoreTotal).toBe(100);

        for (const point of coursePackage.points) {
          expect(point.title.trim()).not.toBe('');
          expect(point.content.trim()).not.toBe('');
          expect(point.scoreShare).toBeGreaterThan(0);
          expect(point.mastery).toBeGreaterThanOrEqual(0);
          expect(point.mastery).toBeLessThanOrEqual(100);
          expect(point.estimatedMinutes).toBeGreaterThan(0);
        }
      });
    });
  }
});
