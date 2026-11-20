import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircleButton } from '@/components/ui/CircleButton';
import { Pill } from '@/components/ui/Pill';
import { openOnYouTube } from '@/lib/trailer';
import { resolveStream } from '@/lib/youtube';

type State = { phase: 'loading' } | { phase: 'ready'; uri: string } | { phase: 'failed' };

/** Full-screen trailer player. Plays the clip with expo-video and falls back to YouTube if it can't. */
export default function Player() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setState({ phase: 'loading' });
    resolveStream(key)
      .then((stream) => live && setState({ phase: 'ready', uri: stream.uri }))
      .catch(() => live && setState({ phase: 'failed' }));
    return () => {
      live = false;
    };
  }, [key, attempt]);

  const player = useVideoPlayer(state.phase === 'ready' ? { uri: state.uri } : null, (p) => {
    p.play();
  });

  // A stream that resolves but won't decode still ends up on the fallback screen
  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status }) => {
      if (status === 'error') setState({ phase: 'failed' });
    });
    return () => sub.remove();
  }, [player]);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-black">
      {state.phase === 'ready' ? (
        <VideoView
          player={player}
          style={{ width: '100%', aspectRatio: 16 / 9 }}
          contentFit="contain"
          nativeControls
          allowsPictureInPicture
        />
      ) : state.phase === 'loading' ? (
        <ActivityIndicator color="#fff" size="large" />
      ) : (
        <View className="items-center px-10">
          <Text className="text-center text-xl font-bold text-white">Can't play this here</Text>
          <Text className="mt-2 text-center text-[14.5px] leading-5 text-t2">
            The trailer didn't load in the app. You can try again or watch it on YouTube.
          </Text>
          <View className="mt-6 flex-row gap-3">
            <Pill title="Try again" tone="ghost" onPress={() => setAttempt((n) => n + 1)} />
            <Pill title="Open YouTube" icon="play" onPress={() => openOnYouTube(key)} />
          </View>
        </View>
      )}
      <View className="absolute right-5" style={{ top: Platform.OS === 'ios' ? 16 : top + 8 }}>
        <CircleButton icon="close" label="Close" size={40} tone="glass" onPress={close} />
      </View>
    </View>
  );
}
