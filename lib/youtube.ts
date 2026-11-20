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
        console.warn('[trailer] could not start youtubei.js:', error);
        throw error;
      });
  }
  return client;
}

/** getBasicInfo takes the client name either as an option or as a plain argument, by version. */
async function basicInfo(yt: Innertube, id: string, name: string) {
  try {
    const info = await yt.getBasicInfo(id, { client: name });
    if (info?.streaming_data) return info;
  } catch {}
  return yt.getBasicInfo(id, name);
}

/**
 * Clients to try, best first. YouTube treats each one differently and blocks different ones from
 * time to time, so a single failure is expected and the next client usually works.
 */
const CLIENTS = ['IOS', 'TV', 'ANDROID', 'WEB'];

async function fromClient(yt: Innertube, id: string, name: string): Promise<Stream> {
  const info = await basicInfo(yt, id, name);
  const status = info?.playability_status;
  if (status && status.status !== 'OK') {
    throw new Error(`${status.status}${status.reason ? `: ${status.reason}` : ''}`);
  }
  // HLS carries video and audio together, adaptive, usually up to 1080p
  const hls: string | undefined = info?.streaming_data?.hls_manifest_url;
  if (hls) return { uri: hls, hls: true };
  // Otherwise the best single file holding both tracks (usually 360p or 720p)
  const format = info.chooseFormat({ type: 'video+audio', quality: 'best' });
  const uri: string | undefined = format?.url ?? (await format?.decipher(yt.session.player));
  if (!uri) throw new Error('No playable format');
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
      console.warn(`[trailer] ${name} client failed for ${id}: ${message}`);
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
