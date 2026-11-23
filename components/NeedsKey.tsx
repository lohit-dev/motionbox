import { View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';

/** Shown when no TMDB key is configured, instead of any placeholder content. */
export function NeedsKey() {
  return (
    <View className="flex-1 justify-center">
      <EmptyState
        title="Add your TMDB key"
        body="Put EXPO_PUBLIC_TMDB_TOKEN in a .env file, then restart with bunx expo start -c."
      />
    </View>
  );
}
