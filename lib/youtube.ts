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
  /** Resolutions YouTube reports for this source. */
  qualities: StreamQuality[];
  width?: number;
  height?: number;
}

/** The video was reachable, but none of its exposed formats are portrait. */
export class PortraitStreamUnavailableError extends Error {
  constructor(message = 'YouTube video has no portrait stream') {
    super(message);
    this.name = 'PortraitStreamUnavailableError';
  }
}

export type StreamQuality = 'auto' | `${number}p`;

export function streamQualities(heights: number[]): StreamQuality[] {
  return [...new Set(heights.filter((height) => Number.isFinite(height) && height > 0))]
    .map(Math.round)
    .sort((a, b) => a - b)
    .map((height) => `${height}p` as StreamQuality);
}

export function qualityHeight(quality: StreamQuality): number | undefined {
  if (quality === 'auto') return undefined;
  const height = Number.parseInt(quality, 10);
  return Number.isFinite(height) && height > 0 ? height : undefined;
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

const shortDimension = (format: { width?: number; height?: number }) =>
  Math.min(format.width ?? format.height ?? 0, format.height ?? format.width ?? 0);
const isPortrait = (format: { width?: number; height?: number }) =>
  !!format.width && !!format.height && format.height > format.width;

/**
 * Clients to try, best first. YouTube treats each one differently and blocks different ones from
 * time to time, so a single failure is expected and the next client usually works.
 */
// Android has consistently returned a playable muxed stream in the app. Try it first so each
// trailer avoids the noisy, commonly blocked iOS and TV attempts; retain the others as fallback.
const CLIENTS = ['ANDROID', 'IOS', 'TV', 'WEB'] as const;

async function fromClient(
  yt: YouTubeClient,
  id: string,
  name: (typeof CLIENTS)[number],
  preferDirect = false,
  maxHeight?: number,
  portraitOnly = false
): Promise<Stream> {
  const info = await basicInfo(yt, id, name);
  const status = info?.playability_status;
  if (status && status.status !== 'OK') {
    throw new Error(`${status.status}${status.reason ? `: ${status.reason}` : ''}`);
  }
  const hls: string | undefined = info?.streaming_data?.hls_manifest_url;
  const adaptivePortrait = (info.streaming_data?.adaptive_formats ?? []).filter(
    (format) => format.has_video && isPortrait(format)
  );
  if (hls && !preferDirect && (!portraitOnly || adaptivePortrait.length)) {
    const dimensions = adaptivePortrait[0];
    return {
      uri: hls,
      hls: true,
      qualities: streamQualities(adaptivePortrait.map(shortDimension)),
      width: dimensions?.width,
      height: dimensions?.height,
    };
  }
  const formats = info.streaming_data?.formats ?? [];
  const allDirectFormats = formats
    .filter(
      (candidate) =>
        candidate.url &&
        candidate.has_audio &&
        candidate.has_video &&
        candidate.mime_type?.startsWith('video/mp4')
    )
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0) || (b.bitrate ?? 0) - (a.bitrate ?? 0));
  const directFormats = portraitOnly ? allDirectFormats.filter(isPortrait) : allDirectFormats;
  // youtubei.js needs an external JS interpreter to decipher ciphered URLs in React Native.
  const directQualities = streamQualities(directFormats.map(shortDimension));
  const cappedFormats = maxHeight
    ? directFormats.filter((candidate) => shortDimension(candidate) <= maxHeight)
    : directFormats;
  const format = cappedFormats[0] ?? (maxHeight ? directFormats.at(-1) : undefined);
  const uri: string | undefined = format?.url;
  if (uri)
    return {
      uri,
      hls: false,
      qualities: directQualities,
      width: format?.width,
      height: format?.height,
    };
  if (hls && (!portraitOnly || adaptivePortrait.length)) {
    const dimensions = adaptivePortrait[0];
    return {
      uri: hls,
      hls: true,
      qualities: streamQualities(adaptivePortrait.map(shortDimension)),
      width: dimensions?.width,
      height: dimensions?.height,
    };
  }
  if (
    portraitOnly &&
    (allDirectFormats.length > 0 || hls || (info.streaming_data?.adaptive_formats?.length ?? 0) > 0)
  ) {
    throw new PortraitStreamUnavailableError();
  }
  throw new Error(`No HLS stream or direct muxed MP4 format from ${name}`);
}

async function resolve(
  id: string,
  preferDirect: boolean,
  maxHeight?: number,
  portraitOnly = false
): Promise<Stream> {
  const yt = await innertube();
  const problems: string[] = [];
  let confirmedNoPortrait = false;
  for (const name of CLIENTS) {
    try {
      return await fromClient(yt, id, name, preferDirect, maxHeight, portraitOnly);
    } catch (error) {
      if (error instanceof PortraitStreamUnavailableError) confirmedNoPortrait = true;
      const message = error instanceof Error ? error.message : String(error);
      problems.push(`${name}: ${message}`);
    }
  }
  if (portraitOnly && confirmedNoPortrait) throw new PortraitStreamUnavailableError();
  throw new Error(problems.join(' | '));
}

export async function resolveStream(
  id: string,
  options: { preferDirect?: boolean; quality?: StreamQuality; portraitOnly?: boolean } = {}
): Promise<Stream> {
  const preferDirect = options.preferDirect ?? false;
  const portraitOnly = options.portraitOnly ?? false;
  const quality = options.quality ?? 'auto';
  const maxHeight = qualityHeight(quality);
  const cacheKey = `${id}:${preferDirect ? 'direct' : 'adaptive'}:${quality}:${portraitOnly ? 'portrait' : 'any'}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL) return hit.stream;
  let pending = inflight.get(cacheKey);
  if (!pending) {
    pending = resolve(id, preferDirect, maxHeight, portraitOnly)
      .then((stream) => {
        cache.set(cacheKey, { stream, at: Date.now() });
        return stream;
      })
      .finally(() => inflight.delete(cacheKey));
    inflight.set(cacheKey, pending);
  }
  return pending;
}

/** Start the slow part early, for example when a detail screen opens. Never throws. */
export const warmUpYouTube = () => {
  innertube().catch(() => {});
};
