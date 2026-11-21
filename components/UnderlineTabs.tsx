import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { Pressable } from '@/components/ui/Pressable';

interface Tab<T extends string> {
  value: T;
  label: string;
}

interface UnderlineTabsProps<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Text tabs with a hairline underneath, used for Saved / Watching / Watched. */
export function UnderlineTabs<T extends string>({ tabs, value, onChange }: UnderlineTabsProps<T>) {
  return (
    <View className="flex-row gap-6 border-b border-s3 px-gutter">
      {tabs.map((t) => {
        const on = t.value === value;
        return (
          <Pressable
            key={t.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            scale={0.96}
            onPress={() => onChange(t.value)}
            className="pb-3">
            <Text className={`text-[15px] font-semibold ${on ? 'text-white' : 'text-t3'}`}>
              {t.label}
            </Text>
            <View
              className={`absolute -bottom-px left-0 right-0 h-0.5 rounded-full ${on ? 'bg-white' : 'bg-transparent'}`}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
