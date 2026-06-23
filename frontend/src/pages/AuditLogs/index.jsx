// @ts-nocheck
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination, Chip, Alert, CircularProgress,
  Stack, Button, alpha, Tooltip, Grid
} from '@mui/material';
import { History, VerifiedUser, Refresh } from '@mui/icons-material';
import { auditAPI } from '../../services/api';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const ACTION_COLORS = {
  CREATION: 'success', LECTURE: 'default', MODIFICATION: 'warning', SUPPRESSION_LOGIQUE: 'error',
  VALIDATION: 'success', REJET: 'error', EXPORT: 'warning', CONNEXION: 'info',
  DECONNEXION: 'default', TENTATIVE_CONNEXION_ECHOUEE: 'error', VERROUILLAGE_COMPTE: 'error',
  ENREGISTREMENT_MOUVEMENT: 'info', AJOUT_INFRACTION: 'error', CREATION_ALERTE: 'warning',
  RESOLUTION_ALERTE: 'success', BLACKLIST: 'error', DEBLOCAGE_BLACKLIST: 'success',
  DEMANDE_CORRECTION: 'warning', VALIDATION_CORRECTION: 'success', GENERATION_RAPPORT: 'info',
  ACCES_REFUSE: 'error', ACTIVATION_2FA: 'success', DESACTIVATION_2FA: 'warning',
};
const SEVERITY_COLORS = { INFO: 'default', AVERTISSEMENT: 'warning', CRITIQUE: 'error' };
const ACTIONS = ['CREATION', 'LECTURE', 'MODIFICATION', 'SUPPRESSION_LOGIQUE', 'VALIDATION', 'REJET', 'EXPORT', 'CONNEXION', 'DECONNEXION', 'TENTATIVE_CONNEXION_ECHOUEE', 'ENREGISTREMENT_MOUVEMENT', 'AJOUT_INFRACTION', 'CREATION_ALERTE', 'RESOLUTION_ALERTE', 'BLACKLIST', 'DEMANDE_CORRECTION', 'VALIDATION_CORRECTION', 'ACTIVATION_2FA', 'DESACTIVATION_2FA', 'ACCES_REFUSE'];

