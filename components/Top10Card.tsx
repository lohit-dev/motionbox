import { View } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';

import { Poster } from '@/components/Poster';
import type { Title } from '@/types';

interface Top10CardProps {
  rank: number;
  title: Title;
  onPress?: (title: Title, tag: string) => void;
}

const POSTER = 104;
/** Part of the numeral that overlaps the poster's left edge */
const TUCK = 22;
const NUMERAL = 132;
/** Distance from the top of the numeral box down to the digits' baseline */
const BASELINE = Math.round(NUMERAL * 0.78);

/**
 * Outlined rank numeral in front of the poster's left edge, standing on the poster's bottom
 * edge, like the design. The numeral is positioned, not laid out beside the poster, so every
 * card is the same size and the row lines up whatever the digit count.
 */
export function Top10Card({ rank, title, onPress }: Top10CardProps) {
  const slot = rank >= 10 ? 142 : 86;
  return (
    <View style={{ width: slot - TUCK + POSTER, paddingLeft: slot - TUCK }}>
      <Poster title={title} width={POSTER} onPress={onPress} />
      <Svg
        pointerEvents="none"
        width={slot}
        height={BASELINE + 8}
        style={{ position: 'absolute', left: 0, top: POSTER * 1.5 - BASELINE }}>
        <SvgText
          x={slot - 4}
          y={BASELINE}
          textAnchor="end"
          fill="none"
          stroke="rgba(255,255,255,0.88)"
          strokeWidth={3.5}
          fontFamily="Inter24pt-ExtraBold"
          fontSize={NUMERAL}
          letterSpacing={rank >= 10 ? -10 : -4}>
          {String(rank)}
        </SvgText>
      </Svg>
    </View>
  );
}
