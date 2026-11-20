/**
 * Resolves a YouTube video id to a URL that expo-video can play.
 *
 * Uses youtubei.js, which talks to YouTube's private API. That is against YouTube's terms and
 * can stop working whenever YouTube changes something, so callers must handle failure and fall
 * back to opening the video in YouTube (see app/player/[key].tsx).
 */

export interface Stream {
  uri: string;
  /** HLS manifest (adaptive, up to 1080p) rather than a single muxed file */
  hls: boolean;
}

// Loosely typed on purpose: the shape of youtubei.js differs a little between major versions.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Innertube = any;

/** Signed URLs stop working after about six hours and are tied to the device's network. */
const TTL = 4 * 60 * 60 * 1000;
const cache = new Map<string, { stream: Stream; at: number }>();
const inflight = new Map<string, Promise<Stream>>();

let client: Promise<Innertube> | null = null;

/** One shared client: creating it downloads YouTube's player script, which takes a second or two. */
function innertube(): Promise<Innertube> {
  if (!client) {
    // Imported lazily so the library only loads when a trailer is actually played
    client = import('youtubei.js/react-native')
      .then(({ Innertube, UniversalCache }) =>
        Innertube.create({ cache: new UniversalCache(false), generate_session_locally: true })
      )
      .catch((error) => {
        client = null;
        throw error;
      });
  }
  return client;
}

/** getBasicInfo takes the client name either as an option or as a plain argument, by version. */
async function basicInfo(yt: Innertube, id: string, name: 'IOS' | 'WEB') {
  try {
    const info = await yt.getBasicInfo(id, { client: name });
    if (info?.streaming_data) return info;
  } catch {}
  return yt.getBasicInfo(id, name);
}

async function resolve(id: string): Promise<Stream> {
  const yt = await innertube();

  // The iOS client returns an HLS manifest with video and audio together and no cipher to solve
  try {
    const info = await basicInfo(yt, id, 'IOS');
    const hls: string | undefined = info?.streaming_data?.hls_manifest_url;
    if (hls) return { uri: hls, hls: true };
  } catch {}

  // Otherwise the best muxed mp4 (usually 360p or 720p), which holds both tracks in one file
  const info = await basicInfo(yt, id, 'WEB');
  const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
  const uri: string | undefined = format?.url ?? (await format?.decipher(yt.session.player));
  if (!uri) throw new Error('No playable stream');
  return { uri, hls: false };
}

export async function resolveStream(id: string): Promise<Stream> {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < TTL) return hit.stream;
  let pending = inflight.get(id);
  if (!pending) {
    pending = resolve(id)
      .then((stream) => {
        cache.set(id, { stream, at: Date.now() });
        return stream;
      })
      .finally(() => inflight.delete(id));
    inflight.set(id, pending);
  }
  return pending;
}

/** Start the slow part early, for example when a detail screen opens. Never throws. */
export const warmUpYouTube = () => {
  innertube().catch(() => {});
};
