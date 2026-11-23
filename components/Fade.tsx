import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import colors from '@/constants/colors';

interface FadeProps {
  /** Which edge is solid ink. The gradient runs to transparent on the other side. */
  from?: 'bottom' | 'top' | 'left';
  /** 0-1: how far the solid colour reaches before it starts to fade */
  hold?: number;
}

/**
 * Long ink fade for heroes. Drawn with an svg gradient, so no extra native module is needed.
 * Place it absolutely over artwork.
 */
export function Fade({ from = 'bottom', hold = 0.12 }: FadeProps) {
  const id = `fade${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const solidAtTop = from === 'top' || from === 'left';
  const sideways = from === 'left';
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2={sideways ? 1 : 0} y2={sideways ? 0 : 1}>
          <Stop offset={0} stopColor={colors.ink} stopOpacity={solidAtTop ? 1 : 0} />
          <Stop
            offset={solidAtTop ? hold : 0.3}
            stopColor={colors.ink}
            stopOpacity={solidAtTop ? 1 : 0}
          />
          <Stop
            offset={solidAtTop ? 0.7 : 1 - hold}
            stopColor={colors.ink}
            stopOpacity={solidAtTop ? 0 : 1}
          />
          <Stop offset={1} stopColor={colors.ink} stopOpacity={solidAtTop ? 0 : 1} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
