import { View } from 'react-native';

import { Poster } from '@/components/Poster';
import { Text } from '@/components/ui/Text';
import type { Title } from '@/types';

interface Top10CardProps {
  rank: number;
  title: Title;
  onPress?: (title: Title, tag: string) => void;
}

const POSTER = 104;
/** Part of the numeral that sits behind the poster */
const TUCK = 18;
const NUMERAL = 118;

/**
 * Big rank numeral behind the left edge of the poster, sitting on the poster's bottom edge.
 * The numeral is positioned, not laid out beside the poster, so every card is exactly the same
 * size and the whole row lines up whatever the digit count.
 */
export function Top10Card({ rank, title, onPress }: Top10CardProps) {
  const wide = rank >= 10;
  const slot = wide ? 118 : 70;
  return (
    <View style={{ width: slot - TUCK + POSTER, paddingLeft: slot - TUCK }}>
      <Text
        numberOfLines={1}
        className="absolute text-white"
        style={{
          left: 0,
          // Bottom of the numeral lines up with the bottom of the poster art (3:2 poster, 2 text rows)
          top: POSTER * 1.5 - NUMERAL * 0.8,
          width: slot,
          fontFamily: 'Geist-ExtraBold',
          fontSize: NUMERAL,
          lineHeight: NUMERAL,
          letterSpacing: wide ? -10 : -6,
          includeFontPadding: false,
        }}>
        {rank}
      </Text>
      <Poster title={title} width={POSTER} onPress={onPress} />
    </View>
  );
}
