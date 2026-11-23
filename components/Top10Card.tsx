import { View } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';

import { Fade } from '@/components/Fade';
import { Poster } from '@/components/Poster';
import { sz } from '@/lib/scale';
import type { Title } from '@/types';

interface Top10CardProps {
  rank: number;
  title: Title;
  onPress?: (title: Title, tag: string) => void;
}

/**
 * A normal poster card with the rank numeral outlined over its bottom left corner. Two dark
 * gradients, one from the left and one from the bottom, keep the numeral readable and make the
 * card sit with the other rows.
 */
export function Top10Card({ rank, title, onPress }: Top10CardProps) {
  const wide = rank >= 10;
  const size = sz(wide ? 74 : 92);
  return (
    <Poster
      title={title}
      onPress={onPress}
      overlay={
        <>
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '78%', opacity: 0.85 }}>
            <Fade from="left" hold={0.05} />
          </View>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%', opacity: 0.9 }}>
            <Fade from="bottom" hold={0.05} />
          </View>
          <Svg
            width={size * (wide ? 1.3 : 0.8)}
            height={size}
            style={{ position: 'absolute', left: sz(2), bottom: sz(4) }}>
            <SvgText
              x={sz(2)}
              y={size * 0.8}
              fill="none"
              stroke="rgba(255,255,255,0.92)"
              strokeWidth={2.5}
              fontFamily="Inter24pt-ExtraBold"
              fontSize={size}
              letterSpacing={wide ? -6 : -3}>
              {String(rank)}
            </SvgText>
          </Svg>
        </>
      }
    />
  );
}
