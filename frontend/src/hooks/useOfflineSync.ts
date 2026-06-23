import { useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { getPendingMovements, markMovementSynced } from '../lib/db';
import { movementsAPI } from '../services/api';
import { useOnlineStatus } from './useOnlineStatus';

export function useOfflineSync() {
  const { enqueueSnackbar } = useSnackbar();
  const isOnline = useOnlineStatus();

  const syncPending = useCallback(async () => {
    const pending = await getPendingMovements();
    if (pending.length === 0) return;

    enqueueSnackbar(`Synchronisation de ${pending.length} mouvement(s) hors ligne...`, { variant: 'info' });
    let synced = 0;

    for (const mv of pending) {
      try {
        const { id, synced: _synced, createdAt: _createdAt, ...payload } = mv;
        await movementsAPI.register(payload);
        if (id !== undefined) await markMovementSynced(id);
        synced++;
      } catch {
        // leave in queue
      }
    }

    if (synced > 0) {
      enqueueSnackbar(`${synced} mouvement(s) synchronisé(s).`, { variant: 'success' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    if (isOnline) {
      syncPending();
    }
  }, [isOnline, syncPending]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_MOVEMENTS') syncPending();
    };
    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleMessage);
  }, [syncPending]);
}
