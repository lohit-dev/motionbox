import { Text, View, type ViewInstance } from 'react-native';

import { Poster } from '@/components/Poster';
import type { Title } from '@/types';

interface Top10CardProps {
  rank: number;
  title: Title;
  onPress?: (title: Title, art: ViewInstance | null) => void;
}

/** Big rank numeral tucked behind the left edge of the poster. */
export function Top10Card({ rank, title, onPress }: Top10CardProps) {
  return (
    <View className="flex-row items-end" style={{ width: 168 }}>
      <Text
        className="font-extrabold text-white/90"
        style={{
          fontSize: 96,
          lineHeight: 96,
          letterSpacing: -6,
          marginRight: -14,
          marginBottom: 44,
          width: 64,
          textAlign: 'right',
        }}>
        {rank}
      </Text>
      <Poster title={title} width={104} onPress={onPress} />
    </View>
  );
}
