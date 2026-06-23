export interface OfflineMovement {
  id?: number;
  foreignerId: string;
  type: 'ENTREE' | 'SORTIE' | 'TRANSIT';
  borderPostId: string;
  transport?: {
    mode: string;
    reference?: string;
    operator?: string;
  };
  provenance?: string;
  destination?: string;
  notes?: string;
  createdAt: string;
  synced: boolean;
}
