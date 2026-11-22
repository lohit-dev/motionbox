import { Image, View } from 'react-native';

import { Mark } from '@/components/Mark';
import { Text } from '@/components/ui/Text';
import { genreLine, hasScore } from '@/lib/format';
import { imageUrl } from '@/lib/tmdb';
import type { Person, Title } from '@/types';

/** Card size in points. It is captured at 3x, so the image is 1080 by 1350. */
export const CARD_W = 360;
export const CARD_H = 450;

interface CardProps {
  /** Called when the artwork has loaded, or failed to */
  onReady: () => void;
}

/** "Coming 16 Dec" for what hasn't released, "Out now" for what has */
function status(title: Title) {
  if (!title.releaseDate) return title.kind === 'series' ? 'Series' : 'Movie';
  const out = new Date(title.releaseDate).getTime() <= Date.now();
  const day = title.released.slice(0, title.released.lastIndexOf(' '));
  return out ? 'Out now' : `Coming ${day}`;
}

function Shell({ children, art, onReady }: CardProps & { children: React.ReactNode; art: string | null }) {
  return (
    <View
      collapsable={false}
      style={{ width: CARD_W, height: CARD_H, backgroundColor: '#0B0B0A', overflow: 'hidden' }}>
      {art ? (
        <Image
          source={{ uri: art }}
          onLoad={onReady}
          onError={onReady}
          resizeMode="cover"
          style={{ position: 'absolute', top: 0, left: 0, width: CARD_W, height: CARD_H }}
        />
      ) : null}
      {/* Darkens the top for the brand row and melts the bottom into the text */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(0,0,0,0.35)' }}
      />
      <View
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 290, backgroundColor: 'rgba(11,11,10,0.62)' }}
      />
      <View
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 190, backgroundColor: 'rgba(11,11,10,0.82)' }}
      />
      <View style={{ position: 'absolute', top: 20, left: 20, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Mark size={26} />
        <Text className="text-[17px] font-extrabold tracking-tighter text-white">motion.</Text>
      </View>
      {children}
    </View>
  );
}

/** The poster card people share: artwork, title, score and when it comes out. */
export function TitleCard({ title, onReady }: CardProps & { title: Title }) {
  return (
    <Shell art={imageUrl(title.posterPath, 'w780')} onReady={onReady}>
      <View
        style={{
          position: 'absolute',
          top: 18,
          right: 20,
          paddingHorizontal: 12,
          height: 30,
          borderRadius: 15,
          backgroundColor: '#fff',
          justifyContent: 'center',
        }}>
        <Text className="text-[12.5px] font-bold text-ink">{status(title)}</Text>
      </View>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: 22 }}>
        <Text numberOfLines={2} className="text-[34px] font-extrabold tracking-tighter text-white" style={{ lineHeight: 36 }}>
          {title.name}
        </Text>
        <Text className="mt-2 text-[13.5px] font-medium text-t2">
          {[hasScore(title) ? `★ ${title.score.toFixed(1)}` : '', genreLine(title), title.runtime]
            .filter(Boolean)
            .join('  ·  ')}
        </Text>
        {title.tagline || title.story ? (
          <Text numberOfLines={2} className="mt-2.5 text-[13px] leading-[18px] text-t3">
            {title.tagline || title.story}
          </Text>
        ) : null}
        <View style={{ marginTop: 16, height: 1, backgroundColor: 'rgba(255,255,255,0.16)' }} />
        <Text className="mt-3 text-[12px] font-medium text-t3">Watch the trailer on Motion Box</Text>
      </View>
    </Shell>
  );
}

/** Same card for a person: their photo, name and the three numbers from their page. */
export function PersonCard({ person, onReady }: CardProps & { person: Person }) {
  const stats: [string, string][] = [
    [String(person.titleCount), 'Titles'],
    [person.avgScore ? person.avgScore.toFixed(1) : '—', 'Avg score'],
    [person.career ? `${person.career}y` : '—', 'Career'],
  ];
  return (
    <Shell art={imageUrl(person.photoPath, 'w780')} onReady={onReady}>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: 22 }}>
        <Text numberOfLines={2} className="text-[34px] font-extrabold tracking-tighter text-white" style={{ lineHeight: 36 }}>
          {person.name}
        </Text>
        {person.line ? <Text className="mt-1.5 text-[13.5px] font-medium text-t2">{person.line}</Text> : null}
        <View style={{ marginTop: 16, flexDirection: 'row', gap: 28 }}>
          {stats.map(([value, label]) => (
            <View key={label}>
              <Text className="text-[20px] font-extrabold text-white">{value}</Text>
              <Text className="text-[11.5px] text-t3">{label}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 16, height: 1, backgroundColor: 'rgba(255,255,255,0.16)' }} />
        <Text className="mt-3 text-[12px] font-medium text-t3">Find their work on Motion Box</Text>
      </View>
    </Shell>
  );
}
