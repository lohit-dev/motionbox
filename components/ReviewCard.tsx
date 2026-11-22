import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/components/ui/Icon';
import type { Review } from '@/types';

export function ReviewCard({ review }: { review: Review }) {
  return (
    <View className="rounded-card bg-s1 p-4">
      <View className="flex-row items-center gap-3">
        <Avatar name={review.initials} size={36} />
        <View className="flex-1">
          <Text className="text-[14px] text-white font-semibold">{review.user}</Text>
          <Text className="text-[12px] text-t3">{review.when}</Text>
        </View>
        {review.score != null ? (
          <View className="flex-row items-center gap-1">
            <Icon name="star" size={12} />
            <Text className="text-[13px] text-white font-bold">{review.score}/10</Text>
          </View>
        ) : null}
      </View>
      <Text className="mt-3 text-[14.5px] leading-[21px] text-t2">{review.text}</Text>
      {review.likes > 0 ? (
        <View className="mt-3 flex-row items-center gap-1.5">
          <Icon name="thumb" size={14} color="rgba(255,255,255,0.54)" />
          <Text className="text-[12.5px] text-t3">{review.likes} found this helpful</Text>
        </View>
      ) : null}
    </View>
  );
}
