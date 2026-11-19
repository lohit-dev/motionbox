import { Redirect, Tabs } from 'expo-router';

import colors from '@/constants/colors';
import { TabBar } from '@/components/TabBar';
import { useApp } from '@/store/store';

export default function TabsLayout() {
  const onboarded = useApp((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/welcome" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.ink } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="library" />
      <Tabs.Screen name="airing" />
    </Tabs>
  );
}
