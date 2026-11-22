import { useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { clamp } from '@/lib/format';

interface ScrubberProps {
  /** 0 to 1 */
  progress: number;
  /** 0 to 1, how far the video is loaded */
  buffered?: number;
  /** Called with 0 to 1 when the finger lifts or taps */
  onSeek: (fraction: number) => void;
}

const KNOB = 14;

/** Thin video scrubber: loaded part, played part and a knob. Drag or tap to seek. */
export function Scrubber({ progress, buffered = 0, onSeek }: ScrubberProps) {
  const [width, setWidth] = useState(1);
  const [drag, setDrag] = useState<number | null>(null);

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => runOnJS(setDrag)(clamp(e.x / width)))
    .onUpdate((e) => runOnJS(setDrag)(clamp(e.x / width)))
    .onEnd((e) => runOnJS(onSeek)(clamp(e.x / width)))
    .onFinalize(() => runOnJS(setDrag)(null));

  const shown = drag ?? clamp(progress);
  return (
    <GestureDetector gesture={gesture}>
      <View
        onLayout={(e) => setWidth(Math.max(1, e.nativeEvent.layout.width))}
        style={{ height: 28, justifyContent: 'center' }}>
        <View style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.28)' }}>
          <View
            style={{
              position: 'absolute',
              height: 3,
              borderRadius: 2,
              width: `${clamp(buffered) * 100}%`,
              backgroundColor: 'rgba(255,255,255,0.4)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              height: 3,
              borderRadius: 2,
              width: `${shown * 100}%`,
              backgroundColor: '#fff',
            }}
          />
        </View>
        <View
          style={{
            position: 'absolute',
            left: shown * width - KNOB / 2,
            width: KNOB,
            height: KNOB,
            borderRadius: KNOB / 2,
            backgroundColor: '#fff',
          }}
        />
      </View>
    </GestureDetector>
  );
}
