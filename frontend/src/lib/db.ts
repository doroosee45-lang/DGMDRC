import Dexie, { type Table } from 'dexie';
import type { OfflineMovement } from '../types';

interface CachedForeigner {
  id: string;
  dossierNumber: string;
  lastName: string;
  firstName: string;
  nationality: string;
  photo?: string | null;
  currentStatus: string;
  updatedAt: string;
}

class DGMDatabase extends Dexie {
  offlineMovements!: Table<OfflineMovement, number>;
  cachedForeigners!: Table<CachedForeigner, string>;

  constructor() {
    super('DGM_SIMN');
    this.version(1).stores({
      offlineMovements: '++id, foreignerId, type, createdAt, synced',
      cachedForeigners: 'id, dossierNumber, updatedAt',
    });
  }
}

export const db = new DGMDatabase();

export const queueOfflineMovement = async (movement: Omit<OfflineMovement, 'id' | 'createdAt' | 'synced'>) => {
  return db.offlineMovements.add({
    ...movement,
    createdAt: new Date().toISOString(),
    synced: false,
  });
};

export const getPendingMovements = () => {
  return db.offlineMovements.where('synced').equals(0).toArray();
};

export const markMovementSynced = (id: number) => {
  return db.offlineMovements.update(id, { synced: true });
};

export const cacheForeigners = async (foreigners: CachedForeigner[]) => {
  await db.cachedForeigners.bulkPut(foreigners);
};

export const getCachedForeigners = () => {
  return db.cachedForeigners.orderBy('updatedAt').reverse().limit(100).toArray();
};
