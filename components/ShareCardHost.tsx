import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { PersonCard, TitleCard, CARD_H, CARD_W } from '@/components/ShareCard';
import { registerShareHost, shareFallback, type ShareRequest } from '@/lib/share';

/**
 * Draws the share card off screen, waits for its artwork, turns it into a PNG and opens the
 * share sheet with it. Mounted once at the root; screens call shareTitle() / sharePerson().
 */
export function ShareCardHost() {
  const [request, setRequest] = useState<ShareRequest | null>(null);
  const card = useRef<View>(null);
  const busy = useRef(false);

  useEffect(() => {
    registerShareHost((r) => {
      if (!busy.current) setRequest(r);
    });
    return () => registerShareHost(null);
  }, []);

  const capture = useCallback(async (r: ShareRequest) => {
    busy.current = true;
    try {
      // One frame so the artwork is painted before the picture is taken
      await new Promise((done) => setTimeout(done, 80));
      const uri = await captureRef(card, {
        format: 'png',
        quality: 1,
        width: CARD_W * 3,
        height: CARD_H * 3,
        result: 'tmpfile',
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' });
      } else {
        await shareFallback(r);
      }
    } catch {
      await shareFallback(r).catch(() => undefined);
    } finally {
      busy.current = false;
      setRequest(null);
    }
  }, []);

  // Wait for the artwork, but never hang on a slow connection
  const done = useRef(false);
  useEffect(() => {
    done.current = false;
    if (!request) return;
    const t = setTimeout(() => {
      if (!done.current) {
        done.current = true;
        capture(request);
      }
    }, 4000);
    return () => clearTimeout(t);
  }, [request, capture]);

  const onReady = useCallback(() => {
    if (!request || done.current) return;
    done.current = true;
    capture(request);
  }, [request, capture]);

  if (!request) return null;
  return (
    <View
      ref={card}
      collapsable={false}
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: -CARD_W * 3, width: CARD_W, height: CARD_H }}>
      {request.kind === 'title' ? (
        <TitleCard title={request.title} onReady={onReady} />
      ) : (
        <PersonCard person={request.person} onReady={onReady} />
      )}
    </View>
  );
}
