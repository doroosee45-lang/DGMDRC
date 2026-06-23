// @ts-nocheck
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination, Chip, Alert, CircularProgress,
  Avatar, alpha, Stack, Tooltip, IconButton
} from '@mui/material';
import { Warning, CheckCircle, Refresh, FilterList } from '@mui/icons-material';
import { alertsAPI } from '../../services/api';
import { useSnackbar } from 'notistack';
import StatusChip from '../../components/Common/StatusChip';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const SEVERITY_ORDER = { CRITIQUE: 0, HAUTE: 1, MOYENNE: 2, BASSE: 3 };
const SEVERITY_COLORS = { CRITIQUE: 'error', HAUTE: 'warning', MOYENNE: 'info', BASSE: 'success' };

export default function Alerts() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ status: '', severity: '', type: '' });
  const [resolveDialog, setResolveDialog] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['alerts', page, filters],
    queryFn: () => alertsAPI.getAll({ page: page + 1, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')) }).then(r => r.data),
    refetchInterval: 30000,
    placeholderData: (prev) => prev,
  });

  const { data: stats } = useQuery({ queryKey: ['alertStats'], queryFn: () => alertsAPI.getStats().then(r => r.data.data), refetchInterval: 30000 });

  const resolveMutation = useMutation({
    mutationFn: ({ id, note }) => alertsAPI.resolve(id, { resolutionNote: note }),
    onSuccess: () => { enqueueSnackbar('Alerte résolue.', { variant: 'success' }); setResolveDialog(null); setResolutionNote(''); qc.invalidateQueries(['alerts']); qc.invalidateQueries(['alertStats']); },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || 'Erreur', { variant: 'error' }),
  });

  const canResolve = ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM', 'AGENT_FRONTALIER_AERIEN', 'AGENT_FRONTALIER_TERRESTRE', 'AGENT_FRONTALIER_MARITIME', 'POLICE_NATIONALE', 'ANR_RENSEIGNEMENT'].includes(user?.role);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary">Alertes</Typography>
          <Typography color="text.secondary" variant="body2">Système de surveillance et d'alerte migratoire</Typography>
        </Box>
        <Button startIcon={isFetching ? <CircularProgress size={16} color="inherit" /> : <Refresh />} onClick={refetch} variant="outlined" disabled={isFetching}>{isFetching ? 'Actualisation...' : 'Actualiser'}</Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[{ label: 'Critiques', value: stats?.critique, color: '#D32F2F' }, { label: 'Hautes', value: stats?.haute, color: '#E65100' }, { label: 'Moyennes', value: stats?.moyenne, color: '#0052CC' }, { label: 'Total actives', value: stats?.active, color: '#003087' }].map(s => (
          <Grid item xs={6} md={3} key={s.label}>
            <Card sx={{ bgcolor: alpha(s.color, 0.06), border: '1px solid', borderColor: alpha(s.color, 0.2) }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight={800} sx={{ color: s.color }}>{s.value ?? '—'}</Typography>
                <Typography variant="caption" sx={{ color: s.color, fontWeight: 600 }}>{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField size="small" select label="Statut" value={filters.status} onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(0); }} sx={{ minWidth: 140 }}>
              <MenuItem value="">Actives</MenuItem>
              <MenuItem value="RESOLUE">Résolues</MenuItem>
              <MenuItem value="IGNOREE">Ignorées</MenuItem>
            </TextField>
            <TextField size="small" select label="Sévérité" value={filters.severity} onChange={(e) => { setFilters(p => ({ ...p, severity: e.target.value })); setPage(0); }} sx={{ minWidth: 140 }}>
              <MenuItem value="">Toutes</MenuItem>
              <MenuItem value="CRITIQUE">Critique</MenuItem>
              <MenuItem value="HAUTE">Haute</MenuItem>
              <MenuItem value="MOYENNE">Moyenne</MenuItem>
              <MenuItem value="BASSE">Basse</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Sévérité</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Étranger</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Il y a</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Box sx={{ height: 16, bgcolor: 'grey.100', borderRadius: 1 }} /></TableCell>)}</TableRow>)
            ) : data?.data?.length > 0 ? data.data.map((alert) => (
              <TableRow key={alert._id} hover sx={{ bgcolor: alert.severity === 'CRITIQUE' && alert.status === 'ACTIVE' ? alpha('#D32F2F', 0.03) : 'inherit' }}>
                <TableCell>
                  <Chip label={alert.severity} size="small" color={SEVERITY_COLORS[alert.severity] || 'default'} sx={{ fontWeight: 800, fontSize: '0.72rem' }} />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>{alert.type?.replace(/_/g, ' ')}</Typography>
                  {alert.isAutomatic && <Chip label="AUTO" size="small" sx={{ ml: 0.5, fontSize: '0.6rem', height: 16 }} />}
                </TableCell>
                <TableCell sx={{ maxWidth: 280 }}>
                  <Typography variant="caption">{alert.message}</Typography>
                </TableCell>
                <TableCell>
                  {alert.foreignerId ? (
                    <Box sx={{ cursor: 'pointer' }} onClick={() => navigate(`/etrangers/${alert.foreignerId._id}`)}>
                      <Typography variant="caption" fontWeight={700} color="primary">{alert.foreignerId.lastName} {alert.foreignerId.firstName}</Typography><br />
                      <Typography variant="caption" color="text.secondary">{alert.foreignerId.nationality} — {alert.foreignerId.dossierNumber}</Typography>
                    </Box>
                  ) : '—'}
                </TableCell>
                <TableCell><StatusChip status={alert.status} /></TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {alert.createdAt ? formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: fr }) : '—'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {canResolve && alert.status === 'ACTIVE' && (
                    <Tooltip title="Marquer résolue">
                      <IconButton size="small" color="success" onClick={() => setResolveDialog(alert)}>
                        <CheckCircle fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                <CheckCircle sx={{ fontSize: 48, color: 'success.light', mb: 1 }} />
                <Typography color="text.secondary">Aucune alerte active.</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        </TableContainer>
        <TablePagination component="div" count={data?.pagination?.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`} />
      </Card>

      <Dialog open={Boolean(resolveDialog)} onClose={() => setResolveDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Résoudre l'alerte</DialogTitle>
        <DialogContent>
          {resolveDialog && (
            <Alert severity={SEVERITY_COLORS[resolveDialog.severity] || 'info'} sx={{ mb: 2, mt: 1 }}>
              <strong>{resolveDialog.type?.replace(/_/g, ' ')}</strong> — {resolveDialog.message}
            </Alert>
          )}
          <TextField fullWidth multiline rows={3} label="Note de résolution *" value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} placeholder="Décrivez les actions prises pour résoudre cette alerte..." />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolveDialog(null)}>Annuler</Button>
          <Button variant="contained" color="success" onClick={() => resolveMutation.mutate({ id: resolveDialog._id, note: resolutionNote })} disabled={!resolutionNote || resolveMutation.isPending}>
            {resolveMutation.isPending ? <CircularProgress size={18} /> : 'Résoudre'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
