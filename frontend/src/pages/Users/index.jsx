// @ts-nocheck
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination, Chip, Alert, CircularProgress,
  Avatar, IconButton, Tooltip, Stack, alpha
} from '@mui/material';
import { Add, Edit, Block, ManageAccounts } from '@mui/icons-material';
import { usersAPI } from '../../services/api';
import { useSnackbar } from 'notistack';
import StatusChip from '../../components/Common/StatusChip';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ALL_ROLES = ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM', 'AGENT_FRONTALIER_AERIEN', 'AGENT_FRONTALIER_TERRESTRE', 'AGENT_FRONTALIER_MARITIME', 'POLICE_NATIONALE', 'JUSTICE', 'ANR_RENSEIGNEMENT', 'MINISTERE_INTERIEUR', 'AMBASSADE_CONSULAT', 'GOUVERNEMENT_PROVINCIAL', 'AUDITEUR'];
const ROLE_LABELS = { ADMIN_NATIONAL: 'Admin National', ADMIN_PROVINCIAL: 'Admin Provincial', AGENT_DGM: 'Agent DGM', AGENT_FRONTALIER_AERIEN: 'Agent Frontalier Aérien', AGENT_FRONTALIER_TERRESTRE: 'Agent Frontalier Terrestre', AGENT_FRONTALIER_MARITIME: 'Agent Frontalier Maritime', POLICE_NATIONALE: 'Police Nationale', JUSTICE: 'Justice', ANR_RENSEIGNEMENT: 'ANR Renseignement', MINISTERE_INTERIEUR: "Ministère de l'Intérieur", AMBASSADE_CONSULAT: 'Ambassade/Consulat', GOUVERNEMENT_PROVINCIAL: 'Gouvernement Provincial', AUDITEUR: 'Auditeur' };

const EMPTY_FORM = { name: '', email: '', password: '', role: 'AGENT_DGM', institution: '', province: '' };

export default function Users() {
  const { user: currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ role: '', isActive: '' });
  const [dialog, setDialog] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', page, filters],
    queryFn: () => usersAPI.getAll({ page: page + 1, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')) }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: (data) => usersAPI.create(data),
    onSuccess: () => { enqueueSnackbar('Utilisateur créé.', { variant: 'success' }); setDialog(false); setForm(EMPTY_FORM); qc.invalidateQueries(['users']); },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || 'Erreur', { variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usersAPI.update(id, data),
    onSuccess: () => { enqueueSnackbar('Utilisateur mis à jour.', { variant: 'success' }); setEditUser(null); qc.invalidateQueries(['users']); },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || 'Erreur', { variant: 'error' }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => usersAPI.deactivate(id),
    onSuccess: () => { enqueueSnackbar('Compte désactivé.', { variant: 'success' }); qc.invalidateQueries(['users']); },
    onError: (err) => enqueueSnackbar(err.response?.data?.message || 'Erreur', { variant: 'error' }),
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary">Gestion des Utilisateurs</Typography>
          <Typography color="text.secondary" variant="body2">Comptes autorisés à accéder au SIMN</Typography>
        </Box>
        <Button startIcon={<Add />} variant="contained" onClick={() => setDialog(true)}>Créer un compte</Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={2}>
            <TextField size="small" select label="Rôle" value={filters.role} onChange={(e) => setFilters(p => ({ ...p, role: e.target.value }))} sx={{ minWidth: 200 }}>
              <MenuItem value="">Tous</MenuItem>
              {ALL_ROLES.map(r => <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>)}
            </TextField>
            <TextField size="small" select label="Statut" value={filters.isActive} onChange={(e) => setFilters(p => ({ ...p, isActive: e.target.value }))} sx={{ minWidth: 130 }}>
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="true">Actifs</MenuItem>
              <MenuItem value="false">Inactifs</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Institution</TableCell>
              <TableCell>Province</TableCell>
              <TableCell>Dernière connexion</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>2FA</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Box sx={{ height: 14, bgcolor: 'grey.100', borderRadius: 1 }} /></TableCell>)}</TableRow>)
            ) : data?.data?.length > 0 ? data.data.map((u) => (
              <TableRow key={u._id} hover sx={{ opacity: u.isActive ? 1 : 0.5 }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#003087', 0.1), color: 'primary.main', fontSize: '0.75rem', fontWeight: 700 }}>
                      {u.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Avatar>
                    <Box>
                      <Typography variant="caption" fontWeight={700}>{u.name}</Typography><br />
                      <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell><Chip label={ROLE_LABELS[u.role] || u.role} size="small" color="primary" variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                <TableCell><Typography variant="caption">{u.institution}</Typography></TableCell>
                <TableCell><Typography variant="caption">{u.province || '—'}</Typography></TableCell>
                <TableCell><Typography variant="caption">{u.lastLogin ? format(new Date(u.lastLogin), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'Jamais'}</Typography></TableCell>
                <TableCell><Chip label={u.isActive ? 'Actif' : 'Inactif'} size="small" color={u.isActive ? 'success' : 'default'} sx={{ fontWeight: 700 }} /></TableCell>
                <TableCell><Chip label={u.twoFactorEnabled ? '✓ 2FA' : '✗ 2FA'} size="small" color={u.twoFactorEnabled ? 'success' : 'warning'} variant="outlined" sx={{ fontSize: '0.7rem' }} /></TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={0.5} justifyContent="center">
                    <Tooltip title="Modifier">
                      <IconButton size="small" color="primary" onClick={() => { setEditUser(u); setForm({ name: u.name, email: u.email, role: u.role, institution: u.institution, province: u.province || '', password: '' }); }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {u.isActive && String(u._id) !== String(currentUser?._id) && (
                      <Tooltip title="Désactiver">
                        <IconButton size="small" color="error" onClick={() => { if (window.confirm('Désactiver ce compte?')) deactivateMutation.mutate(u._id); }}>
                          <Block fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><Typography color="text.secondary">Aucun utilisateur trouvé.</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        </TableContainer>
        <TablePagination component="div" count={data?.pagination?.total || 0} page={page} onPageChange={(e, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]} labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`} />
      </Card>

      {[{ open: dialog, onClose: () => setDialog(false), title: 'Créer un utilisateur', isCreate: true }, { open: Boolean(editUser), onClose: () => setEditUser(null), title: 'Modifier l\'utilisateur', isCreate: false }].map(({ open, onClose, title, isCreate }) => (
        <Dialog key={title} open={open} onClose={onClose} maxWidth="sm" fullWidth>
          <DialogTitle fontWeight={700}>{title}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}><TextField fullWidth label="Nom complet *" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Email professionnel *" type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} /></Grid>
              {isCreate && <Grid item xs={12}><TextField fullWidth label="Mot de passe *" type="password" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} /></Grid>}
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Rôle *" value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}>
                  {ALL_ROLES.map(r => <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Province" value={form.province} onChange={(e) => setForm(p => ({ ...p, province: e.target.value }))} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Institution *" value={form.institution} onChange={(e) => setForm(p => ({ ...p, institution: e.target.value }))} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Annuler</Button>
            <Button variant="contained" onClick={() => isCreate ? createMutation.mutate(form) : updateMutation.mutate({ id: editUser._id, data: form })} disabled={isCreate ? createMutation.isPending : updateMutation.isPending}>
              {isCreate ? (createMutation.isPending ? <CircularProgress size={18} /> : 'Créer') : (updateMutation.isPending ? <CircularProgress size={18} /> : 'Enregistrer')}
            </Button>
          </DialogActions>
        </Dialog>
      ))}
    </Box>
  );
}
