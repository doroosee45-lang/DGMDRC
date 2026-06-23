require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const BorderPost = require('../models/BorderPost');
const Foreigner = require('../models/Foreigner');
const Movement = require('../models/Movement');
const Infraction = require('../models/Infraction');
const Alert = require('../models/Alert');
const Blacklist = require('../models/Blacklist');
const CorrectionRequest = require('../models/CorrectionRequest');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dgm_simn';

// ─── UTILISATEURS ─────────────────────────────────────────────────────────────
const users = [
  { name: 'Admin National DGM', email: 'admin@dgm.gouv.cd', password: 'DGM@2026!', role: 'ADMIN_NATIONAL', institution: 'DGM - Direction Nationale', province: 'Kinshasa' },
  { name: 'Admin Provincial Kinshasa', email: 'admin.kinshasa@dgm.gouv.cd', password: 'DGM@2026!', role: 'ADMIN_PROVINCIAL', institution: 'DGM - Province de Kinshasa', province: 'Kinshasa' },
  { name: 'Agent DGM Kinshasa', email: 'agent@dgm.gouv.cd', password: 'DGM@2026!', role: 'AGENT_DGM', institution: 'DGM - Bureau Kinshasa', province: 'Kinshasa' },
  { name: 'Agent Aéroport N\'Djili', email: 'frontalier.aerien@dgm.gouv.cd', password: 'DGM@2026!', role: 'AGENT_FRONTALIER_AERIEN', institution: 'Aéroport International de N\'Djili', province: 'Kinshasa' },
  { name: 'Agent Kasumbalesa', email: 'frontalier.terrestre@dgm.gouv.cd', password: 'DGM@2026!', role: 'AGENT_FRONTALIER_TERRESTRE', institution: 'Poste Frontalier Kasumbalesa', province: 'Haut-Katanga' },
  { name: 'Agent Police Nationale', email: 'police@pnc.gouv.cd', password: 'DGM@2026!', role: 'POLICE_NATIONALE', institution: 'Police Nationale Congolaise - DIG', province: 'Kinshasa' },
  { name: 'Agent Justice', email: 'justice@justice.gouv.cd', password: 'DGM@2026!', role: 'JUSTICE', institution: 'Ministère de la Justice', province: 'Kinshasa' },
  { name: 'Agent ANR', email: 'anr@anr.gouv.cd', password: 'DGM@2026!', role: 'ANR_RENSEIGNEMENT', institution: 'Agence Nationale de Renseignement', province: 'Kinshasa' },
  { name: 'Ministère de l\'Intérieur', email: 'ministre@interieur.gouv.cd', password: 'DGM@2026!', role: 'MINISTERE_INTERIEUR', institution: 'Ministère de l\'Intérieur', province: 'Kinshasa' },
  { name: 'Ambassade France', email: 'visa@ambassade-france.cd', password: 'DGM@2026!', role: 'AMBASSADE_CONSULAT', institution: 'Ambassade de France en RDC', province: 'Kinshasa' },
  { name: 'Auditeur Système', email: 'auditeur@dgm.gouv.cd', password: 'DGM@2026!', role: 'AUDITEUR', institution: 'Inspection Générale DGM', province: 'Kinshasa' },
];

// ─── POSTES FRONTALIERS ────────────────────────────────────────────────────────
const borderPosts = [
  { code: 'AERO-KINSHASA', name: 'Aéroport International de N\'Djili', type: 'AERIEN', province: 'Kinshasa', coordinates: { latitude: -4.3857, longitude: 15.4446 }, offlineCapable: false },
  { code: 'AERO-LUBUMBASHI', name: 'Aéroport de Lubumbashi', type: 'AERIEN', province: 'Haut-Katanga', coordinates: { latitude: -11.5913, longitude: 27.5308 }, offlineCapable: false },
  { code: 'AERO-GOMA', name: 'Aéroport de Goma', type: 'AERIEN', province: 'Nord-Kivu', coordinates: { latitude: -1.6708, longitude: 29.2385 }, offlineCapable: false },
  { code: 'TERRE-KASUMBALESA', name: 'Kasumbalesa (frontière Zambie)', type: 'TERRESTRE', province: 'Haut-Katanga', coordinates: { latitude: -12.2217, longitude: 27.8017 }, offlineCapable: true },
  { code: 'TERRE-KASINDI', name: 'Kasindi (frontière Ouganda)', type: 'TERRESTRE', province: 'Nord-Kivu', coordinates: { latitude: 0.0503, longitude: 29.7028 }, offlineCapable: true },
  { code: 'TERRE-ARU', name: 'Aru (frontière Ouganda/Soudan)', type: 'TERRESTRE', province: 'Ituri', coordinates: { latitude: 2.8496, longitude: 30.8408 }, offlineCapable: true },
  { code: 'TERRE-DILOLO', name: 'Dilolo (frontière Angola)', type: 'TERRESTRE', province: 'Lualaba', coordinates: { latitude: -10.6953, longitude: 22.3517 }, offlineCapable: true },
  { code: 'MARIT-MATADI', name: 'Port de Matadi', type: 'MARITIME', province: 'Kongo-Central', coordinates: { latitude: -5.8167, longitude: 13.4500 }, offlineCapable: false },
  { code: 'MARIT-KINSHASA', name: 'Port de Kinshasa (Beach)', type: 'MARITIME', province: 'Kinshasa', coordinates: { latitude: -4.3202, longitude: 15.3212 }, offlineCapable: false },
  { code: 'MARIT-BOMA', name: 'Port de Boma', type: 'MARITIME', province: 'Kongo-Central', coordinates: { latitude: -5.8500, longitude: 13.0500 }, offlineCapable: false },
];

