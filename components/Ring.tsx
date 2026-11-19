import { Text, View } from 'react-native';

import { PosterArt } from '@/components/PosterArt';
import { Pressable } from '@/components/ui/Pressable';
import type { Title } from '@/types';

interface RingProps {
  title: Title;
  seen?: boolean;
  onPress?: (title: Title) => void;
}

/** Story ring: white outline while there is something new, grey once seen. */
export function Ring({ title, seen = false, onPress }: RingProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title.name} trailer`}
      scale={0.92}
      onPress={() => onPress?.(title)}
      className="items-center"
      style={{ width: 72 }}>
      <View
        className={`items-center justify-center rounded-full border-2 ${seen ? 'border-s3' : 'border-white'}`}
        style={{ width: 70, height: 70 }}>
        <PosterArt title={title} width={60} height={60} radius={30} size="w185" bordered={false} />
      </View>
      <Text numberOfLines={1} className="mt-1.5 text-[11.5px] font-medium text-t2">
        {title.name.split(' ')[0]}
      </Text>
    </Pressable>
  );
}
