import type { CSSProperties } from 'react';
import type { StarTone } from '../types/knowledge';
import './StarGlyph.css';

interface StarGlyphProps {
  tone: StarTone;
  size?: number;
  className?: string;
}

export function StarGlyph({ tone, size = 24, className = '' }: StarGlyphProps) {
  return (
    <span
      className={`star-glyph tone-${tone} ${className}`.trim()}
      style={{ width: size, height: size } as CSSProperties}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" focusable="false">
        <path
          className="star-glyph__main"
          d="M50 2C53.8 33.6 66.4 46.2 98 50C66.4 53.8 53.8 66.4 50 98C46.2 66.4 33.6 53.8 2 50C33.6 46.2 46.2 33.6 50 2Z"
        />
        <path
          className="star-glyph__inner"
          d="M50 18C52.3 38 62 47.7 82 50C62 52.3 52.3 62 50 82C47.7 62 38 52.3 18 50C38 47.7 47.7 38 50 18Z"
        />
        <circle className="star-glyph__core" cx="50" cy="50" r="3.6" />
      </svg>
    </span>
  );
}
