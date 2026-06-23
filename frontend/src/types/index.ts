export type UserRole =
  | 'ADMIN_NATIONAL'
  | 'ADMIN_PROVINCIAL'
  | 'AGENT_DGM'
  | 'AGENT_FRONTALIER_AERIEN'
  | 'AGENT_FRONTALIER_TERRESTRE'
  | 'AGENT_FRONTALIER_MARITIME'
  | 'POLICE_NATIONALE'
  | 'JUSTICE'
  | 'ANR_RENSEIGNEMENT'
  | 'MINISTERE_INTERIEUR'
  | 'AMBASSADE_CONSULAT'
  | 'GOUVERNEMENT_PROVINCIAL'
  | 'AUDITEUR';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  institution?: string;
  province?: string;
  twoFactorEnabled?: boolean;
  lastLogin?: string;
  isActive?: boolean;
}

export interface Passport {
  number: string;
  issueDate: string;
  expiryDate: string;
  issueCountry: string;
}

export type VisaType = 'TOURISME' | 'AFFAIRES' | 'RESIDENCE' | 'DIPLOMATIQUE' | 'TRANSIT' | 'ETUDES' | 'TRAVAIL' | 'AUTRE';
export type ForeignerStatus = 'EN_REGLE' | 'EN_ALERTE' | 'EN_INFRACTION' | 'EXPULSE' | 'BLACKLISTE' | 'INCONNU';
export type PresenceStatus = 'PRESENT' | 'SORTI' | 'INCONNU';

export interface Visa {
  number: string;
  type: VisaType;
  issueDate: string;
  expiryDate: string;
  maxDays: number;
  issuedBy?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
  country?: string;
}

export interface Foreigner {
  _id: string;
  dossierNumber: string;
  lastName: string;
  middleName?: string;
  firstName: string;
  gender: 'M' | 'F' | 'AUTRE';
  dateOfBirth: string;
  placeOfBirth: string;
  nationality: string;
  secondNationality?: string | null;
  passport: Passport;
  visa: Visa;
  photo?: string | null;
  currentStatus: ForeignerStatus;
  presenceStatus: PresenceStatus;
  isBlacklisted: boolean;
  isActive: boolean;
  employer?: string;
  stayPurpose?: string;
  stayPurposeDetails?: string;
  emergencyContacts?: EmergencyContact[];
  totalDaysInRDC: number;
  lastEntryDate?: string | null;
  lastExitDate?: string | null;
  entryCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: Partial<User>;
}

export interface BorderPost {
  _id: string;
  name: string;
  code: string;
  type: 'AERIEN' | 'TERRESTRE' | 'MARITIME';
  province: string;
  isActive: boolean;
}

export interface Movement {
  _id: string;
  foreignerId: Foreigner | string;
  type: 'ENTREE' | 'SORTIE';
  borderPostId: BorderPost | string;
  agentId?: Partial<User>;
  datetime: string;
  transport?: string;
  provenance?: string;
  destination?: string;
  verificationStatus: 'AUTORISE' | 'REFUSE' | 'ALERTE';
  notes?: string;
}

export interface Alert {
  _id: string;
  foreignerId: Foreigner | string;
  type: string;
  severity: 'CRITIQUE' | 'HAUTE' | 'MOYENNE' | 'BASSE';
  message: string;
  status: 'ACTIVE' | 'EN_TRAITEMENT' | 'RESOLUE' | 'IGNOREE';
  isAutomatic: boolean;
  createdAt: string;
}

export interface Infraction {
  _id: string;
  foreignerId: Foreigner | string;
  nature: string;
  description: string;
  status: 'EN_COURS' | 'RESOLUE' | 'APPEL' | 'CLASSEE';
  severity: string;
  isActive: boolean;
  createdAt: string;
}

export interface BlacklistEntry {
  _id: string;
  foreignerId: Foreigner | string;
  passportNumber: string;
  reason: string;
  reasonCategory: string;
  level: 'NATIONAL' | 'INTERPOL' | 'REGIONAL';
  isActive: boolean;
  startDate: string;
  endDate?: string;
  issuedBy?: Partial<User>;
  createdAt: string;
}

export interface Notification {
  _id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: Pagination;
  unreadCount?: number;
}

export interface OfflineMovement {
  id?: number;
  foreignerId: string;
  type: 'ENTREE' | 'SORTIE';
  borderPostId: string;
  transport?: string;
  provenance?: string;
  destination?: string;
  passportScanned?: boolean;
  biometricVerified?: boolean;
  notes?: string;
  createdAt: string;
  synced: boolean;
}
