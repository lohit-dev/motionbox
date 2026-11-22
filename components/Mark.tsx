import Svg, { G, Path, Rect } from 'react-native-svg';

/**
 * The Motion Box mark: an M in a white box, with a play button under its point. Drawn from the
 * same shapes as assets/icon.png, so the launch screen and the app icon match.
 */
export function Mark({ size = 120, ink = '#0B0B0A' }: { size?: number; ink?: string }) {
  return (
    <Svg width={size} height={size} viewBox="172 172 680 680">
      <Rect x={172} y={172} width={680} height={680} rx={168} fill="#fff" />
      <G transform="translate(0 46)">
        <Path
          d="M342 704V332l170 170 170-170v372"
          fill="none"
          stroke={ink}
          strokeWidth={82}
          strokeLinejoin="miter"
          strokeMiterlimit={10}
        />
        <Path
          d="M486 606l62 34-62 34z"
          fill={ink}
          stroke={ink}
          strokeWidth={14}
          strokeLinejoin="round"
          transform="translate(0 12)"
        />
      </G>
    </Svg>
  );
}
