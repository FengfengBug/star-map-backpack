import type { CSSProperties } from 'react';

type BackdropTone = 'blue' | 'cyan' | 'violet' | 'gold';

interface BackdropStar {
  left: string;
  top: string;
  size: number;
  opacity: number;
  tone: BackdropTone;
}

const tones: BackdropTone[] = ['blue', 'cyan', 'violet', 'blue', 'gold'];

const stars: BackdropStar[] = Array.from({ length: 48 }, (_, index) => ({
  left: `${(index * 47 + 9) % 100}%`,
  top: `${(index * 29 + 13) % 100}%`,
  size: index % 13 === 0 ? 2.5 : index % 5 === 0 ? 1.6 : 1,
  opacity: 0.15 + ((index * 7) % 36) / 100,
  tone: tones[index % tones.length],
}));

export function StarBackdrop() {
  return (
    <div className="star-backdrop" aria-hidden="true">
      <span className="star-backdrop__haze star-backdrop__haze--top" />
      <span className="star-backdrop__haze star-backdrop__haze--bottom" />
      {stars.map((star, index) => (
        <span
          key={`${star.left}-${star.top}-${index}`}
          className={`star-backdrop__star tone-${star.tone}`}
          style={
            {
              left: star.left,
              top: star.top,
              '--dot-size': `${star.size}px`,
              '--dot-opacity': star.opacity,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