// ─── ÉTRANGERS (20 profils) ────────────────────────────────────────────────────
const foreignersData = [
  // 1 – Français en règle, présent (affaires)
  {
    lastName: 'DUPONT', firstName: 'Jean-Pierre', gender: 'M', dateOfBirth: new Date('1985-03-15'),
    placeOfBirth: 'Paris', nationality: 'FRA',
    passport: { number: 'FR123456789', issueDate: new Date('2020-01-10'), expiryDate: new Date('2030-01-09'), issueCountry: 'FRA' },
    visa: { number: 'VIS-2026-001', type: 'AFFAIRES', issueDate: new Date('2026-01-15'), expiryDate: new Date('2026-08-15'), maxDays: 90 },
    addresses: [{ street: 'Avenue du Commerce 12', commune: 'Gombe', city: 'Kinshasa', province: 'Kinshasa', current: true }],
    emergencyContacts: [{ name: 'Marie Dupont', phone: '+33612345678', relation: 'Épouse', country: 'France' }],
    employer: 'Total Energies RDC', stayPurpose: 'AFFAIRES',
    currentStatus: 'EN_REGLE', presenceStatus: 'PRESENT', entryCount: 3,
    lastEntryDate: new Date('2026-05-10'), totalDaysInRDC: 95,
  },
  // 2 – Nigérian visa expiré, en alerte
  {
    lastName: 'OKONKWO', firstName: 'Emeka', gender: 'M', dateOfBirth: new Date('1990-07-22'),
    placeOfBirth: 'Lagos', nationality: 'NGA',
    passport: { number: 'NG987654321', issueDate: new Date('2022-06-01'), expiryDate: new Date('2027-05-31'), issueCountry: 'NGA' },
    visa: { number: 'VIS-2025-042', type: 'TOURISME', issueDate: new Date('2025-10-01'), expiryDate: new Date('2025-12-31'), maxDays: 90 },
    emergencyContacts: [{ name: 'Ngozi Okonkwo', phone: '+2348012345678', relation: 'Frère', country: 'Nigeria' }],
    stayPurpose: 'TOURISME',
    currentStatus: 'EN_ALERTE', presenceStatus: 'PRESENT', entryCount: 1,
    lastEntryDate: new Date('2025-11-15'), totalDaysInRDC: 215,
  },
  // 3 – Chinois travail, en règle (long séjour)
  {
    lastName: 'ZHANG', firstName: 'Wei', gender: 'M', dateOfBirth: new Date('1978-11-30'),
    placeOfBirth: 'Shanghai', nationality: 'CHN',
    passport: { number: 'CH456789012', issueDate: new Date('2022-03-15'), expiryDate: new Date('2032-03-14'), issueCountry: 'CHN' },
    visa: { number: 'VIS-2026-003', type: 'TRAVAIL', issueDate: new Date('2026-01-01'), expiryDate: new Date('2026-12-31'), maxDays: 365 },
    addresses: [{ street: 'Route de Matadi km 8', commune: 'Ngaliema', city: 'Kinshasa', province: 'Kinshasa', current: true }],
    emergencyContacts: [{ name: 'Li Zhang', phone: '+8613812345678', relation: 'Épouse', country: 'Chine' }],
    employer: 'China Railway Construction Corporation', stayPurpose: 'TRAVAIL',
    currentStatus: 'EN_REGLE', presenceStatus: 'PRESENT', entryCount: 5,
    lastEntryDate: new Date('2026-01-05'), totalDaysInRDC: 680,
  },
  // 4 – Espagnole étudiante, en règle
  {
    lastName: 'RODRIGUEZ', firstName: 'Maria', gender: 'F', dateOfBirth: new Date('1999-04-18'),
    placeOfBirth: 'Madrid', nationality: 'ESP',
    passport: { number: 'ES789012345', issueDate: new Date('2021-09-20'), expiryDate: new Date('2031-09-19'), issueCountry: 'ESP' },
    visa: { number: 'VIS-2025-118', type: 'ETUDES', issueDate: new Date('2025-09-01'), expiryDate: new Date('2027-06-30'), maxDays: 730 },
    addresses: [{ street: 'Campus Université de Kinshasa', commune: 'Lemba', city: 'Kinshasa', province: 'Kinshasa', current: true }],
    emergencyContacts: [{ name: 'Carlos Rodriguez', phone: '+34612345678', relation: 'Père', country: 'Espagne' }],
    stayPurpose: 'ETUDES',
    currentStatus: 'EN_REGLE', presenceStatus: 'PRESENT', entryCount: 2,
    lastEntryDate: new Date('2026-09-01'), totalDaysInRDC: 290,
  },
  // 5 – Sud-Africain sorti (affaires récurrentes)
  {
    lastName: 'MBEKI', firstName: 'Thabo', gender: 'M', dateOfBirth: new Date('1972-06-10'),
    placeOfBirth: 'Johannesburg', nationality: 'ZAF',
    passport: { number: 'ZA321654987', issueDate: new Date('2023-01-01'), expiryDate: new Date('2033-01-01'), issueCountry: 'ZAF' },
    visa: { number: 'VIS-2026-005', type: 'AFFAIRES', issueDate: new Date('2026-03-01'), expiryDate: new Date('2026-09-01'), maxDays: 60 },
    emergencyContacts: [{ name: 'Nomvula Mbeki', phone: '+27821234567', relation: 'Épouse', country: 'Afrique du Sud' }],
    stayPurpose: 'AFFAIRES',
    currentStatus: 'EN_REGLE', presenceStatus: 'SORTI', entryCount: 7,
    lastEntryDate: new Date('2026-04-10'), lastExitDate: new Date('2026-05-20'), totalDaysInRDC: 312,
  },
  // 6 – Américain diplomate, en règle
  {
    lastName: 'JOHNSON', firstName: 'Michael', gender: 'M', dateOfBirth: new Date('1975-08-22'),
    placeOfBirth: 'New York', nationality: 'USA',
    passport: { number: 'US112233445', issueDate: new Date('2021-03-10'), expiryDate: new Date('2031-03-09'), issueCountry: 'USA' },
    visa: { number: 'VIS-2025-200', type: 'DIPLOMATIQUE', issueDate: new Date('2025-01-01'), expiryDate: new Date('2027-12-31'), maxDays: 1095 },
    addresses: [{ street: 'Ambassade USA, Boulevard du 30 Juin', commune: 'Gombe', city: 'Kinshasa', province: 'Kinshasa', current: true }],
    emergencyContacts: [{ name: 'Sarah Johnson', phone: '+12025550178', relation: 'Épouse', country: 'USA' }],
    employer: 'Ambassade des États-Unis', stayPurpose: 'AFFAIRES',
    currentStatus: 'EN_REGLE', presenceStatus: 'PRESENT', entryCount: 12,
    lastEntryDate: new Date('2025-01-15'), totalDaysInRDC: 520,
  },
  // 7 – Belge ONG, en règle
  {
    lastName: 'LAMBERT', firstName: 'Sophie', gender: 'F', dateOfBirth: new Date('1988-12-05'),
    placeOfBirth: 'Bruxelles', nationality: 'BEL',
    passport: { number: 'BE556677889', issueDate: new Date('2020-07-15'), expiryDate: new Date('2030-07-14'), issueCountry: 'BEL' },
    visa: { number: 'VIS-2026-022', type: 'RESIDENCE', issueDate: new Date('2026-02-01'), expiryDate: new Date('2027-01-31'), maxDays: 365 },
    addresses: [{ street: 'Quartier Matonge, Avenue Kabambare', commune: 'Kalamu', city: 'Kinshasa', province: 'Kinshasa', current: true }],
    emergencyContacts: [{ name: 'Pierre Lambert', phone: '+32471234567', relation: 'Frère', country: 'Belgique' }],
    employer: 'Médecins Sans Frontières', stayPurpose: 'AFFAIRES',
    currentStatus: 'EN_REGLE', presenceStatus: 'PRESENT', entryCount: 4,
    lastEntryDate: new Date('2026-02-05'), totalDaysInRDC: 135,
  },
  // 8 – Indien en infraction (travail illégal)
  {
    lastName: 'PATEL', firstName: 'Rajesh', gender: 'M', dateOfBirth: new Date('1983-05-17'),
    placeOfBirth: 'Mumbai', nationality: 'IND',
    passport: { number: 'IN778899001', issueDate: new Date('2021-11-20'), expiryDate: new Date('2031-11-19'), issueCountry: 'IND' },
    visa: { number: 'VIS-2025-087', type: 'TOURISME', issueDate: new Date('2025-12-01'), expiryDate: new Date('2026-02-28'), maxDays: 90 },
    emergencyContacts: [{ name: 'Priya Patel', phone: '+919876543210', relation: 'Épouse', country: 'Inde' }],
    stayPurpose: 'TOURISME',
    currentStatus: 'EN_INFRACTION', presenceStatus: 'PRESENT', entryCount: 1,
    lastEntryDate: new Date('2025-12-10'), totalDaysInRDC: 190,
  },
  // 9 – Rwandais en règle (transit régulier)
  {
    lastName: 'NKURUNZIZA', firstName: 'Pierre', gender: 'M', dateOfBirth: new Date('1980-03-28'),
    placeOfBirth: 'Kigali', nationality: 'RWA',
    passport: { number: 'RW334455667', issueDate: new Date('2023-05-10'), expiryDate: new Date('2033-05-09'), issueCountry: 'RWA' },
    visa: { number: 'VIS-2026-056', type: 'AFFAIRES', issueDate: new Date('2026-04-01'), expiryDate: new Date('2026-10-01'), maxDays: 60 },
    addresses: [{ street: 'Avenue de Goma', commune: 'Goma', city: 'Goma', province: 'Nord-Kivu', current: true }],
    emergencyContacts: [{ name: 'Cécile Nkurunziza', phone: '+250788123456', relation: 'Épouse', country: 'Rwanda' }],
    employer: 'Banque Populaire du Rwanda', stayPurpose: 'AFFAIRES',
    currentStatus: 'EN_REGLE', presenceStatus: 'PRESENT', entryCount: 9,
    lastEntryDate: new Date('2026-05-20'), totalDaysInRDC: 88,
  },
  // 10 – Turc blacklisté
  {
    lastName: 'YILMAZ', firstName: 'Mehmet', gender: 'M', dateOfBirth: new Date('1976-09-14'),
    placeOfBirth: 'Istanbul', nationality: 'TUR',
    passport: { number: 'TR998877665', issueDate: new Date('2022-02-20'), expiryDate: new Date('2032-02-19'), issueCountry: 'TUR' },
    visa: { number: 'VIS-2025-033', type: 'AFFAIRES', issueDate: new Date('2025-03-01'), expiryDate: new Date('2025-09-01'), maxDays: 180 },
    emergencyContacts: [{ name: 'Fatma Yilmaz', phone: '+905321234567', relation: 'Épouse', country: 'Turquie' }],
    stayPurpose: 'AFFAIRES',
    currentStatus: 'BLACKLISTE', presenceStatus: 'SORTI', entryCount: 2,
    lastEntryDate: new Date('2025-03-15'), lastExitDate: new Date('2025-07-20'), totalDaysInRDC: 127,
    isBlacklisted: true,
  },
  // 11 – Britannique consultant, en règle
  {
    lastName: 'SMITH', firstName: 'James', gender: 'M', dateOfBirth: new Date('1970-11-03'),
    placeOfBirth: 'London', nationality: 'GBR',
    passport: { number: 'GB445566778', issueDate: new Date('2019-08-12'), expiryDate: new Date('2029-08-11'), issueCountry: 'GBR' },
    visa: { number: 'VIS-2026-077', type: 'AFFAIRES', issueDate: new Date('2026-03-15'), expiryDate: new Date('2026-09-15'), maxDays: 90 },
    addresses: [{ street: 'Pullman Kinshasa Grand Hôtel', commune: 'Gombe', city: 'Kinshasa', province: 'Kinshasa', current: true }],
    emergencyContacts: [{ name: 'Emma Smith', phone: '+447911123456', relation: 'Épouse', country: 'Royaume-Uni' }],
    employer: 'Glencore International', stayPurpose: 'AFFAIRES',
    currentStatus: 'EN_REGLE', presenceStatus: 'PRESENT', entryCount: 6,
    lastEntryDate: new Date('2026-04-01'), totalDaysInRDC: 420,
  },
  // 12 – Burundaise résidence, en règle
  {
    lastName: 'NDAYISHIMIYE', firstName: 'Claudine', gender: 'F', dateOfBirth: new Date('1992-01-25'),
    placeOfBirth: 'Bujumbura', nationality: 'BDI',
    passport: { number: 'BI223344556', issueDate: new Date('2022-09-01'), expiryDate: new Date('2032-08-31'), issueCountry: 'BDI' },
    visa: { number: 'VIS-2025-199', type: 'RESIDENCE', issueDate: new Date('2025-06-01'), expiryDate: new Date('2027-05-31'), maxDays: 730 },
    addresses: [{ street: 'Commune de Barumbu, Rue Boyoma 45', commune: 'Barumbu', city: 'Kinshasa', province: 'Kinshasa', current: true }],
    emergencyContacts: [{ name: 'Théodore Ndayishimiye', phone: '+25779123456', relation: 'Époux', country: 'Burundi' }],
    employer: 'Micro-Finance Plus', stayPurpose: 'TRAVAIL',
    currentStatus: 'EN_REGLE', presenceStatus: 'PRESENT', entryCount: 3,
    lastEntryDate: new Date('2026-01-10'), totalDaysInRDC: 380,
  },
  // 13 – Canadien ONG, passeport expirant bientôt
  {
    lastName: 'TREMBLAY', firstName: 'Luc', gender: 'M', dateOfBirth: new Date('1980-07-19'),
    placeOfBirth: 'Montréal', nationality: 'CAN',
    passport: { number: 'CA667788990', issueDate: new Date('2016-04-10'), expiryDate: new Date('2026-07-10'), issueCountry: 'CAN' },
    visa: { number: 'VIS-2026-031', type: 'RESIDENCE', issueDate: new Date('2026-01-01'), expiryDate: new Date('2026-12-31'), maxDays: 365 },
    addresses: [{ street: 'PNUD Kinshasa, Building ONU', commune: 'Gombe', city: 'Kinshasa', province: 'Kinshasa', current: true }],
    emergencyContacts: [{ name: 'Isabelle Tremblay', phone: '+15149876543', relation: 'Épouse', country: 'Canada' }],
    employer: 'Programme des Nations Unies pour le Développement', stayPurpose: 'AFFAIRES',
    currentStatus: 'EN_ALERTE', presenceStatus: 'PRESENT', entryCount: 8,
    lastEntryDate: new Date('2026-01-05'), totalDaysInRDC: 560,
  },
  // 14 – Angolais commerçant, visa expiré (en infraction)
  {
    lastName: 'MANUEL', firstName: 'António', gender: 'M', dateOfBirth: new Date('1968-02-14'),
    placeOfBirth: 'Luanda', nationality: 'AGO',
    passport: { number: 'AO112233456', issueDate: new Date('2021-05-20'), expiryDate: new Date('2031-05-19'), issueCountry: 'AGO' },
    visa: { number: 'VIS-2025-066', type: 'AFFAIRES', issueDate: new Date('2025-06-01'), expiryDate: new Date('2025-12-01'), maxDays: 180 },
    addresses: [{ street: 'Marché de la Liberté, Commune Masina', commune: 'Masina', city: 'Kinshasa', province: 'Kinshasa', current: true }],
    emergencyContacts: [{ name: 'Maria Manuel', phone: '+244923456789', relation: 'Épouse', country: 'Angola' }],
    stayPurpose: 'AFFAIRES',
    currentStatus: 'EN_INFRACTION', presenceStatus: 'PRESENT', entryCount: 14,
    lastEntryDate: new Date('2025-07-10'), totalDaysInRDC: 850,
  },
  // 15 – Japonais chercheur, en règle
  {
    lastName: 'TANAKA', firstName: 'Hiroshi', gender: 'M', dateOfBirth: new Date('1987-03-09'),
    placeOfBirth: 'Tokyo', nationality: 'JPN',
    passport: { number: 'JP889900112', issueDate: new Date('2023-01-15'), expiryDate: new Date('2033-01-14'), issueCountry: 'JPN' },
    visa: { number: 'VIS-2026-044', type: 'ETUDES', issueDate: new Date('2026-02-15'), expiryDate: new Date('2026-08-15'), maxDays: 180 },
    addresses: [{ street: 'Institut des Forêts Tropicales, Commune Ngaliema', commune: 'Ngaliema', city: 'Kinshasa', province: 'Kinshasa', current: true }],
    emergencyContacts: [{ name: 'Yuki Tanaka', phone: '+819012345678', relation: 'Épouse', country: 'Japon' }],
    employer: 'JICA - Agence Japonaise de Coopération', stayPurpose: 'ETUDES',
    currentStatus: 'EN_REGLE', presenceStatus: 'PRESENT', entryCount: 2,
    lastEntryDate: new Date('2026-02-18'), totalDaysInRDC: 120,
  },
  // 16 – Congolais (brazza) sorti régulièrement
  {
    lastName: 'MOUKALA', firstName: 'Gaston', gender: 'M', dateOfBirth: new Date('1965-11-30'),
    placeOfBirth: 'Brazzaville', nationality: 'COG',
    passport: { number: 'CG445566112', issueDate: new Date('2022-10-01'), expiryDate: new Date('2027-09-30'), issueCountry: 'COG' },
    visa: { number: 'VIS-2026-088', type: 'AFFAIRES', issueDate: new Date('2026-04-15'), expiryDate: new Date('2026-10-15'), maxDays: 90 },
    emergencyContacts: [{ name: 'Thérèse Moukala', phone: '+242069123456', relation: 'Épouse', country: 'Congo-Brazzaville' }],
    stayPurpose: 'AFFAIRES',
    currentStatus: 'EN_REGLE', presenceStatus: 'SORTI', entryCount: 22,
    lastEntryDate: new Date('2026-05-01'), lastExitDate: new Date('2026-05-28'), totalDaysInRDC: 145,
  },
  // 17 – Éthiopien suspect (fausse identité)
  {
    lastName: 'HAILE', firstName: 'Dawit', gender: 'M', dateOfBirth: new Date('1991-06-22'),
    placeOfBirth: 'Addis-Abeba', nationality: 'ETH',
    passport: { number: 'ET778899334', issueDate: new Date('2023-03-01'), expiryDate: new Date('2028-02-28'), issueCountry: 'ETH' },
    visa: { number: 'VIS-2026-101', type: 'TOURISME', issueDate: new Date('2026-04-20'), expiryDate: new Date('2026-07-20'), maxDays: 90 },
    emergencyContacts: [{ name: 'Tigist Haile', phone: '+251911234567', relation: 'Sœur', country: 'Éthiopie' }],
    stayPurpose: 'TOURISME',
    currentStatus: 'EN_ALERTE', presenceStatus: 'PRESENT', entryCount: 1,
    lastEntryDate: new Date('2026-04-25'), totalDaysInRDC: 54,
  },
  // 18 – Allemand ingénieur mines, en règle
  {
    lastName: 'MÜLLER', firstName: 'Klaus', gender: 'M', dateOfBirth: new Date('1974-09-18'),
    placeOfBirth: 'Munich', nationality: 'DEU',
    passport: { number: 'DE334455890', issueDate: new Date('2020-11-05'), expiryDate: new Date('2030-11-04'), issueCountry: 'DEU' },
    visa: { number: 'VIS-2026-012', type: 'TRAVAIL', issueDate: new Date('2026-01-10'), expiryDate: new Date('2026-12-31'), maxDays: 365 },
    addresses: [{ street: 'Site Minier Kibali, Djugu', commune: 'Djugu', city: 'Bunia', province: 'Ituri', current: true }],
    emergencyContacts: [{ name: 'Greta Müller', phone: '+4917612345678', relation: 'Épouse', country: 'Allemagne' }],
    employer: 'Barrick Gold Corporation RDC', stayPurpose: 'TRAVAIL',
    currentStatus: 'EN_REGLE', presenceStatus: 'PRESENT', entryCount: 4,
    lastEntryDate: new Date('2026-01-12'), totalDaysInRDC: 245,
  },
  // 19 – Sénégalais commerçant, séjour dépassé
  {
    lastName: 'DIALLO', firstName: 'Amadou', gender: 'M', dateOfBirth: new Date('1983-04-07'),
    placeOfBirth: 'Dakar', nationality: 'SEN',
    passport: { number: 'SN556677234', issueDate: new Date('2020-08-25'), expiryDate: new Date('2025-08-24'), issueCountry: 'SEN' },
    visa: { number: 'VIS-2025-150', type: 'AFFAIRES', issueDate: new Date('2025-03-01'), expiryDate: new Date('2025-06-01'), maxDays: 90 },
    emergencyContacts: [{ name: 'Fatoumata Diallo', phone: '+221771234567', relation: 'Épouse', country: 'Sénégal' }],
    stayPurpose: 'AFFAIRES',
    currentStatus: 'EN_ALERTE', presenceStatus: 'PRESENT', entryCount: 3,
    lastEntryDate: new Date('2025-03-05'), totalDaysInRDC: 470,
  },
  // 20 – Italienne humanitaire, en règle
  {
    lastName: 'FERRARI', firstName: 'Giulia', gender: 'F', dateOfBirth: new Date('1993-02-28'),
    placeOfBirth: 'Rome', nationality: 'ITA',
    passport: { number: 'IT667788123', issueDate: new Date('2022-06-10'), expiryDate: new Date('2032-06-09'), issueCountry: 'ITA' },
    visa: { number: 'VIS-2026-095', type: 'RESIDENCE', issueDate: new Date('2026-03-01'), expiryDate: new Date('2027-02-28'), maxDays: 365 },
    addresses: [{ street: 'UNICEF Kinshasa, Quartier Basoko', commune: 'Gombe', city: 'Kinshasa', province: 'Kinshasa', current: true }],
    emergencyContacts: [{ name: 'Marco Ferrari', phone: '+393312345678', relation: 'Père', country: 'Italie' }],
    employer: 'UNICEF République Démocratique du Congo', stayPurpose: 'AFFAIRES',
    currentStatus: 'EN_REGLE', presenceStatus: 'PRESENT', entryCount: 1,
    lastEntryDate: new Date('2026-03-05'), totalDaysInRDC: 105,
  },
];

