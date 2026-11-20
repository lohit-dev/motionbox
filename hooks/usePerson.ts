import { useEffect, useState } from 'react';

import { hasTmdb, loadPerson } from '@/lib/api';
import type { Person, Title } from '@/types';

export function usePerson(id: number) {
  const [state, setState] = useState<{
    person?: Person;
    known: Title[];
    loading: boolean;
    failed: boolean;
  }>({ known: [], loading: hasTmdb(), failed: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!hasTmdb() || !id) return;
    let live = true;
    setState((s) => ({ ...s, loading: true, failed: false }));
    loadPerson(id)
      .then((res) => live && setState({ ...res, loading: false, failed: false }))
      .catch(() => live && setState({ known: [], loading: false, failed: true }));
    return () => {
      live = false;
    };
  }, [id, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
