import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, Grid, Chip, Avatar, Tab, Tabs,
  Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Alert, CircularProgress,
  Divider, List, ListItem, ListItemText, LinearProgress, alpha, IconButton, Tooltip, Stack
} from '@mui/material';
import {
  ArrowBack, Edit, Warning, GppBad, FlightTakeoff, History,
  Person, CreditCard, Contacts, LocationOn, Add, CheckCircle, Block
} from '@mui/icons-material';
import { foreignersAPI, movementsAPI, infractionsAPI, correctionsAPI, alertsAPI } from '../../services/api';
import { useSnackbar } from 'notistack';
import StatusChip from '../../components/Common/StatusChip';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

function InfoRow({ label, value, highlight }) {
  return (
    <Box sx={{ display: 'flex', py: 0.75, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: { xs: 110, sm: 180 }, fontWeight: 600, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>{label}</Typography>
      <Typography variant="body2" fontWeight={highlight ? 700 : 400} color={highlight ? 'primary.main' : 'text.primary'}>{value || '—'}</Typography>
    </Box>
  );
}

const NATL_LABELS = { FRA: 'France', NGA: 'Nigeria', CHN: 'Chine', ZAF: 'Afrique du Sud', BEL: 'Belgique', USA: 'États-Unis', GBR: 'Royaume-Uni', ESP: 'Espagne', ITA: 'Italie', CMR: 'Cameroun', ZMB: 'Zambie', UGA: 'Ouganda' };

export default function ForeignerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);
  const [correctionDialog, setCorrectionDialog] = useState(false);
  const [corrForm, setCorrForm] = useState({ field: '', oldValue: '', newValue: '', reason: '' });

  const { data: foreigner, isLoading } = useQuery({ queryKey: ['foreigner', id], queryFn: () => foreignersAPI.getOne(id).then(r => r.data.data) });
  const { data: movements } = useQuery({ queryKey: ['movements', id], queryFn: () => movementsAPI.getByForeigner(id).then(r => r.data.data), enabled: tab === 1 });
  const { data: infractions } = useQuery({ queryKey: ['infractions', id], queryFn: () => infractionsAPI.getByForeigner(id).then(r => r.data.data), enabled: tab === 2 });

  const correctionMutation = useMutation({
    mutationFn: (data) => correctionsAPI.submit(data),
    onSuccess: () => { enqueueSnackbar('Demande de correction soumise.', { variant: 'success' }); setCorrectionDialog(false); qc.invalidateQueries(['foreigner', id]); },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || 'Erreur', { variant: 'error' }),
  });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (!foreigner) return <Alert severity="error">Dossier introuvable.</Alert>;

  const f = foreigner;
  const daysInRDC = f.totalDaysInRDC || 0;
  const visaExpiry = f.visa?.expiryDate ? new Date(f.visa.expiryDate) : null;
  const visaDaysLeft = visaExpiry ? differenceInDays(visaExpiry, new Date()) : null;
  const passportExpiry = f.passport?.expiryDate ? new Date(f.passport.expiryDate) : null;
  const passportDaysLeft = passportExpiry ? differenceInDays(passportExpiry, new Date()) : null;
  const canEdit = ['ADMIN_NATIONAL', 'AGENT_DGM'].includes(user?.role);
  const canCorrect = ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM'].includes(user?.role);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/etrangers')} variant="outlined">Retour</Button>
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h4" fontWeight={800} color="primary">{f.lastName} {f.firstName}</Typography>
            <Chip label={f.dossierNumber} variant="outlined" color="primary" sx={{ fontFamily: 'monospace', fontWeight: 700 }} />
            <StatusChip status={f.currentStatus} />
            <StatusChip status={f.presenceStatus} />
            {f.isBlacklisted && <Chip icon={<Block />} label="BLACKLISTÉ" color="error" sx={{ fontWeight: 800 }} />}
          </Box>
          <Typography color="text.secondary" variant="body2">Dossier créé le {f.createdAt ? format(new Date(f.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr }) : '—'}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {canCorrect && <Button startIcon={<Edit />} variant="outlined" color="warning" onClick={() => setCorrectionDialog(true)}>Demander correction</Button>}
          {canEdit && <Button startIcon={<Edit />} variant="contained" onClick={() => navigate(`/etrangers/${id}/modifier`)}>Modifier</Button>}
        </Stack>
      </Box>

      {f.isBlacklisted && <Alert severity="error" sx={{ mb: 2 }} icon={<Block />}><strong>LISTE NOIRE</strong> — Cette personne est interdite d'entrée sur le territoire.</Alert>}
      {visaDaysLeft !== null && visaDaysLeft < 0 && <Alert severity="error" sx={{ mb: 2 }}><strong>VISA EXPIRÉ</strong> — Le visa a expiré depuis {Math.abs(visaDaysLeft)} jour(s).</Alert>}
      {visaDaysLeft !== null && visaDaysLeft >= 0 && visaDaysLeft <= 15 && <Alert severity="warning" sx={{ mb: 2 }}><strong>VISA EXPIRE BIENTÔT</strong> — Il reste {visaDaysLeft} jour(s) de validité.</Alert>}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha('#003087', 0.04) }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color="primary">{daysInRDC}</Typography>
              <Typography variant="caption" color="text.secondary">Jours totaux en RDC</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: visaDaysLeft < 0 ? alpha('#D32F2F', 0.06) : visaDaysLeft <= 15 ? alpha('#E65100', 0.06) : alpha('#2E7D32', 0.06) }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color={visaDaysLeft < 0 ? 'error.main' : visaDaysLeft <= 15 ? 'warning.dark' : 'success.main'}>{visaDaysLeft ?? '—'}</Typography>
              <Typography variant="caption" color="text.secondary">Jours restants (visa)</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha('#003087', 0.04) }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color="primary">{f.entryCount || 0}</Typography>
              <Typography variant="caption" color="text.secondary">Entrées enregistrées</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha('#003087', 0.04) }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color={passportDaysLeft < 30 ? 'warning.dark' : 'primary'}>{passportDaysLeft ?? '—'}</Typography>
              <Typography variant="caption" color="text.secondary">Jours restants (passeport)</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab icon={<Person />} iconPosition="start" label="Identité" />
          <Tab icon={<FlightTakeoff />} iconPosition="start" label="Mouvements" />
          <Tab icon={<GppBad />} iconPosition="start" label="Infractions" />
          <Tab icon={<History />} iconPosition="start" label="Historique" />
        </Tabs>

        <CardContent sx={{ p: { xs: 1.5, sm: 3 }, overflowX: 'auto' }}>
          {tab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ width: 100, height: 100, fontSize: '2rem', fontWeight: 800, bgcolor: 'primary.main' }}>
                    {f.lastName?.[0]}{f.firstName?.[0]}
                  </Avatar>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={800}>{f.lastName} {f.middleName} {f.firstName}</Typography>
                    <Typography color="text.secondary">{NATL_LABELS[f.nationality] || f.nationality} • {f.gender === 'M' ? 'Masculin' : f.gender === 'F' ? 'Féminin' : 'Autre'}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>État Civil</Typography>
                <InfoRow label="Nom complet" value={`${f.lastName} ${f.middleName || ''} ${f.firstName}`} highlight />
                <InfoRow label="Date de naissance" value={f.dateOfBirth ? format(new Date(f.dateOfBirth), 'dd MMMM yyyy', { locale: fr }) : '—'} />
                <InfoRow label="Lieu de naissance" value={f.placeOfBirth} />
                <InfoRow label="Nationalité" value={`${NATL_LABELS[f.nationality] || f.nationality} (${f.nationality})`} />
                {f.secondNationality && <InfoRow label="Double nationalité" value={`${NATL_LABELS[f.secondNationality] || f.secondNationality} (${f.secondNationality})`} />}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Passeport</Typography>
                <InfoRow label="Numéro" value={f.passport?.number} highlight />
                <InfoRow label="Émission" value={f.passport?.issueDate ? format(new Date(f.passport.issueDate), 'dd/MM/yyyy') : '—'} />
                <InfoRow label="Expiration" value={f.passport?.expiryDate ? format(new Date(f.passport.expiryDate), 'dd/MM/yyyy') : '—'} highlight={passportDaysLeft !== null && passportDaysLeft < 30} />
                <InfoRow label="Pays émetteur" value={NATL_LABELS[f.passport?.issueCountry] || f.passport?.issueCountry} />
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Visa</Typography>
                <InfoRow label="Numéro" value={f.visa?.number} highlight />
                <InfoRow label="Type" value={f.visa?.type} />
                <InfoRow label="Émission" value={f.visa?.issueDate ? format(new Date(f.visa.issueDate), 'dd/MM/yyyy') : '—'} />
                <InfoRow label="Expiration" value={f.visa?.expiryDate ? format(new Date(f.visa.expiryDate), 'dd/MM/yyyy') : '—'} highlight={visaDaysLeft !== null && visaDaysLeft <= 15} />
                <InfoRow label="Durée maximale" value={`${f.visa?.maxDays} jours`} />
                {f.emergencyContacts?.[0] && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" fontWeight={700} color="primary" sx={{ mb: 1, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Contact d'urgence</Typography>
                    <InfoRow label="Nom" value={f.emergencyContacts[0].name} />
                    <InfoRow label="Téléphone" value={f.emergencyContacts[0].phone} />
                    <InfoRow label="Relation" value={f.emergencyContacts[0].relation} />
                  </>
                )}
                {f.employer && <><Divider sx={{ my: 2 }} /><InfoRow label="Employeur" value={f.employer} /></>}
                {f.stayPurpose && <InfoRow label="Motif séjour" value={f.stayPurpose} />}
              </Grid>
            </Grid>
          )}

          {tab === 1 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date & Heure</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Poste Frontalier</TableCell>
                  <TableCell>Transport</TableCell>
                  <TableCell>Provenance/Destination</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movements?.length > 0 ? movements.map((mv) => (
                  <TableRow key={mv._id}>
                    <TableCell><Typography variant="caption">{mv.datetime ? format(new Date(mv.datetime), 'dd/MM/yyyy HH:mm', { locale: fr }) : '—'}</Typography></TableCell>
                    <TableCell><StatusChip status={mv.type} /></TableCell>
                    <TableCell><Typography variant="caption">{mv.borderPostId?.name || '—'}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{mv.transport?.mode} {mv.transport?.reference && `- ${mv.transport.reference}`}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{mv.type === 'ENTREE' ? mv.provenance : mv.destination}</Typography></TableCell>
                    <TableCell><StatusChip status={mv.verificationStatus} /></TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography color="text.secondary">Aucun mouvement enregistré.</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {tab === 2 && (
            <Box>
              {infractions?.length > 0 ? infractions.map((inf) => (
                <Card key={inf._id} sx={{ mb: 2, border: '1px solid', borderColor: inf.gravity === 'TRES_GRAVE' || inf.gravity === 'GRAVE' ? 'error.light' : 'divider' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip label={inf.nature?.replace(/_/g, ' ')} color="error" size="small" />
                        <StatusChip status={inf.status} />
                        <Chip label={inf.gravity} size="small" variant="outlined" color={inf.gravity === 'TRES_GRAVE' ? 'error' : 'warning'} />
                      </Box>
                      <Typography variant="caption" color="text.secondary">{inf.dateFait ? format(new Date(inf.dateFait), 'dd/MM/yyyy', { locale: fr }) : '—'}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>{inf.description}</Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary">PV: <strong>{inf.pvReference}</strong></Typography>
                      <Typography variant="caption" color="text.secondary">Autorité: <strong>{inf.authority?.name} ({inf.authority?.type})</strong></Typography>
                      {inf.sanctions && <Typography variant="caption" color="text.secondary">Sanctions: {inf.sanctions}</Typography>}
                    </Box>
                  </CardContent>
                </Card>
              )) : (
                <Box sx={{ textAlign: 'center', py: 4 }}><GppBad sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} /><Typography color="text.secondary">Aucune infraction enregistrée.</Typography></Box>
              )}
            </Box>
          )}

          {tab === 3 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <History sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">Historique complet disponible dans les journaux d'audit.</Typography>
              <Button variant="outlined" sx={{ mt: 2 }} onClick={() => navigate('/audit')}>Voir les logs d'audit</Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={correctionDialog} onClose={() => setCorrectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Demande de Correction</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>Les corrections de champs critiques (identité, passeport) requièrent la validation d'un Admin National.</Alert>
          <TextField fullWidth select label="Champ à corriger" value={corrForm.field} onChange={(e) => setCorrForm(p => ({ ...p, field: e.target.value }))} sx={{ mb: 2, mt: 1 }}>
            <MenuItem value="lastName">Nom de famille (CRITIQUE)</MenuItem>
            <MenuItem value="firstName">Prénom (CRITIQUE)</MenuItem>
            <MenuItem value="dateOfBirth">Date de naissance (CRITIQUE)</MenuItem>
            <MenuItem value="nationality">Nationalité (CRITIQUE)</MenuItem>
            <MenuItem value="passport.number">Numéro de passeport (CRITIQUE)</MenuItem>
            <MenuItem value="passport.expiryDate">Expiration passeport (HAUTE)</MenuItem>
            <MenuItem value="visa.number">Numéro de visa (HAUTE)</MenuItem>
            <MenuItem value="visa.type">Type de visa (HAUTE)</MenuItem>
            <MenuItem value="visa.expiryDate">Expiration visa (HAUTE)</MenuItem>
            <MenuItem value="employer">Employeur (NORMALE)</MenuItem>
          </TextField>
          <TextField fullWidth label="Ancienne valeur" value={corrForm.oldValue} onChange={(e) => setCorrForm(p => ({ ...p, oldValue: e.target.value }))} sx={{ mb: 2 }} />
          <TextField fullWidth label="Nouvelle valeur proposée" value={corrForm.newValue} onChange={(e) => setCorrForm(p => ({ ...p, newValue: e.target.value }))} sx={{ mb: 2 }} />
          <TextField fullWidth multiline rows={3} label="Justification *" value={corrForm.reason} onChange={(e) => setCorrForm(p => ({ ...p, reason: e.target.value }))} required />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCorrectionDialog(false)}>Annuler</Button>
          <Button variant="contained" disabled={!corrForm.field || !corrForm.reason || correctionMutation.isPending}
            onClick={() => correctionMutation.mutate({ foreignerId: id, field: corrForm.field, oldValue: corrForm.oldValue, newValue: corrForm.newValue, reason: corrForm.reason })}>
            Soumettre la demande
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
