import { useEffect, useState } from 'react';

import { hasTmdb, loadPerson } from '@/lib/api';
import type { Person, Title } from '@/types';

export function usePerson(id: number) {
  const [state, setState] = useState<{
    key: string;
    person?: Person;
    known: Title[];
    failed: boolean;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = `${id}:${attempt}`;
  const enabled = hasTmdb() && !!id;

  useEffect(() => {
    if (!enabled) return;
    let live = true;
    loadPerson(id)
      .then((res) => live && setState({ ...res, key, failed: false }))
      .catch(() => live && setState({ key, known: [], failed: true }));
    return () => {
      live = false;
    };
  }, [id, key, enabled]);

  const current = state?.key === key ? state : null;
  return {
    person: current?.person,
    known: current?.known ?? [],
    loading: enabled && !current,
    failed: current?.failed ?? false,
    retry: () => setAttempt((n) => n + 1),
  };
}
