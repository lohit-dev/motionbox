import { useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

interface ScrubberProps {
  /** 0 to 1 */
  progress: number;
  /** 0 to 1, how far the video is loaded */
  buffered?: number;
  /** Called with 0 to 1 when the finger lifts or taps */
  onSeek: (fraction: number) => void;
}

const KNOB = 14;

/** Keep this arithmetic local: gesture callbacks run on the UI runtime. */
function clampFraction(value: number) {
  'worklet';
  return Math.min(1, Math.max(0, value));
}

/** Thin video scrubber: loaded part, played part and a knob. Drag or tap to seek. */
export function Scrubber({ progress, buffered = 0, onSeek }: ScrubberProps) {
  const [width, setWidth] = useState(1);
  const [drag, setDrag] = useState<number | null>(null);

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => runOnJS(setDrag)(clampFraction(e.x / width)))
    .onUpdate((e) => runOnJS(setDrag)(clampFraction(e.x / width)))
    .onEnd((e) => runOnJS(onSeek)(clampFraction(e.x / width)))
    .onFinalize(() => runOnJS(setDrag)(null));

  const shown = drag ?? clampFraction(progress);
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
              width: `${clampFraction(buffered) * 100}%`,
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
