// @ts-nocheck
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination, Chip, Alert, CircularProgress, Stack
} from '@mui/material';
import { GppBad, Add, Search } from '@mui/icons-material';
import { infractionsAPI, foreignersAPI } from '../../services/api';
import { useSnackbar } from 'notistack';
import StatusChip from '../../components/Common/StatusChip';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const NATURES = ['DEPASSEMENT_SEJOUR', 'TRAVAIL_ILLEGAL', 'FAUSSE_IDENTITE', 'FRAUDE_DOCUMENTAIRE', 'ENTREE_IRREGULIERE', 'SEJOUR_IRREGULIER', 'VIOLATION_ZONE', 'ACTIVITE_ILLICITE', 'ORDRE_PUBLIC', 'SECURITE_NATIONALE', 'AUTRE'];
const GRAVITIES = ['FAIBLE', 'MOYENNE', 'GRAVE', 'TRES_GRAVE'];
const AUTHORITY_TYPES = ['DGM', 'POLICE', 'ANR', 'JUSTICE', 'AUTRE'];

export default function Infractions() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ nature: '', status: '', gravity: '' });
  const [dialog, setDialog] = useState(false);
  const [passportSearch, setPassportSearch] = useState('');
  const [foundForeigner, setFoundForeigner] = useState(null);
  const [form, setForm] = useState({ nature: '', description: '', dateFait: '', authority: { name: '', type: 'POLICE', reference: '' }, pvReference: '', gravity: 'MOYENNE', sanctions: '' });

  const canAdd = ['ADMIN_NATIONAL', 'POLICE_NATIONALE', 'JUSTICE'].includes(user?.role);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['infractions', page, filters],
    queryFn: () => infractionsAPI.getAll({ page: page + 1, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')) }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (data) => infractionsAPI.create(data),
    onSuccess: () => { enqueueSnackbar('Infraction enregistrée avec succès.', { variant: 'success' }); setDialog(false); qc.invalidateQueries(['infractions']); setFoundForeigner(null); setPassportSearch(''); },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || 'Erreur', { variant: 'error' }),
  });

  const searchForeigner = async () => {
    try {
      const { data: res } = await foreignersAPI.getAll({ search: passportSearch, limit: 5 });
      const found = res.data?.find(f => f.passport?.number?.toUpperCase() === passportSearch.toUpperCase() || f.dossierNumber === passportSearch);
      if (found) setFoundForeigner(found);
      else enqueueSnackbar('Aucun dossier trouvé', { variant: 'warning' });
    } catch { enqueueSnackbar('Erreur lors de la recherche', { variant: 'error' }); }
  };

  const handleSubmit = () => {
    if (!foundForeigner) { enqueueSnackbar('Veuillez d\'abord identifier l\'étranger', { variant: 'warning' }); return; }
    createMutation.mutate({ ...form, foreignerId: foundForeigner._id });
  };

  const GRAVITY_COLORS = { FAIBLE: 'success', MOYENNE: 'warning', GRAVE: 'error', TRES_GRAVE: 'error' };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary">Infractions</Typography>
          <Typography color="text.secondary" variant="body2">Registre des infractions migratoires constatées</Typography>
        </Box>
        {canAdd && <Button startIcon={<Add />} variant="contained" onClick={() => setDialog(true)}>Enregistrer une infraction</Button>}
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField size="small" select label="Nature" value={filters.nature} onChange={(e) => setFilters(p => ({ ...p, nature: e.target.value }))} sx={{ minWidth: 200 }}>
              <MenuItem value="">Toutes</MenuItem>
              {NATURES.map(n => <MenuItem key={n} value={n}>{n.replace(/_/g, ' ')}</MenuItem>)}
            </TextField>
            <TextField size="small" select label="Statut" value={filters.status} onChange={(e) => setFilters(p => ({ ...p, status: e.target.value }))} sx={{ minWidth: 160 }}>
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="EN_COURS">En cours</MenuItem>
              <MenuItem value="CLASSEE">Classée</MenuItem>
              <MenuItem value="JUGEE">Jugée</MenuItem>
              <MenuItem value="APPEL">Appel</MenuItem>
            </TextField>
            <TextField size="small" select label="Gravité" value={filters.gravity} onChange={(e) => setFilters(p => ({ ...p, gravity: e.target.value }))} sx={{ minWidth: 140 }}>
              <MenuItem value="">Toutes</MenuItem>
              {GRAVITIES.map(g => <MenuItem key={g} value={g}>{g.replace(/_/g, ' ')}</MenuItem>)}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date constatation</TableCell>
              <TableCell>Étranger</TableCell>
              <TableCell>Nature</TableCell>
              <TableCell>Gravité</TableCell>
              <TableCell>Autorité</TableCell>
              <TableCell>PV Référence</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Agent</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Box sx={{ height: 16, bgcolor: 'grey.100', borderRadius: 1 }} /></TableCell>)}</TableRow>)
            ) : data?.data?.length > 0 ? data.data.map((inf) => (
              <TableRow key={inf._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/etrangers/${inf.foreignerId?._id}`)}>
                <TableCell><Typography variant="caption">{inf.dateFait ? format(new Date(inf.dateFait), 'dd/MM/yyyy', { locale: fr }) : '—'}</Typography></TableCell>
                <TableCell>
                  <Typography variant="caption" fontWeight={700}>{inf.foreignerId?.lastName} {inf.foreignerId?.firstName}</Typography><br />
                  <Typography variant="caption" color="text.secondary">{inf.foreignerId?.nationality}</Typography>
                </TableCell>
                <TableCell><Chip label={inf.nature?.replace(/_/g, ' ')} size="small" color="error" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                <TableCell><Chip label={inf.gravity} size="small" color={GRAVITY_COLORS[inf.gravity] || 'default'} sx={{ fontSize: '0.7rem', fontWeight: 700 }} /></TableCell>
                <TableCell><Typography variant="caption">{inf.authority?.name} ({inf.authority?.type})</Typography></TableCell>
                <TableCell><Typography variant="caption" fontFamily="monospace" fontWeight={600}>{inf.pvReference}</Typography></TableCell>
                <TableCell><StatusChip status={inf.status} /></TableCell>
                <TableCell><Typography variant="caption">{inf.agentId?.name}</Typography></TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><GppBad sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} /><br /><Typography color="text.secondary">Aucune infraction enregistrée.</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        </TableContainer>
        <TablePagination component="div" count={data?.pagination?.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`} />
      </Card>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight={700}>Enregistrer une Infraction</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, mt: 1 }}>Seules les infractions officiellement constatées avec un procès-verbal peuvent être enregistrées.</Alert>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField fullWidth label="N° passeport ou N° dossier" size="small" value={passportSearch} onChange={(e) => setPassportSearch(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && searchForeigner()} />
            <Button variant="outlined" onClick={searchForeigner} startIcon={<Search />}>Rechercher</Button>
          </Box>
          {foundForeigner && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Étranger identifié: <strong>{foundForeigner.lastName} {foundForeigner.firstName}</strong> — {foundForeigner.nationality} — {foundForeigner.dossierNumber}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Nature de l'infraction *" value={form.nature} onChange={(e) => setForm(p => ({ ...p, nature: e.target.value }))}>
                {NATURES.map(n => <MenuItem key={n} value={n}>{n.replace(/_/g, ' ')}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Date de constatation *" type="date" InputLabelProps={{ shrink: true }} value={form.dateFait} onChange={(e) => setForm(p => ({ ...p, dateFait: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Description des faits *" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Nom de l'autorité *" value={form.authority.name} onChange={(e) => setForm(p => ({ ...p, authority: { ...p.authority, name: e.target.value } }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth select label="Type d'autorité *" value={form.authority.type} onChange={(e) => setForm(p => ({ ...p, authority: { ...p.authority, type: e.target.value } }))}>
                {AUTHORITY_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Référence PV *" value={form.pvReference} onChange={(e) => setForm(p => ({ ...p, pvReference: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Gravité *" value={form.gravity} onChange={(e) => setForm(p => ({ ...p, gravity: e.target.value }))}>
                {GRAVITIES.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Sanctions appliquées" value={form.sanctions} onChange={(e) => setForm(p => ({ ...p, sanctions: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(false)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleSubmit} disabled={createMutation.isPending || !foundForeigner || !form.nature || !form.pvReference}>
            {createMutation.isPending ? <CircularProgress size={18} /> : 'Enregistrer l\'infraction'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