// ─── SEED PRINCIPAL ────────────────────────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Nettoyage complet
    await Promise.all([
      User.deleteMany({}), BorderPost.deleteMany({}), Foreigner.deleteMany({}),
      Movement.deleteMany({}), Infraction.deleteMany({}), Alert.deleteMany({}),
      Blacklist.deleteMany({}), CorrectionRequest.deleteMany({}),
    ]);
    console.log('🗑️  Collections nettoyées');

    // Utilisateurs (create() pour déclencher le hook bcrypt)
    for (const u of users) await User.create(u);
    console.log(`✅ ${users.length} utilisateurs créés`);

    // Postes frontaliers
    await BorderPost.insertMany(borderPosts);
    console.log(`✅ ${borderPosts.length} postes frontaliers créés`);

    // Références utiles
    const admin    = await User.findOne({ role: 'ADMIN_NATIONAL' });
    const agent    = await User.findOne({ role: 'AGENT_DGM' });
    const police   = await User.findOne({ role: 'POLICE_NATIONALE' });
    const fronAer  = await User.findOne({ role: 'AGENT_FRONTALIER_AERIEN' });
    const fronTerr = await User.findOne({ role: 'AGENT_FRONTALIER_TERRESTRE' });

    const aeroKin   = await BorderPost.findOne({ code: 'AERO-KINSHASA' });
    const aeroLub   = await BorderPost.findOne({ code: 'AERO-LUBUMBASHI' });
    const aeroGoma  = await BorderPost.findOne({ code: 'AERO-GOMA' });
    const terreKas  = await BorderPost.findOne({ code: 'TERRE-KASUMBALESA' });
    const terreKas2 = await BorderPost.findOne({ code: 'TERRE-KASINDI' });
    const maritKin  = await BorderPost.findOne({ code: 'MARIT-KINSHASA' });

    // ── Création des 20 dossiers étrangers ──
    const foreigners = [];
    for (const f of foreignersData) {
      const doc = await Foreigner.create({ ...f, createdBy: admin._id, updatedBy: admin._id });
      foreigners.push(doc);
    }
    console.log(`✅ ${foreigners.length} dossiers étrangers créés`);

    const [dupont, okonkwo, zhang, rodriguez, mbeki, johnson, lambert, patel,
           nkurunziza, yilmaz, smith, ndayishimiye, tremblay, manuel, tanaka,
           moukala, haile, muller, diallo, ferrari] = foreigners;

    // ── MOUVEMENTS ──────────────────────────────────────────────────────────────
    const mouvements = [
      // Dupont — 3 entrées / 2 sorties
      { foreignerId: dupont._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'AF872', operator: 'Air France' }, provenance: 'Paris CDG', verificationStatus: 'AUTORISE', passportScanned: true, biometricVerified: true, datetime: new Date('2026-05-10T09:30:00') },
      { foreignerId: dupont._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'AF874', operator: 'Air France' }, provenance: 'Paris CDG', verificationStatus: 'AUTORISE', passportScanned: true, datetime: new Date('2026-02-15T11:00:00') },
      { foreignerId: dupont._id, type: 'SORTIE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'AF875', operator: 'Air France' }, destination: 'Paris CDG', verificationStatus: 'AUTORISE', datetime: new Date('2026-03-20T14:00:00') },

      // Okonkwo — 1 entrée, visa expiré
      { foreignerId: okonkwo._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'ET609', operator: 'Ethiopian Airlines' }, provenance: 'Lagos', verificationStatus: 'AUTORISE', passportScanned: true, datetime: new Date('2025-11-15T16:45:00') },

      // Zhang — 5 entrées / 4 sorties
      { foreignerId: zhang._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'CA919', operator: 'Air China' }, provenance: 'Beijing', verificationStatus: 'AUTORISE', passportScanned: true, biometricVerified: true, datetime: new Date('2026-01-05T08:00:00') },
      { foreignerId: zhang._id, type: 'SORTIE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'CA920', operator: 'Air China' }, destination: 'Beijing', verificationStatus: 'AUTORISE', datetime: new Date('2025-12-20T18:00:00') },
      { foreignerId: zhang._id, type: 'ENTREE', borderPostId: aeroLub._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'CA922', operator: 'Air China' }, provenance: 'Lubumbashi', verificationStatus: 'AUTORISE', datetime: new Date('2025-08-10T10:00:00') },

      // Rodriguez — 2 entrées
      { foreignerId: rodriguez._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'IB7832', operator: 'Iberia' }, provenance: 'Madrid', verificationStatus: 'AUTORISE', passportScanned: true, datetime: new Date('2026-09-01T07:30:00') },
      { foreignerId: rodriguez._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'IB7830', operator: 'Iberia' }, provenance: 'Madrid', verificationStatus: 'AUTORISE', datetime: new Date('2025-09-05T08:00:00') },

      // Mbeki — sorti
      { foreignerId: mbeki._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'SA231', operator: 'South African Airways' }, provenance: 'Johannesburg', verificationStatus: 'AUTORISE', passportScanned: true, datetime: new Date('2026-04-10T12:00:00') },
      { foreignerId: mbeki._id, type: 'SORTIE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'SA232', operator: 'South African Airways' }, destination: 'Johannesburg', verificationStatus: 'AUTORISE', datetime: new Date('2026-05-20T09:00:00') },

      // Johnson — diplomate, entrées multiples
      { foreignerId: johnson._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'AA987', operator: 'American Airlines' }, provenance: 'Washington DC', verificationStatus: 'AUTORISE', passportScanned: true, biometricVerified: true, datetime: new Date('2025-01-15T14:00:00') },

      // Lambert — ONG
      { foreignerId: lambert._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'SN401', operator: 'Brussels Airlines' }, provenance: 'Bruxelles', verificationStatus: 'AUTORISE', passportScanned: true, datetime: new Date('2026-02-05T10:30:00') },

      // Patel — entrée tourisme, reste pour travailler illégalement
      { foreignerId: patel._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'ET613', operator: 'Ethiopian Airlines' }, provenance: 'Mumbai', verificationStatus: 'AUTORISE', passportScanned: true, datetime: new Date('2025-12-10T17:00:00') },

      // Nkurunziza — frontalier terrestre
      { foreignerId: nkurunziza._id, type: 'ENTREE', borderPostId: terreKas2._id, agentId: fronTerr._id, transport: { mode: 'TERRESTRE', reference: 'PL-KIG-018', operator: 'Transport Kasindi' }, provenance: 'Kigali', verificationStatus: 'AUTORISE', passportScanned: true, datetime: new Date('2026-05-20T08:00:00') },

      // Yilmaz — blacklisté, ancienne entrée avant blacklist
      { foreignerId: yilmaz._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'TK1047', operator: 'Turkish Airlines' }, provenance: 'Istanbul', verificationStatus: 'AUTORISE', passportScanned: true, datetime: new Date('2025-03-15T09:00:00') },
      { foreignerId: yilmaz._id, type: 'SORTIE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'TK1048', operator: 'Turkish Airlines' }, destination: 'Istanbul', verificationStatus: 'AUTORISE', datetime: new Date('2025-07-20T11:00:00') },

      // Smith — consultant mines
      { foreignerId: smith._id, type: 'ENTREE', borderPostId: aeroLub._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'BA099', operator: 'British Airways' }, provenance: 'Londres Heathrow', verificationStatus: 'AUTORISE', passportScanned: true, biometricVerified: true, datetime: new Date('2026-04-01T13:00:00') },

      // Ndayishimiye — frontalière terrestre
      { foreignerId: ndayishimiye._id, type: 'ENTREE', borderPostId: terreKas._id, agentId: fronTerr._id, transport: { mode: 'TERRESTRE', reference: 'BUS-BJM-002', operator: 'Trans Congo Bus' }, provenance: 'Bujumbura', verificationStatus: 'AUTORISE', passportScanned: true, datetime: new Date('2026-01-10T07:00:00') },

      // Tremblay — ONU, passeport expirant
      { foreignerId: tremblay._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'AC876', operator: 'Air Canada' }, provenance: 'Montréal', verificationStatus: 'ALERTE', passportScanned: true, notes: 'Passeport expire dans 22 jours', datetime: new Date('2026-01-05T11:00:00') },

      // Manuel — angolais, visa expiré depuis longtemps
      { foreignerId: manuel._id, type: 'ENTREE', borderPostId: terreKas._id, agentId: fronTerr._id, transport: { mode: 'TERRESTRE', reference: '', operator: 'Particulier' }, provenance: 'Dilolo (Angola)', verificationStatus: 'AUTORISE', passportScanned: false, datetime: new Date('2025-07-10T06:30:00') },

      // Tanaka — chercheur japonais
      { foreignerId: tanaka._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'JL061', operator: 'Japan Airlines' }, provenance: 'Tokyo Narita', verificationStatus: 'AUTORISE', passportScanned: true, biometricVerified: true, datetime: new Date('2026-02-18T15:00:00') },

      // Moukala — sorti côté fluvial
      { foreignerId: moukala._id, type: 'ENTREE', borderPostId: maritKin._id, agentId: fronAer._id, transport: { mode: 'MARITIME', reference: 'FERRY-BZV-KIN', operator: 'CNTF' }, provenance: 'Brazzaville', verificationStatus: 'AUTORISE', passportScanned: true, datetime: new Date('2026-05-01T09:00:00') },
      { foreignerId: moukala._id, type: 'SORTIE', borderPostId: maritKin._id, agentId: fronAer._id, transport: { mode: 'MARITIME', reference: 'FERRY-KIN-BZV', operator: 'CNTF' }, destination: 'Brazzaville', verificationStatus: 'AUTORISE', datetime: new Date('2026-05-28T16:00:00') },

      // Haile — entrée suspecte
      { foreignerId: haile._id, type: 'ENTREE', borderPostId: aeroGoma._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'ET315', operator: 'Ethiopian Airlines' }, provenance: 'Addis-Abeba via Nairobi', verificationStatus: 'ALERTE', passportScanned: true, notes: 'Documents suspects, transmis au service ANR', datetime: new Date('2026-04-25T20:30:00') },

      // Müller — ingénieur mines
      { foreignerId: muller._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'LH588', operator: 'Lufthansa' }, provenance: 'Francfort', verificationStatus: 'AUTORISE', passportScanned: true, biometricVerified: true, datetime: new Date('2026-01-12T08:30:00') },

      // Diallo — visa et passeport expirés
      { foreignerId: diallo._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'DK501', operator: 'Air Sénégal' }, provenance: 'Dakar', verificationStatus: 'AUTORISE', passportScanned: true, datetime: new Date('2025-03-05T10:00:00') },

      // Ferrari — humanitaire UNICEF
      { foreignerId: ferrari._id, type: 'ENTREE', borderPostId: aeroKin._id, agentId: fronAer._id, transport: { mode: 'AERIEN', reference: 'AZ789', operator: 'Alitalia / ITA Airways' }, provenance: 'Rome Fiumicino', verificationStatus: 'AUTORISE', passportScanned: true, biometricVerified: true, datetime: new Date('2026-03-05T09:15:00') },
    ];

    await Movement.insertMany(mouvements);
    console.log(`✅ ${mouvements.length} mouvements créés`);

    // ── INFRACTIONS ─────────────────────────────────────────────────────────────
    const infractions = [
      {
        foreignerId: patel._id, agentId: police._id,
        nature: 'TRAVAIL_ILLEGAL', gravity: 'GRAVE',
        description: 'Étranger trouvé en train d\'exercer une activité commerciale dans le quartier Matonge sans permis de travail. Visa tourisme utilisé pour couverture.',
        dateFait: new Date('2026-04-15'), pvReference: 'PV/PNC/KIN/2026/1423',
        authority: { name: 'Police Nationale Congolaise - Brigade Économique', type: 'POLICE', reference: 'BRG-ECO-2026' },
        status: 'EN_COURS',
      },
      {
        foreignerId: okonkwo._id, agentId: agent._id,
        nature: 'DEPASSEMENT_SEJOUR', gravity: 'MOYENNE',
        description: 'Visa TOURISME expiré depuis le 31/12/2025. L\'étranger est toujours présent sur le territoire sans titre de séjour valide.',
        dateFait: new Date('2026-03-10'), pvReference: 'PV/DGM/KIN/2026/0312',
        authority: { name: 'DGM Bureau Kinshasa', type: 'DGM', reference: 'DGM-KIN-2026' },
        status: 'EN_COURS',
      },
      {
        foreignerId: manuel._id, agentId: agent._id,
        nature: 'DEPASSEMENT_SEJOUR', gravity: 'GRAVE',
        description: 'Visa affaires expiré depuis le 01/12/2025, soit plus de 6 mois de dépassement. L\'étranger continue d\'exercer des activités commerciales.',
        dateFait: new Date('2026-02-20'), pvReference: 'PV/DGM/KIN/2026/0189',
        authority: { name: 'DGM Bureau Kinshasa', type: 'DGM', reference: 'DGM-KIN-2026' },
        status: 'EN_COURS',
        sanctions: 'Amende de 500 USD et injonction de quitter le territoire sous 30 jours',
      },
      {
        foreignerId: yilmaz._id, agentId: police._id,
        nature: 'ACTIVITE_ILLICITE', gravity: 'TRES_GRAVE',
        description: 'Individu impliqué dans un réseau de trafic de minerais en dehors des circuits légaux. Coopération avec l\'ANR en cours.',
        dateFait: new Date('2025-06-10'), pvReference: 'PV/ANR/KIN/2025/0887',
        authority: { name: 'Agence Nationale de Renseignement', type: 'ANR', reference: 'ANR-TRAFIC-2025' },
        status: 'JUGEE',
        judgmentRef: 'JUG/TGI-KIN/2025/1234',
        judgmentDate: new Date('2025-09-15'),
        sanctions: 'Expulsion du territoire, interdiction de séjour permanente',
      },
      {
        foreignerId: haile._id, agentId: agent._id,
        nature: 'FAUSSE_IDENTITE', gravity: 'TRES_GRAVE',
        description: 'Documents de voyage présentant des incohérences. Cachet d\'entrée falsifié détecté lors du contrôle approfondi à l\'aéroport de Goma.',
        dateFait: new Date('2026-04-25'), pvReference: 'PV/DGM/GOMA/2026/0067',
        authority: { name: 'DGM Bureau Goma - Aéroport', type: 'DGM', reference: 'DGM-GOMA-2026' },
        status: 'EN_COURS',
      },
      {
        foreignerId: diallo._id, agentId: agent._id,
        nature: 'DEPASSEMENT_SEJOUR', gravity: 'GRAVE',
        description: 'Passeport expiré depuis le 24/08/2025 et visa expiré depuis le 01/06/2025. Étranger sans aucun document valide.',
        dateFait: new Date('2026-01-08'), pvReference: 'PV/DGM/KIN/2026/0054',
        authority: { name: 'DGM Bureau Kinshasa', type: 'DGM', reference: 'DGM-KIN-2026' },
        status: 'EN_COURS',
        sanctions: 'Convocation à la DGM pour régularisation ou expulsion',
      },
    ];

    for (const inf of infractions) await Infraction.create(inf);
    console.log(`✅ ${infractions.length} infractions créées`);

    // ── ALERTES ──────────────────────────────────────────────────────────────────
    const alertes = [
      {
        foreignerId: okonkwo._id, type: 'VISA_EXPIRE', severity: 'CRITIQUE',
        message: 'Visa TOURISME de M. Emeka OKONKWO (NGA) expiré depuis le 31/12/2025 — présent depuis 215 jours',
        isAutomatic: true, notifiedRoles: ['ADMIN_NATIONAL', 'AGENT_DGM', 'POLICE_NATIONALE'], status: 'ACTIVE',
      },
      {
        foreignerId: patel._id, type: 'VISA_EXPIRE', severity: 'HAUTE',
        message: 'Visa TOURISME de M. Rajesh PATEL (IND) expiré depuis le 28/02/2026 — travail illégal constaté',
        isAutomatic: false, triggeredBy: police._id, notifiedRoles: ['ADMIN_NATIONAL', 'AGENT_DGM', 'POLICE_NATIONALE'], status: 'EN_TRAITEMENT',
      },
      {
        foreignerId: tremblay._id, type: 'PASSEPORT_EXPIRE', severity: 'HAUTE',
        message: 'Passeport de M. Luc TREMBLAY (CAN) expire le 10/07/2026 — renouvellement urgent requis',
        isAutomatic: true, notifiedRoles: ['AGENT_DGM'], status: 'ACTIVE',
      },
      {
        foreignerId: haile._id, type: 'FAUSSE_IDENTITE', severity: 'CRITIQUE',
        message: 'Documents suspects détectés — M. Dawit HAILE (ETH) : cachet d\'entrée potentiellement falsifié à l\'aéroport de Goma',
        isAutomatic: false, triggeredBy: agent._id, notifiedRoles: ['ADMIN_NATIONAL', 'POLICE_NATIONALE', 'ANR_RENSEIGNEMENT'], status: 'ACTIVE',
      },
      {
        foreignerId: yilmaz._id, type: 'PERSONNE_RECHERCHEE', severity: 'CRITIQUE',
        message: 'M. Mehmet YILMAZ (TUR) — Inscription liste noire pour trafic de minerais. Interdiction permanente d\'entrée.',
        isAutomatic: false, triggeredBy: admin._id, notifiedRoles: ['ADMIN_NATIONAL', 'AGENT_FRONTALIER_AERIEN', 'AGENT_FRONTALIER_TERRESTRE', 'POLICE_NATIONALE', 'ANR_RENSEIGNEMENT'], status: 'RESOLUE',
        resolvedAt: new Date('2025-09-20'), resolvedBy: admin._id, resolutionNote: 'Individu expulsé le 20/07/2025, inscription liste noire validée',
      },
      {
        foreignerId: manuel._id, type: 'DEPASSEMENT_SEJOUR', severity: 'HAUTE',
        message: 'M. António MANUEL (AGO) en situation irrégulière — visa expiré depuis plus de 6 mois',
        isAutomatic: true, notifiedRoles: ['ADMIN_NATIONAL', 'AGENT_DGM'], status: 'EN_TRAITEMENT',
      },
      {
        foreignerId: diallo._id, type: 'PASSEPORT_EXPIRE', severity: 'CRITIQUE',
        message: 'M. Amadou DIALLO (SEN) : passeport ET visa tous deux expirés — sans document valide depuis 10 mois',
        isAutomatic: true, notifiedRoles: ['ADMIN_NATIONAL', 'AGENT_DGM', 'POLICE_NATIONALE'], status: 'ACTIVE',
      },
      {
        foreignerId: zhang._id, type: 'PASSAGE_SUSPECT', severity: 'BASSE',
        message: 'M. Wei ZHANG (CHN) : 5 entrées/sorties en 18 mois — profil habituel pour travailleurs expatriés, surveillance standard',
        isAutomatic: false, triggeredBy: agent._id, notifiedRoles: ['AGENT_DGM', 'ANR_RENSEIGNEMENT'], status: 'RESOLUE',
        resolvedAt: new Date('2026-02-01'), resolvedBy: agent._id, resolutionNote: 'Vérification complète — travailleur légal CRCC. Aucune anomalie.',
      },
    ];

    for (const al of alertes) await Alert.create(al);
    console.log(`✅ ${alertes.length} alertes créées`);

    // ── LISTE NOIRE ──────────────────────────────────────────────────────────────
    const blacklistEntries = [
      {
        foreignerId: yilmaz._id,
        passportNumber: 'TR998877665',
        reason: 'Condamné pour trafic illicite de minerais (or, coltan) en dehors des circuits officiels. Réseaux criminels transfrontaliers identifiés. Expulsé le 20/07/2025.',
        reasonCategory: 'SECURITE_NATIONALE',
        level: 'INTERDICTION_PERMANENTE',
        startDate: new Date('2025-09-20'),
        endDate: null,
        issuedBy: admin._id,
        approvedBy: admin._id,
        approvedAt: new Date('2025-09-20'),
        confidentialityLevel: 'SECRET',
        notes: 'Dossier transmis à l\'INTERPOL. Coordination avec les services de renseignement partenaires.',
      },
    ];

    for (const bl of blacklistEntries) {
      await Blacklist.create(bl);
      await Foreigner.findByIdAndUpdate(bl.foreignerId, { isBlacklisted: true, currentStatus: 'BLACKLISTE' });
    }
    console.log(`✅ ${blacklistEntries.length} entrée(s) liste noire créées`);

    // ── DEMANDES DE CORRECTION ───────────────────────────────────────────────────
    const corrections = [
      {
        foreignerId: dupont._id, requestedBy: agent._id,
        field: 'passport.expiryDate', fieldLabel: "Date d'expiration du passeport",
        oldValue: '2030-01-09', newValue: '2030-01-19',
        reason: 'Erreur de saisie lors de l\'enregistrement. Le passeport physique indique le 19/01/2030.',
        protectionLevel: 'HAUTE', status: 'EN_ATTENTE',
      },
      {
        foreignerId: zhang._id, requestedBy: agent._id,
        field: 'employer', fieldLabel: 'Employeur',
        oldValue: 'China Railway Construction Corporation', newValue: 'CRCC - China Railway Construction RDC SARL',
        reason: 'Nom légal exact de la filiale locale differ du nom de la maison mère.',
        protectionLevel: 'NORMALE', status: 'VALIDEE',
        reviewedBy: admin._id, reviewedAt: new Date('2026-04-10'),
        reviewNote: 'Pièce justificative vérifiée. Correction approuvée.',
        appliedAt: new Date('2026-04-10'),
      },
      {
        foreignerId: okonkwo._id, requestedBy: agent._id,
        field: 'firstName', fieldLabel: 'Prénom',
        oldValue: 'Emeka', newValue: 'Emmanuel',
        reason: 'Le prénom figurant sur le passeport est "Emmanuel". "Emeka" est un surnom utilisé par l\'intéressé.',
        protectionLevel: 'CRITIQUE', status: 'EN_ATTENTE',
      },
      {
        foreignerId: rodriguez._id, requestedBy: agent._id,
        field: 'visa.expiryDate', fieldLabel: "Date d'expiration du visa",
        oldValue: '2027-06-30', newValue: '2027-07-31',
        reason: 'La date saisie ne correspond pas au visa étudiant affiché dans le passeport.',
        protectionLevel: 'HAUTE', status: 'REJETEE',
        reviewedBy: admin._id, reviewedAt: new Date('2026-03-15'),
        reviewNote: 'Rejeté — la date 30/06/2027 est correcte selon le visa original scanné au moment de l\'entrée.',
      },
    ];

    for (const c of corrections) await CorrectionRequest.create(c);
    console.log(`✅ ${corrections.length} demandes de correction créées`);

    // ── RÉSUMÉ FINAL ─────────────────────────────────────────────────────────────
    console.log('\n🎉 Base de données initialisée avec succès!\n');
    console.log('📊 Résumé des données:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  👥 Utilisateurs          : ${users.length}`);
    console.log(`  🏢 Postes frontaliers    : ${borderPosts.length}`);
    console.log(`  🛂 Dossiers étrangers    : ${foreigners.length}`);
    console.log(`  ✈️  Mouvements            : ${mouvements.length}`);
    console.log(`  ⚠️  Infractions           : ${infractions.length}`);
    console.log(`  🚨 Alertes               : ${alertes.length}`);
    console.log(`  🚫 Liste noire           : ${blacklistEntries.length}`);
    console.log(`  📝 Corrections en attente: ${corrections.filter(c => c.status === 'EN_ATTENTE').length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📋 Comptes de connexion (mot de passe: DGM@2026!):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    users.forEach(u => console.log(`  ${u.role.padEnd(34)} | ${u.email}`));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur seed:', err.message);
    console.error(err);
    process.exit(1);
  }
};

seed();
