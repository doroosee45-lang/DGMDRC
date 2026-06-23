// @ts-nocheck
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField, MenuItem,
  Alert, CircularProgress, Chip, Avatar, Divider, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, alpha, Stack, InputAdornment
} from '@mui/material';
import { FlightTakeoff, FlightLand, Search, CheckCircle, Warning, Block, Add } from '@mui/icons-material';
import { movementsAPI, foreignersAPI, borderPostsAPI } from '../../services/api';
import { useSnackbar } from 'notistack';
import StatusChip from '../../components/Common/StatusChip';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TRANSPORT_MODES = ['AERIEN', 'TERRESTRE', 'MARITIME', 'AUTRE'];

export default function BorderControl() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const [searchPassport, setSearchPassport] = useState('');
  const [foundForeigner, setFoundForeigner] = useState(null);
  const [checking, setChecking] = useState(false);
  const [passageType, setPassageType] = useState('ENTREE');
  const [formData, setFormData] = useState({ borderPostId: '', transport: { mode: 'AERIEN', reference: '', operator: '' }, provenance: '', destination: '', notes: '' });
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(0);

  const { data: borderPosts } = useQuery({ queryKey: ['borderPosts'], queryFn: () => borderPostsAPI.getAll().then(r => r.data.data) });
  const { data: recentMovements, isLoading: movLoading } = useQuery({
    queryKey: ['movements', 'all', page],
    queryFn: () => movementsAPI.getAll({ page: page + 1, limit: 15 }).then(r => r.data),
    refetchInterval: 15000,
  });

  const canRegister = ['ADMIN_NATIONAL', 'AGENT_DGM', 'AGENT_FRONTALIER_AERIEN', 'AGENT_FRONTALIER_TERRESTRE', 'AGENT_FRONTALIER_MARITIME'].includes(user?.role);

  const checkPassport = async () => {
    if (!searchPassport.trim()) return;
    setChecking(true); setFoundForeigner(null); setResult(null);
    try {
      const { data } = await foreignersAPI.getAll({ search: searchPassport, limit: 5 });
      const byPassport = data.data?.find(f => f.passport?.number?.toUpperCase() === searchPassport.toUpperCase());
      if (byPassport) {
        const full = await foreignersAPI.getOne(byPassport._id);
        setFoundForeigner(full.data.data);
        const bl = await foreignersAPI.checkBlacklist(byPassport.passport.number);
        if (bl.data.data.isBlacklisted) {
          setResult({ status: 'REFUSE', message: '⛔ REFUSÉ — Personne sur la liste noire', color: 'error' });
        } else if (new Date(byPassport.visa?.expiryDate) < new Date()) {
          setResult({ status: 'ALERTE', message: '⚠️ ALERTE — Visa expiré', color: 'warning' });
        } else {
          setResult({ status: 'AUTORISE', message: '✅ AUTORISÉ — Aucune alerte détectée', color: 'success' });
        }
      } else {
        enqueueSnackbar('Aucun dossier trouvé pour ce numéro de passeport', { variant: 'warning' });
      }
    } catch (err) {
      enqueueSnackbar('Erreur lors de la recherche', { variant: 'error' });
    } finally {
      setChecking(false);
    }
  };

  const movementMutation = useMutation({
    mutationFn: (data) => movementsAPI.register(data),
    onSuccess: (res) => {
      const { verificationStatus } = res.data.data;
      const msgs = { AUTORISE: ['Passage enregistré avec succès', 'success'], ALERTE: ['Passage enregistré — ALERTE active', 'warning'], REFUSE: ['Passage REFUSÉ et enregistré', 'error'] };
      const [msg, variant] = msgs[verificationStatus] || ['Enregistré', 'info'];
      enqueueSnackbar(msg, { variant });
      qc.invalidateQueries(['movements']);
      setFoundForeigner(null); setSearchPassport(''); setResult(null);
      setFormData({ borderPostId: '', transport: { mode: 'AERIEN', reference: '', operator: '' }, provenance: '', destination: '', notes: '' });
    },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || 'Erreur', { variant: 'error' }),
  });

  const handleRegister = () => {
    if (!foundForeigner || !formData.borderPostId) { enqueueSnackbar('Complétez tous les champs requis', { variant: 'warning' }); return; }
    movementMutation.mutate({ foreignerId: foundForeigner._id, type: passageType, ...formData });
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} color="primary">Contrôle Frontalier</Typography>
        <Typography color="text.secondary" variant="body2">Enregistrement des entrées et sorties du territoire</Typography>
      </Box>

      {canRegister && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Nouveau Passage</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                  <TextField
                    fullWidth label="Numéro de passeport" value={searchPassport}
                    onChange={(e) => setSearchPassport(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && checkPassport()}
                    placeholder="Ex: FR123456789"
                    InputProps={{ style: { fontFamily: 'monospace', fontWeight: 700 }, startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
                  />
                  <Button variant="contained" onClick={checkPassport} disabled={checking || !searchPassport} sx={{ minWidth: 130, flexShrink: 0 }}>
                    {checking ? <CircularProgress size={20} color="inherit" /> : 'Vérifier'}
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select label="Type de passage" value={passageType} onChange={(e) => setPassageType(e.target.value)}>
                  <MenuItem value="ENTREE"><Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><FlightLand fontSize="small" color="success" />Entrée</Box></MenuItem>
                  <MenuItem value="SORTIE"><Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><FlightTakeoff fontSize="small" color="primary" />Sortie</Box></MenuItem>
                  <MenuItem value="TRANSIT">Transit</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth select label="Poste frontalier *" value={formData.borderPostId} onChange={(e) => setFormData(p => ({ ...p, borderPostId: e.target.value }))} required>
                  {borderPosts?.map(bp => <MenuItem key={bp._id} value={bp._id}>{bp.name} ({bp.type})</MenuItem>)}
                </TextField>
              </Grid>

              {result && (
                <Grid item xs={12}>
                  <Alert severity={result.color === 'success' ? 'success' : result.color === 'warning' ? 'warning' : 'error'} sx={{ fontWeight: 700, fontSize: '1rem' }}>
                    {result.message}
                  </Alert>
                </Grid>
              )}

              {foundForeigner && (
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: alpha('#003087', 0.03), border: '1px solid', borderColor: alpha('#003087', 0.15) }}>
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                        <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.3rem', fontWeight: 800 }}>
                          {foundForeigner.lastName?.[0]}{foundForeigner.firstName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight={800}>{foundForeigner.lastName} {foundForeigner.firstName}</Typography>
                          <Typography variant="body2" color="text.secondary">{foundForeigner.dossierNumber} • {foundForeigner.nationality} • {foundForeigner.passport?.number}</Typography>
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                          <StatusChip status={foundForeigner.currentStatus} />
                          <StatusChip status={foundForeigner.presenceStatus} />
                        </Stack>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <TextField select fullWidth size="small" label="Mode de transport" value={formData.transport.mode} onChange={(e) => setFormData(p => ({ ...p, transport: { ...p.transport, mode: e.target.value } }))}>
                            {TRANSPORT_MODES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth size="small" label="N° de vol/Immatriculation" value={formData.transport.reference} onChange={(e) => setFormData(p => ({ ...p, transport: { ...p.transport, reference: e.target.value } }))} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth size="small" label="Compagnie/Transporteur" value={formData.transport.operator} onChange={(e) => setFormData(p => ({ ...p, transport: { ...p.transport, operator: e.target.value } }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth size="small" label={passageType === 'ENTREE' ? 'Pays de provenance' : 'Destination déclarée'} value={passageType === 'ENTREE' ? formData.provenance : formData.destination} onChange={(e) => setFormData(p => ({ ...p, [passageType === 'ENTREE' ? 'provenance' : 'destination']: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth size="small" label="Notes / Observations" value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} />
                        </Grid>
                      </Grid>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button variant="contained" size="large" onClick={handleRegister} disabled={movementMutation.isPending || result?.status === 'REFUSE'} startIcon={movementMutation.isPending ? <CircularProgress size={18} color="inherit" /> : passageType === 'ENTREE' ? <FlightLand /> : <FlightTakeoff />}
                          color={result?.status === 'REFUSE' ? 'error' : result?.status === 'ALERTE' ? 'warning' : 'primary'}
                          sx={{ fontWeight: 700, minWidth: 200 }}>
                          {movementMutation.isPending ? 'Enregistrement...' : `Enregistrer ${passageType === 'ENTREE' ? "l'entrée" : 'la sortie'}`}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Card>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>Passages Récents</Typography>
          <Chip label={`Total: ${recentMovements?.pagination?.total || 0}`} variant="outlined" size="small" />
        </Box>
        <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date & Heure</TableCell>
              <TableCell>Identité</TableCell>
              <TableCell>Nationalité</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Poste</TableCell>
              <TableCell>Transport</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Agent</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movLoading ? (
              Array.from({ length: 6 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Box sx={{ height: 16, bgcolor: 'grey.100', borderRadius: 1 }} /></TableCell>)}</TableRow>)
            ) : recentMovements?.data?.length > 0 ? recentMovements.data.map((mv) => (
              <TableRow key={mv._id} hover>
                <TableCell><Typography variant="caption" fontWeight={600}>{mv.datetime ? format(new Date(mv.datetime), 'dd/MM HH:mm', { locale: fr }) : '—'}</Typography></TableCell>
                <TableCell>
                  <Box><Typography variant="caption" fontWeight={700}>{mv.foreignerId?.lastName} {mv.foreignerId?.firstName}</Typography><br /><Typography variant="caption" color="text.secondary" fontFamily="monospace">{mv.foreignerId?.dossierNumber}</Typography></Box>
                </TableCell>
                <TableCell><Chip label={mv.foreignerId?.nationality} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                <TableCell><StatusChip status={mv.type} /></TableCell>
                <TableCell><Typography variant="caption">{mv.borderPostId?.name}</Typography></TableCell>
                <TableCell><Typography variant="caption">{mv.transport?.mode} {mv.transport?.reference}</Typography></TableCell>
                <TableCell><StatusChip status={mv.verificationStatus} /></TableCell>
                <TableCell><Typography variant="caption">{mv.agentId?.name}</Typography></TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">Aucun passage enregistré.</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        </TableContainer>
        <TablePagination
          component="div" count={recentMovements?.pagination?.total || 0} page={page}
          onPageChange={(e, p) => setPage(p)} rowsPerPage={15} rowsPerPageOptions={[15]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </Card>
    </Box>
  );
}
