// @ts-nocheck
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination, Chip, Alert, CircularProgress,
  InputAdornment, alpha, Stack
} from '@mui/material';
import { Security, Add, Search, Block, CheckCircle } from '@mui/icons-material';
import { blacklistAPI, foreignersAPI } from '../../services/api';
import { useSnackbar } from 'notistack';
import StatusChip from '../../components/Common/StatusChip';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const REASON_CATEGORIES = ['SECURITE_NATIONALE', 'INFRACTION_GRAVE', 'FRAUDE', 'EXPULSION', 'ORDRE_PUBLIC', 'AUTRE'];
const LEVELS = ['AVERTISSEMENT', 'INTERDICTION_TEMPORAIRE', 'INTERDICTION_PERMANENTE'];

export default function Blacklist() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [addDialog, setAddDialog] = useState(false);
  const [liftDialog, setLiftDialog] = useState(null);
  const [checkPassport, setCheckPassport] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [passportSearch, setPassportSearch] = useState('');
  const [foundForeigner, setFoundForeigner] = useState(null);
  const [form, setForm] = useState({ reason: '', reasonCategory: 'INFRACTION_GRAVE', level: 'INTERDICTION_TEMPORAIRE', endDate: '', notes: '', confidentialityLevel: 'RESTREINT' });
  const [liftReason, setLiftReason] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['blacklist', page],
    queryFn: () => blacklistAPI.getAll({ page: page + 1, limit: 20 }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const addMutation = useMutation({
    mutationFn: (data) => blacklistAPI.add(data),
    onSuccess: () => { enqueueSnackbar('Personne ajoutée à la liste noire.', { variant: 'success' }); setAddDialog(false); setFoundForeigner(null); setPassportSearch(''); qc.invalidateQueries(['blacklist']); },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || 'Erreur', { variant: 'error' }),
  });

  const liftMutation = useMutation({
    mutationFn: ({ id, reason }) => blacklistAPI.lift(id, { reason }),
    onSuccess: () => { enqueueSnackbar('Interdiction levée.', { variant: 'success' }); setLiftDialog(null); setLiftReason(''); qc.invalidateQueries(['blacklist']); },
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

  const handleCheck = async () => {
    try {
      const { data: res } = await blacklistAPI.check(checkPassport);
      setCheckResult(res.data);
    } catch { enqueueSnackbar('Erreur lors de la vérification', { variant: 'error' }); }
  };

  const LEVEL_COLORS = { AVERTISSEMENT: 'warning', INTERDICTION_TEMPORAIRE: 'error', INTERDICTION_PERMANENTE: 'error' };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary">Liste Noire</Typography>
          <Typography color="text.secondary" variant="body2">Interdictions d'entrée sur le territoire national</Typography>
        </Box>
        {['ADMIN_NATIONAL', 'POLICE_NATIONALE', 'JUSTICE', 'ANR_RENSEIGNEMENT'].includes(user?.role) && (
          <Button startIcon={<Add />} variant="contained" color="error" onClick={() => setAddDialog(true)}>Ajouter à la liste noire</Button>
        )}
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Vérification rapide de passeport</Typography>
          <Stack direction="row" spacing={1}>
            <TextField size="small" placeholder="Numéro de passeport..." value={checkPassport} onChange={(e) => { setCheckPassport(e.target.value.toUpperCase()); setCheckResult(null); }} onKeyDown={(e) => e.key === 'Enter' && handleCheck()} sx={{ maxWidth: 300 }} InputProps={{ style: { fontFamily: 'monospace', fontWeight: 700 } }} />
            <Button variant="outlined" onClick={handleCheck} startIcon={<Search />}>Vérifier</Button>
          </Stack>
          {checkResult && (
            <Alert severity={checkResult.isBlacklisted ? 'error' : 'success'} sx={{ mt: 2, maxWidth: 500 }} icon={checkResult.isBlacklisted ? <Block /> : <CheckCircle />}>
              {checkResult.isBlacklisted ? (
                <><strong>PASSEPORT BLACKLISTÉ</strong> — {checkResult.entry?.reason} ({checkResult.entry?.level?.replace(/_/g, ' ')})</>
              ) : 'Aucune entrée dans la liste noire pour ce passeport.'}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Identité</TableCell>
              <TableCell>Passeport</TableCell>
              <TableCell>Niveau</TableCell>
              <TableCell>Catégorie</TableCell>
              <TableCell>Motif</TableCell>
              <TableCell>Début</TableCell>
              <TableCell>Fin</TableCell>
              <TableCell>Émis par</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Box sx={{ height: 16, bgcolor: 'grey.100', borderRadius: 1 }} /></TableCell>)}</TableRow>)
            ) : data?.data?.length > 0 ? data.data.map((entry) => (
              <TableRow key={entry._id} hover sx={{ bgcolor: alpha('#D32F2F', 0.02) }}>
                <TableCell>
                  <Typography variant="caption" fontWeight={700} sx={{ cursor: 'pointer', color: 'primary.main' }} onClick={() => navigate(`/etrangers/${entry.foreignerId?._id}`)}>
                    {entry.foreignerId?.lastName} {entry.foreignerId?.firstName}
                  </Typography><br />
                  <Typography variant="caption" color="text.secondary">{entry.foreignerId?.nationality} — {entry.foreignerId?.dossierNumber}</Typography>
                </TableCell>
                <TableCell><Typography variant="caption" fontFamily="monospace" fontWeight={700}>{entry.passportNumber}</Typography></TableCell>
                <TableCell><Chip label={entry.level?.replace(/_/g, ' ')} size="small" color={LEVEL_COLORS[entry.level] || 'default'} sx={{ fontWeight: 700, fontSize: '0.7rem' }} /></TableCell>
                <TableCell><Chip label={entry.reasonCategory?.replace(/_/g, ' ')} size="small" variant="outlined" color="error" sx={{ fontSize: '0.7rem' }} /></TableCell>
                <TableCell sx={{ maxWidth: 200 }}><Typography variant="caption">{entry.reason}</Typography></TableCell>
                <TableCell><Typography variant="caption">{entry.startDate ? format(new Date(entry.startDate), 'dd/MM/yyyy', { locale: fr }) : '—'}</Typography></TableCell>
                <TableCell><Typography variant="caption" color={entry.endDate && new Date(entry.endDate) < new Date() ? 'success.main' : 'text.secondary'}>{entry.endDate ? format(new Date(entry.endDate), 'dd/MM/yyyy', { locale: fr }) : 'Permanente'}</Typography></TableCell>
                <TableCell><Typography variant="caption">{entry.issuedBy?.name}</Typography></TableCell>
                <TableCell align="center">
                  {['ADMIN_NATIONAL'].includes(user?.role) && (
                    <Button size="small" variant="outlined" color="success" onClick={() => setLiftDialog(entry)}>Lever</Button>
                  )}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                <Security sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} /><br />
                <Typography color="text.secondary">Aucune entrée dans la liste noire.</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        </TableContainer>
        <TablePagination component="div" count={data?.pagination?.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`} />
      </Card>

      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700} sx={{ color: 'error.main' }}>Ajouter à la liste noire</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>Cette action est irréversible sans validation de l'Admin National.</Alert>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField fullWidth size="small" label="Passeport ou N° dossier" value={passportSearch} onChange={(e) => setPassportSearch(e.target.value.toUpperCase())} />
            <Button variant="outlined" onClick={searchForeigner} startIcon={<Search />}>Chercher</Button>
          </Stack>
          {foundForeigner && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>{foundForeigner.lastName} {foundForeigner.firstName}</strong> — {foundForeigner.nationality} — {foundForeigner.dossierNumber}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Catégorie" value={form.reasonCategory} onChange={(e) => setForm(p => ({ ...p, reasonCategory: e.target.value }))}>
                {REASON_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c.replace(/_/g, ' ')}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth select label="Niveau d'interdiction" value={form.level} onChange={(e) => setForm(p => ({ ...p, level: e.target.value }))}>
                {LEVELS.map(l => <MenuItem key={l} value={l}>{l.replace(/_/g, ' ')}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Motif détaillé *" value={form.reason} onChange={(e) => setForm(p => ({ ...p, reason: e.target.value }))} required />
            </Grid>
            {form.level !== 'INTERDICTION_PERMANENTE' && (
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Date de fin" type="date" InputLabelProps={{ shrink: true }} value={form.endDate} onChange={(e) => setForm(p => ({ ...p, endDate: e.target.value }))} />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog(false)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={() => addMutation.mutate({ foreignerId: foundForeigner?._id, ...form })} disabled={!foundForeigner || !form.reason || addMutation.isPending}>
            {addMutation.isPending ? <CircularProgress size={18} /> : 'Blacklister'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(liftDialog)} onClose={() => setLiftDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700} sx={{ color: 'success.main' }}>Lever l'interdiction</DialogTitle>
        <DialogContent>
          {liftDialog && <Alert severity="info" sx={{ mb: 2, mt: 1 }}>Lever l'interdiction pour: <strong>{liftDialog.foreignerId?.lastName} {liftDialog.foreignerId?.firstName}</strong></Alert>}
          <TextField fullWidth multiline rows={3} label="Motif de la levée *" value={liftReason} onChange={(e) => setLiftReason(e.target.value)} required />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLiftDialog(null)}>Annuler</Button>
          <Button variant="contained" color="success" onClick={() => liftMutation.mutate({ id: liftDialog._id, reason: liftReason })} disabled={!liftReason || liftMutation.isPending}>
            {liftMutation.isPending ? <CircularProgress size={18} /> : 'Lever l\'interdiction'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
