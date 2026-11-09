import type { ParsedNoteSection } from '../types/parsedNote';

const HEADING_PATTERN = /^ {0,3}(#{1,6})[ \t]+(\S.*)$/;
const FENCE_PATTERN = /^ {0,3}(`{3,}|~{3,})/;

interface HeadingFrame {
  title: string;
  level: number;
}

function trimBlankLines(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start].trim() === '') {
    start += 1;
  }

  while (end > start && lines[end - 1].trim() === '') {
    end -= 1;
  }

  return lines.slice(start, end);
}

export function parseNote(text: string): ParsedNoteSection[] {
  if (text.trim() === '') {
    return [];
  }

  const lines = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const sections: ParsedNoteSection[] = [];
  const headingStack: HeadingFrame[] = [];
  const preambleLines: string[] = [];

  let currentSection: ParsedNoteSection | null = null;
  let currentLines: string[] = [];
  let fenceCharacter: string | null = null;

  const appendLine = (line: string) => {
    if (currentSection) {
      currentLines.push(line);
    } else {
      preambleLines.push(line);
    }
  };

  const flushSection = () => {
    if (!currentSection) {
      return;
    }

    currentSection.content = trimBlankLines(currentLines).join('\n');
    currentLines = [];
  };

  for (const line of lines) {
    const fenceMatch = line.match(FENCE_PATTERN);

    if (fenceCharacter) {
      appendLine(line);
      if (fenceMatch && fenceMatch[1][0] === fenceCharacter) {
        fenceCharacter = null;
      }
      continue;
    }

    if (fenceMatch) {
      fenceCharacter = fenceMatch[1][0];
      appendLine(line);
      continue;
    }

    const headingMatch = line.match(HEADING_PATTERN);

    if (headingMatch) {
      const title = headingMatch[2].replace(/\s+#+\s*$/, '').trim();

      if (title !== '') {
        flushSection();

        const level = headingMatch[1].length;

        while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
          headingStack.pop();
        }

        currentSection = {
          title,
          content: '',
          level,
          parentTitle: headingStack.length > 0 ? headingStack[headingStack.length - 1].title : null,
        };
        sections.push(currentSection);
        headingStack.push({ title, level });
        continue;
      }
    }

    appendLine(line);
  }

  flushSection();

  const preamble = trimBlankLines(preambleLines).join('\n');
  if (preamble !== '') {
    sections.unshift({
      title: '',
      content: preamble,
      level: 0,
      parentTitle: null,
    });
  }

  return sections;
}
