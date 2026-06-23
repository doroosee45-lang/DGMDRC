// @ts-nocheck
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination, Chip, Alert, CircularProgress,
  Stack, alpha, Tooltip
} from '@mui/material';
import { Edit, CheckCircle, Cancel, Refresh } from '@mui/icons-material';
import { correctionsAPI } from '../../services/api';
import { useSnackbar } from 'notistack';
import StatusChip from '../../components/Common/StatusChip';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const PROTECTION_COLORS = { CRITIQUE: 'error', HAUTE: 'warning', NORMALE: 'info' };

export default function Corrections() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ status: '', protectionLevel: '' });
  const [reviewDialog, setReviewDialog] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [decision, setDecision] = useState('');

  const canValidate = ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL'].includes(user?.role);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['corrections', page, filters],
    queryFn: () => correctionsAPI.getAll({ page: page + 1, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')) }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const validateMutation = useMutation({
    mutationFn: ({ id, decision, reviewNote }) => correctionsAPI.validate(id, { decision, reviewNote }),
    onSuccess: (_, vars) => {
      enqueueSnackbar(`Demande ${vars.decision === 'VALIDEE' ? 'validée et appliquée' : 'rejetée'}.`, { variant: vars.decision === 'VALIDEE' ? 'success' : 'warning' });
      setReviewDialog(null); setReviewNote(''); setDecision('');
      qc.invalidateQueries(['corrections']);
    },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || 'Erreur', { variant: 'error' }),
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary">Demandes de Correction</Typography>
          <Typography color="text.secondary" variant="body2">Workflow de correction des données critiques</Typography>
        </Box>
        <Button startIcon={isFetching ? <CircularProgress size={16} color="inherit" /> : <Refresh />} onClick={refetch} variant="outlined" disabled={isFetching}>{isFetching ? 'Actualisation...' : 'Actualiser'}</Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Les corrections de champs <strong>CRITIQUES</strong> (identité, passeport) nécessitent la validation de l'Administrateur National.
        Les corrections <strong>HAUTE</strong> peuvent être validées par un Administrateur Provincial ou National.
      </Alert>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={2}>
            <TextField size="small" select label="Statut" value={filters.status} onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(0); }} sx={{ minWidth: 160 }}>
              <MenuItem value="">En attente</MenuItem>
              <MenuItem value="VALIDEE">Validées</MenuItem>
              <MenuItem value="REJETEE">Rejetées</MenuItem>
              <MenuItem value="ANNULEE">Annulées</MenuItem>
            </TextField>
            <TextField size="small" select label="Niveau de protection" value={filters.protectionLevel} onChange={(e) => { setFilters(p => ({ ...p, protectionLevel: e.target.value })); setPage(0); }} sx={{ minWidth: 180 }}>
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="CRITIQUE">Critique</MenuItem>
              <MenuItem value="HAUTE">Haute</MenuItem>
              <MenuItem value="NORMALE">Normale</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date soumission</TableCell>
              <TableCell>Étranger</TableCell>
              <TableCell>Champ</TableCell>
              <TableCell>Protection</TableCell>
              <TableCell>Ancienne valeur</TableCell>
              <TableCell>Nouvelle valeur</TableCell>
              <TableCell>Soumis par</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Box sx={{ height: 14, bgcolor: 'grey.100', borderRadius: 1 }} /></TableCell>)}</TableRow>)
            ) : data?.data?.length > 0 ? data.data.map((cr) => (
              <TableRow key={cr._id} hover sx={{ bgcolor: cr.protectionLevel === 'CRITIQUE' ? alpha('#D32F2F', 0.02) : 'inherit' }}>
                <TableCell>
                  <Tooltip title={cr.createdAt ? format(new Date(cr.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }) : ''}>
                    <Typography variant="caption">{cr.createdAt ? formatDistanceToNow(new Date(cr.createdAt), { addSuffix: true, locale: fr }) : '—'}</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" fontWeight={700}>{cr.foreignerId?.lastName} {cr.foreignerId?.firstName}</Typography><br />
                  <Typography variant="caption" color="text.secondary">{cr.foreignerId?.dossierNumber}</Typography>
                </TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>{cr.fieldLabel}</Typography></TableCell>
                <TableCell><Chip label={cr.protectionLevel} size="small" color={PROTECTION_COLORS[cr.protectionLevel] || 'default'} sx={{ fontWeight: 700, fontSize: '0.68rem' }} /></TableCell>
                <TableCell sx={{ maxWidth: 150 }}><Typography variant="caption" color="error.main" sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{String(cr.oldValue)?.slice(0, 30)}</Typography></TableCell>
                <TableCell sx={{ maxWidth: 150 }}><Typography variant="caption" color="success.main" sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{String(cr.newValue)?.slice(0, 30)}</Typography></TableCell>
                <TableCell>
                  <Typography variant="caption" fontWeight={600}>{cr.requestedBy?.name}</Typography><br />
                  <Typography variant="caption" color="text.secondary">{cr.requestedBy?.role?.replace(/_/g, ' ')}</Typography>
                </TableCell>
                <TableCell><StatusChip status={cr.status} /></TableCell>
                <TableCell align="center">
                  {canValidate && (cr.status === 'EN_ATTENTE' || cr.status === 'EN_REVISION') && (
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Valider">
                        <Button size="small" variant="outlined" color="success" onClick={() => { setReviewDialog(cr); setDecision('VALIDEE'); }}><CheckCircle fontSize="small" /></Button>
                      </Tooltip>
                      <Tooltip title="Rejeter">
                        <Button size="small" variant="outlined" color="error" onClick={() => { setReviewDialog(cr); setDecision('REJETEE'); }}><Cancel fontSize="small" /></Button>
                      </Tooltip>
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}><Edit sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} /><br /><Typography color="text.secondary">Aucune demande de correction en attente.</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        </TableContainer>
        <TablePagination component="div" count={data?.pagination?.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`} />
      </Card>

      <Dialog open={Boolean(reviewDialog)} onClose={() => setReviewDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700} sx={{ color: decision === 'VALIDEE' ? 'success.main' : 'error.main' }}>
          {decision === 'VALIDEE' ? '✅ Valider la correction' : '❌ Rejeter la demande'}
        </DialogTitle>
        <DialogContent>
          {reviewDialog && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>{reviewDialog.fieldLabel}</Typography>
              <Typography variant="body2">Ancienne valeur: <strong style={{ color: '#D32F2F' }}>{String(reviewDialog.oldValue)}</strong></Typography>
              <Typography variant="body2">Nouvelle valeur: <strong style={{ color: '#2E7D32' }}>{String(reviewDialog.newValue)}</strong></Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>Justification: {reviewDialog.reason}</Typography>
            </Box>
          )}
          {decision === 'VALIDEE' && reviewDialog?.protectionLevel === 'CRITIQUE' && user?.role !== 'ADMIN_NATIONAL' && (
            <Alert severity="error" sx={{ mb: 2 }}>Cette correction critique nécessite la validation de l'Administrateur National.</Alert>
          )}
          <TextField fullWidth multiline rows={3} label={`Note de ${decision === 'VALIDEE' ? 'validation' : 'rejet'} *`} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(null)}>Annuler</Button>
          <Button variant="contained" color={decision === 'VALIDEE' ? 'success' : 'error'}
            onClick={() => validateMutation.mutate({ id: reviewDialog._id, decision, reviewNote })}
            disabled={!reviewNote || validateMutation.isPending}>
            {validateMutation.isPending ? <CircularProgress size={18} /> : (decision === 'VALIDEE' ? 'Valider et appliquer' : 'Rejeter')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
