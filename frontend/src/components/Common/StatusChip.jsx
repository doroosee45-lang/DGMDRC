import { Chip } from '@mui/material';

const STATUS_CONFIG = {
  EN_REGLE: { label: 'En règle', color: 'success' },
  EN_ALERTE: { label: 'En alerte', color: 'warning' },
  EN_INFRACTION: { label: 'En infraction', color: 'error' },
  EXPULSE: { label: 'Expulsé', color: 'error' },
  BLACKLISTE: { label: 'Blacklisté', color: 'error' },
  INCONNU: { label: 'Inconnu', color: 'default' },
  ACTIVE: { label: 'Active', color: 'error' },
  EN_TRAITEMENT: { label: 'En traitement', color: 'warning' },
  RESOLUE: { label: 'Résolue', color: 'success' },
  IGNOREE: { label: 'Ignorée', color: 'default' },
  CRITIQUE: { label: 'Critique', color: 'error' },
  HAUTE: { label: 'Haute', color: 'warning' },
  MOYENNE: { label: 'Moyenne', color: 'info' },
  BASSE: { label: 'Basse', color: 'success' },
  EN_ATTENTE: { label: 'En attente', color: 'warning' },
  EN_REVISION: { label: 'En révision', color: 'info' },
  VALIDEE: { label: 'Validée', color: 'success' },
  REJETEE: { label: 'Rejetée', color: 'error' },
  ANNULEE: { label: 'Annulée', color: 'default' },
  EN_COURS: { label: 'En cours', color: 'warning' },
  CLASSEE: { label: 'Classée', color: 'default' },
  JUGEE: { label: 'Jugée', color: 'info' },
  APPEL: { label: 'Appel', color: 'warning' },
  AUTORISE: { label: 'Autorisé', color: 'success' },
  ALERTE: { label: 'Alerte', color: 'warning' },
  REFUSE: { label: 'Refusé', color: 'error' },
  INTERPELLE: { label: 'Interpellé', color: 'error' },
  PRESENT: { label: 'Présent', color: 'success' },
  SORTI: { label: 'Sorti', color: 'default' },
  ENTREE: { label: 'Entrée', color: 'success' },
  SORTIE: { label: 'Sortie', color: 'primary' },
  TRANSIT: { label: 'Transit', color: 'info' },
};

export default function StatusChip({ status, size = 'small' }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size={size} sx={{ fontWeight: 700 }} />;
}