export default function AuditLogs() {
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ action: '', severity: '', dateFrom: '', dateTo: '' });
  const [chainVerified, setChainVerified] = useState(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['auditLogs', page, filters],
    queryFn: () => auditAPI.getLogs({ page: page + 1, limit: 50, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')) }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const { data: stats } = useQuery({ queryKey: ['auditStats'], queryFn: () => auditAPI.getStats().then(r => r.data.data) });

  const verifyChain = async () => {
    try {
      const { data: res } = await auditAPI.verifyChain();
      setChainVerified(res.data);
    } catch { setChainVerified({ isValid: false }); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary">Journaux d'Audit</Typography>
          <Typography color="text.secondary" variant="body2">Traçabilité immuable — Chaîne de hashes SHA-256</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<VerifiedUser />} variant="outlined" color="success" onClick={verifyChain}>Vérifier intégrité</Button>
          <Button startIcon={isFetching ? <CircularProgress size={16} color="inherit" /> : <Refresh />} onClick={refetch} variant="outlined" disabled={isFetching}>{isFetching ? 'Actualisation...' : 'Actualiser'}</Button>
        </Stack>
      </Box>

      {chainVerified && (
        <Alert severity={chainVerified.isValid ? 'success' : 'error'} sx={{ mb: 2 }} icon={<VerifiedUser />}>
          {chainVerified.isValid
            ? `✅ Chaîne intègre — ${chainVerified.totalLogs?.toLocaleString('fr-FR')} logs vérifiés.`
            : `❌ Intégrité compromise — ${chainVerified.issues?.length || '?'} anomalie(s) détectée(s).`
          }
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2}>
          <Card sx={{ bgcolor: alpha('#003087', 0.05), border: '1px solid', borderColor: alpha('#003087', 0.15) }}>
            <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color="primary">{stats?.totalLogs?.toLocaleString('fr-FR') ?? '—'}</Typography>
              <Typography variant="caption" color="primary.main" fontWeight={600}>Total logs</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card sx={{ bgcolor: alpha('#0052CC', 0.05), border: '1px solid', borderColor: alpha('#0052CC', 0.15) }}>
            <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#0052CC' }}>{stats?.todayLogs?.toLocaleString('fr-FR') ?? '—'}</Typography>
              <Typography variant="caption" sx={{ color: '#0052CC', fontWeight: 600 }}>Aujourd'hui</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <TextField size="small" select label="Action" value={filters.action} onChange={(e) => { setFilters(p => ({ ...p, action: e.target.value })); setPage(0); }} sx={{ minWidth: 220 }}>
              <MenuItem value="">Toutes</MenuItem>
              {ACTIONS.map(a => <MenuItem key={a} value={a}>{a.replace(/_/g, ' ')}</MenuItem>)}
            </TextField>
            <TextField size="small" select label="Sévérité" value={filters.severity} onChange={(e) => { setFilters(p => ({ ...p, severity: e.target.value })); setPage(0); }} sx={{ minWidth: 140 }}>
              <MenuItem value="">Toutes</MenuItem>
              <MenuItem value="INFO">Info</MenuItem>
              <MenuItem value="AVERTISSEMENT">Avertissement</MenuItem>
              <MenuItem value="CRITIQUE">Critique</MenuItem>
            </TextField>
            <TextField size="small" label="Du" type="date" InputLabelProps={{ shrink: true }} value={filters.dateFrom} onChange={(e) => setFilters(p => ({ ...p, dateFrom: e.target.value }))} />
            <TextField size="small" label="Au" type="date" InputLabelProps={{ shrink: true }} value={filters.dateTo} onChange={(e) => setFilters(p => ({ ...p, dateTo: e.target.value }))} />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Horodatage</TableCell>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Ressource</TableCell>
              <TableCell>Cible</TableCell>
              <TableCell>Sévérité</TableCell>
              <TableCell>IP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Box sx={{ height: 14, bgcolor: 'grey.100', borderRadius: 1 }} /></TableCell>)}</TableRow>
              ))
            ) : data?.data?.length > 0 ? data.data.map((log) => (
              <TableRow key={log._id} hover sx={{ bgcolor: log.severity === 'CRITIQUE' ? alpha('#D32F2F', 0.03) : 'inherit' }}>
                <TableCell>
                  <Tooltip title={log.createdAt ? format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: fr }) : ''}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {log.createdAt ? format(new Date(log.createdAt), 'dd/MM HH:mm:ss') : '—'}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell><Typography variant="caption" fontWeight={600}>{log.userName}</Typography></TableCell>
                <TableCell><Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{log.userRole?.replace(/_/g, ' ')}</Typography></TableCell>
                <TableCell>
                  <Chip label={log.action?.replace(/_/g, ' ')} size="small" color={ACTION_COLORS[log.action] || 'default'} sx={{ fontSize: '0.68rem', height: 20, fontWeight: 600 }} />
                </TableCell>
                <TableCell><Typography variant="caption">{log.targetType}</Typography></TableCell>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Tooltip title={log.targetLabel || log.targetId}>
                    <Typography variant="caption" noWrap sx={{ display: 'block' }}>{log.targetLabel || log.targetId?.slice(0, 20)}</Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Chip label={log.severity} size="small" color={SEVERITY_COLORS[log.severity] || 'default'} sx={{ fontSize: '0.68rem', height: 20 }} />
                </TableCell>
                <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{log.ipAddress}</Typography></TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                <History sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} /><br />
                <Typography color="text.secondary">Aucun log trouvé.</Typography>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        </TableContainer>
        <TablePagination component="div" count={data?.pagination?.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={50} rowsPerPageOptions={[50]} labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`} />
      </Card>
    </Box>
  );
}
