import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { PosterArt } from '@/components/PosterArt';
import { Pressable } from '@/components/ui/Pressable';
import { sz } from '@/lib/scale';
import { useIsShortWatched } from '@/store/store';
import type { Title } from '@/types';

interface RingProps {
  title: Title;
  onPress?: (title: Title) => void;
}

/** Short label: no leading article, nothing after a colon, so rings read The Odyssey as Odyssey */
const storyLabel = (name: string) =>
  name
    .replace(/^(the|a|an)\s+/i, '')
    .split(/[:\-–]/)[0]
    .trim() || name;

/** Story ring: white outline while there is something new, grey once seen. */
export const Ring = memo(function Ring({ title, onPress }: RingProps) {
  const seen = useIsShortWatched(title.id);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title.name} trailer`}
      scale={0.92}
      onPress={() => {
        onPress?.(title);
      }}
      className="items-center"
      style={{ width: sz(72) }}>
      <View
        className={`items-center justify-center rounded-full border-2 ${seen ? 'border-s3' : 'border-white'}`}
        style={{ width: sz(70), height: sz(70) }}>
        <PosterArt title={title} width={sz(60)} height={sz(60)} radius={sz(30)} size="w342" bordered={false} />
      </View>
      <Text numberOfLines={1} className="mt-1.5 text-[11.5px] text-t2 font-medium">
        {storyLabel(title.name)}
      </Text>
    </Pressable>
  );
});
