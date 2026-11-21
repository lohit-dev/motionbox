import { Innertube } from 'youtubei.js/react-native';

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

type YouTubeClient = Awaited<ReturnType<typeof Innertube.create>>;

/** Signed URLs stop working after about six hours and are tied to the device's network. */
const TTL = 4 * 60 * 60 * 1000;
const cache = new Map<string, { stream: Stream; at: number }>();
const inflight = new Map<string, Promise<Stream>>();

let client: Promise<YouTubeClient> | null = null;

/** One shared client: creating it downloads YouTube's player script, which takes a second or two. */
function innertube(): Promise<YouTubeClient> {
  if (!client) {
    client = Innertube.create({ generate_session_locally: true, retrieve_player: false }).catch(
      (error) => {
        client = null;
        if (__DEV__)
          console.error('[youtube] InnerTube initialization failed', error?.stack ?? error);
        throw error;
      }
    );
  }
  return client;
}

async function basicInfo(yt: YouTubeClient, id: string, name: 'IOS' | 'TV' | 'ANDROID' | 'WEB') {
  const info = await yt.getBasicInfo(id, { client: name });
  if (!info?.streaming_data) {
    const reason = info?.playability_status?.reason ?? info?.playability_status?.status;
    throw new Error(
      `YouTube returned no streaming data for ${name}: ${reason ?? 'unknown reason'}`
    );
  }
  return info;
}

/**
 * Clients to try, best first. YouTube treats each one differently and blocks different ones from
 * time to time, so a single failure is expected and the next client usually works.
 */
const CLIENTS = ['IOS', 'TV', 'ANDROID', 'WEB'] as const;

async function fromClient(
  yt: YouTubeClient,
  id: string,
  name: (typeof CLIENTS)[number]
): Promise<Stream> {
  const info = await basicInfo(yt, id, name);
  const status = info?.playability_status;
  if (status && status.status !== 'OK') {
    throw new Error(`${status.status}${status.reason ? `: ${status.reason}` : ''}`);
  }
  // HLS carries video and audio together, adaptive, usually up to 1080p
  const hls: string | undefined = info?.streaming_data?.hls_manifest_url;
  if (hls) return { uri: hls, hls: true };
  // Use direct muxed MP4 formats: youtubei.js needs an external JS interpreter
  // to decipher ciphered URLs in React Native.
  const formats = info.streaming_data?.formats ?? [];
  const directFormats = formats
    .filter(
      (candidate) =>
        candidate.url &&
        candidate.has_audio &&
        candidate.has_video &&
        candidate.mime_type?.startsWith('video/mp4')
    )
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0) || (b.bitrate ?? 0) - (a.bitrate ?? 0));
  const format = directFormats[0];
  const uri: string | undefined = format?.url;
  if (__DEV__) {
    console.log(`[youtube] ${name} direct MP4 formats`, {
      count: directFormats.length,
      selectedItag: format?.itag,
      selectedQuality: format?.quality_label,
    });
  }
  if (!uri) throw new Error(`No direct muxed MP4 format from ${name}`);
  return { uri, hls: false };
}

async function resolve(id: string): Promise<Stream> {
  const yt = await innertube();
  const problems: string[] = [];
  for (const name of CLIENTS) {
    try {
      return await fromClient(yt, id, name);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      problems.push(`${name}: ${message}`);
      if (__DEV__) console.warn(`[youtube] ${name} client failed: ${message}`);
    }
  }
  throw new Error(problems.join(' | '));
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
