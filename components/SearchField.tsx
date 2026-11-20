import { Text, TextInput, View } from 'react-native';

import colors from '@/constants/colors';
import { Icon } from '@/components/ui/Icon';
import { Pressable } from '@/components/ui/Pressable';

interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress?: () => void;
  onSubmit?: () => void;
  /** Number of active filters, shown as a badge on the filter button */
  badge?: number;
  placeholder?: string;
}

export function SearchField({
  value,
  onChangeText,
  onFilterPress,
  onSubmit,
  badge = 0,
  placeholder = 'Movies, series, people',
}: SearchFieldProps) {
  return (
    <View className="flex-row items-center gap-2.5 px-gutter">
      <View className="h-12 flex-1 flex-row items-center gap-2.5 rounded-full bg-s1 px-4">
        <Icon name="search" size={18} color={colors.t3} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.t3}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          autoCorrect={false}
          selectionColor={colors.white}
          className="flex-1 text-base text-white"
        />
        {value ? (
          <Pressable
            accessibilityLabel="Clear search"
            onPress={() => onChangeText('')}
            scale={0.85}>
            <Icon name="clear" size={18} color={colors.t3} />
          </Pressable>
        ) : null}
      </View>
      {onFilterPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filters"
          onPress={onFilterPress}
          scale={0.92}
          className="size-12 items-center justify-center rounded-full bg-s1">
          <Icon name="filter" size={20} />
          {badge ? (
            <View className="absolute -right-0.5 -top-0.5 h-5 w-5 items-center justify-center rounded-full bg-white">
              <Text className="text-[11px] font-bold text-ink">{badge}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}
