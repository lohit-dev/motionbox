import { useEffect, useMemo, useState } from 'react';

import { hasTmdb, loadDetail, parseId } from '@/lib/api';
import { useApp } from '@/store/store';
import type { Title, TitleId } from '@/types';

export interface UpdateItem {
  id: TitleId;
  title: Title;
  /** Text after the bold title, for example "S1 · E4 airs tomorrow." */
  text: string;
  /** Short label such as "Today" or "Fri 21 Nov" */
  when: string;
  group: 'today' | 'upcoming' | 'earlier';
  sort: number;
  /** Opens the trailer for titles with a new or upcoming release */
  trailer: boolean;
}

const DAY = 86400000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
};
const label = (ms: number) =>
  new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

/** Updates derived from the real schedule of everything the person saved, watches or set a reminder for. */
export function useUpdates() {
  const saved = useApp((s) => s.saved);
  const watching = useApp((s) => s.watching);
  const reminders = useApp((s) => s.reminders);
  const ids = useMemo(
    () =>
      [...new Set([...reminders, ...watching, ...saved])].filter((id) => parseId(id)).slice(0, 40),
    [saved, watching, reminders]
  );
  const key = ids.join(',');
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(ids.length > 0 && hasTmdb());

  useEffect(() => {
    if (!hasTmdb() || !ids.length) {
      setTitles([]);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    Promise.all(ids.map((id) => loadDetail(id).catch(() => null))).then((all) => {
      if (!live) return;
      setTitles(all.filter((t): t is Title => !!t));
      setLoading(false);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const items = useMemo(() => {
    const today = startOfDay(new Date());
    const out: UpdateItem[] = [];
    for (const t of titles) {
      const next = t.nextEpisode && parse(t.nextEpisode.airDate);
      const last = t.lastEpisode && parse(t.lastEpisode.airDate);
      if (next !== undefined && next >= today && next - today <= 14 * DAY) {
        const when =
          next === today ? 'today' : next === today + DAY ? 'tomorrow' : `on ${label(next)}`;
        out.push({
          id: t.id,
          title: t,
          text: `S${t.nextEpisode!.season} · E${t.nextEpisode!.episode} airs ${when}.`,
          when: next === today ? 'Today' : label(next),
          group: next === today ? 'today' : 'upcoming',
          sort: next,
          trailer: false,
        });
      }
      if (last !== undefined && today - last <= 7 * DAY && last <= today) {
        out.push({
          id: t.id,
          title: t,
          text: `S${t.lastEpisode!.season} · E${t.lastEpisode!.episode} is out now.`,
          when: last === today ? 'Today' : last === today - DAY ? 'Yesterday' : label(last),
          group: last === today ? 'today' : 'earlier',
          sort: last,
          trailer: false,
        });
      }
      if (t.kind === 'movie' && t.releaseDate) {
        const rel = parse(t.releaseDate);
        if (rel > today && rel - today <= 60 * DAY) {
          out.push({
            id: t.id,
            title: t,
            text: `releases ${label(rel)}.`,
            when: label(rel),
            group: 'upcoming',
            sort: rel,
            trailer: !!t.clips?.length,
          });
        } else if (rel <= today && today - rel <= 14 * DAY) {
          out.push({
            id: t.id,
            title: t,
            text: 'is out now.',
            when: rel === today ? 'Today' : label(rel),
            group: rel === today ? 'today' : 'earlier',
            sort: rel,
            trailer: !!t.clips?.length,
          });
        }
      }
    }
    return {
      today: out.filter((u) => u.group === 'today'),
      upcoming: out.filter((u) => u.group === 'upcoming').sort((a, b) => a.sort - b.sort),
      earlier: out.filter((u) => u.group === 'earlier').sort((a, b) => b.sort - a.sort),
    };
  }, [titles]);

  const count = items.today.length + items.upcoming.length + items.earlier.length;
  return { ...items, count, loading };
}
