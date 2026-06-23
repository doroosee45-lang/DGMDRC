# DGM — SIMN
## Système d'Information Migratoire National
### République Démocratique du Congo — Ministère de l'Intérieur

---

## Installation et Démarrage

### Prérequis
- Node.js 18+ LTS
- MongoDB 7.x (local ou MongoDB Atlas)
- npm ou yarn

---

### 1. Backend

```bash
cd backend
cp .env.example .env
# Éditer .env avec vos paramètres (MONGODB_URI, JWT_SECRET, etc.)
npm install
npm run seed        # Initialiser la base de données
npm run dev         # Démarrer en développement
```

**Serveur**: http://localhost:5000/api/v1

---

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

**Application**: http://localhost:3000

---

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin National | admin@dgm.gouv.cd | DGM@2026! |
| Admin Provincial | admin.kinshasa@dgm.gouv.cd | DGM@2026! |
| Agent DGM | agent@dgm.gouv.cd | DGM@2026! |
| Agent Frontalier Aérien | frontalier.aerien@dgm.gouv.cd | DGM@2026! |
| Agent Frontalier Terrestre | frontalier.terrestre@dgm.gouv.cd | DGM@2026! |
| Police Nationale | police@pnc.gouv.cd | DGM@2026! |
| Justice | justice@justice.gouv.cd | DGM@2026! |
| ANR | anr@anr.gouv.cd | DGM@2026! |
| Ministère Intérieur | ministre@interieur.gouv.cd | DGM@2026! |
| Ambassade | visa@ambassade-france.cd | DGM@2026! |
| Auditeur | auditeur@dgm.gouv.cd | DGM@2026! |

---

## Architecture

```
dgm-simn/
├── backend/          # API Node.js/Express/MongoDB
│   ├── src/
│   │   ├── config/   # Configuration DB
│   │   ├── models/   # Schémas Mongoose (10 modèles)
│   │   ├── controllers/ # Logique métier
│   │   ├── routes/   # Routes API REST
│   │   ├── middleware/ # Auth, RBAC, Audit
│   │   └── utils/    # AlertEngine, Seed
│   └── package.json
└── frontend/         # React 18 + Material UI
    ├── src/
    │   ├── pages/    # 12 pages fonctionnelles
    │   ├── components/ # Layout, Common
    │   ├── store/    # Redux Toolkit
    │   └── services/ # API Axios
    └── package.json
```

## Modules Implémentés

1. **Authentification** — JWT + 2FA TOTP, RBAC 13 rôles
2. **Dossiers Étrangers** — CRUD complet, recherche avancée
3. **Contrôle Frontalier** — Enregistrement entrées/sorties, vérification temps réel
4. **Infractions** — Registre avec workflow juridique
5. **Alertes** — Moteur automatique + alertes manuelles
6. **Liste Noire** — Interdictions avec niveaux de confidentialité
7. **Corrections** — Workflow de correction avec validation hiérarchique
8. **Rapports & Statistiques** — Graphiques, flux migratoires
9. **Journaux d'Audit** — Logs immuables avec chaînage SHA-256
10. **Gestion des Utilisateurs** — CRUD complet (Admin National)
