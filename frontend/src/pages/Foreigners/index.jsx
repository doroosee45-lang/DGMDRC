import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Avatar, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel, Chip, alpha, Stack, CircularProgress
} from '@mui/material';
import { Search, Add, Visibility, Edit, People, FilterList, Refresh } from '@mui/icons-material';
import { foreignersAPI } from '../../services/api';
import StatusChip from '../../components/Common/StatusChip';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const NATIONALITIES_LABELS = { FRA: 'France', NGA: 'Nigeria', CHN: 'Chine', ZAF: 'Afrique du Sud', BEL: 'Belgique', USA: 'États-Unis', GBR: 'Royaume-Uni', ESP: 'Espagne', ITA: 'Italie', CMR: 'Cameroun', SEN: 'Sénégal', CIV: "Côte d'Ivoire", ZMB: 'Zambie', UGA: 'Ouganda', RWA: 'Rwanda', BDI: 'Burundi', TZA: 'Tanzanie', AGO: 'Angola', ZWE: 'Zimbabwe' };

export default function Foreigners() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canCreate = ['ADMIN_NATIONAL', 'AGENT_DGM'].includes(user?.role);

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', nationality: '', isBlacklisted: '' });
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['foreigners', page, limit, search, filters],
    queryFn: () => foreignersAPI.getAll({ page: page + 1, limit, search, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')) }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary">Dossiers Étrangers</Typography>
          <Typography color="text.secondary" variant="body2">Gestion centralisée des dossiers migratoires</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={isFetching ? <CircularProgress size={14} color="inherit" /> : <Refresh />} onClick={refetch} variant="outlined" size="small" disabled={isFetching}>{isFetching ? 'Actualisation...' : 'Actualiser'}</Button>
          {canCreate && (
            <Button startIcon={<Add />} variant="contained" onClick={() => navigate('/etrangers/nouveau')} sx={{ fontWeight: 700 }}>
              Nouveau Dossier
            </Button>
          )}
        </Stack>
      </Box>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Rechercher par nom, prénom, passeport, dossier..." size="small"
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              sx={{ flexGrow: 1, minWidth: 280 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary' }} /></InputAdornment> }}
            />
            <Button startIcon={<FilterList />} variant={showFilters ? 'contained' : 'outlined'} size="small" onClick={() => setShowFilters(!showFilters)}>
              Filtres
            </Button>
          </Box>
          {showFilters && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Statut</InputLabel>
                <Select value={filters.status} label="Statut" onChange={(e) => { setFilters(p => ({ ...p, status: e.target.value })); setPage(0); }}>
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="EN_REGLE">En règle</MenuItem>
                  <MenuItem value="EN_ALERTE">En alerte</MenuItem>
                  <MenuItem value="EN_INFRACTION">En infraction</MenuItem>
                  <MenuItem value="EXPULSE">Expulsé</MenuItem>
                  <MenuItem value="BLACKLISTE">Blacklisté</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Blacklist</InputLabel>
                <Select value={filters.isBlacklisted} label="Blacklist" onChange={(e) => { setFilters(p => ({ ...p, isBlacklisted: e.target.value })); setPage(0); }}>
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="true">Blacklistés</MenuItem>
                  <MenuItem value="false">Non blacklistés</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            {isLoading ? 'Chargement...' : `${data?.pagination?.total?.toLocaleString('fr-FR') || 0} dossier(s)`}
          </Typography>
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>N° Dossier</TableCell>
                <TableCell>Identité</TableCell>
                <TableCell>Nationalité</TableCell>
                <TableCell>Passeport</TableCell>
                <TableCell>Visa</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Présence</TableCell>
                <TableCell>Créé le</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => <TableCell key={j}><Box sx={{ height: 20, bgcolor: 'grey.100', borderRadius: 1 }} /></TableCell>)}
                  </TableRow>
                ))
              ) : data?.data?.length > 0 ? (
                data.data.map((f) => (
                  <TableRow key={f._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/etrangers/${f._id}`)}>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main', fontSize: '0.78rem' }}>{f.dossierNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#003087', 0.1), color: 'primary.main', fontSize: '0.75rem', fontWeight: 700 }}>
                          {f.lastName?.[0]}{f.firstName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.2 }}>{f.lastName} {f.firstName}</Typography>
                          {f.middleName && <Typography variant="caption" color="text.secondary">{f.middleName}</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={NATIONALITIES_LABELS[f.nationality] || f.nationality} size="small" variant="outlined" sx={{ fontSize: '0.72rem' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace" fontWeight={600}>{f.passport?.number}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Chip label={f.visa?.type} size="small" variant="outlined" color="info" sx={{ fontSize: '0.7rem', mb: 0.3 }} />
                        <Typography variant="caption" display="block" color={new Date(f.visa?.expiryDate) < new Date() ? 'error' : 'text.secondary'} fontWeight={600}>
                          Exp: {f.visa?.expiryDate ? format(new Date(f.visa.expiryDate), 'dd/MM/yyyy') : '—'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell><StatusChip status={f.currentStatus} /></TableCell>
                    <TableCell><StatusChip status={f.presenceStatus} /></TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {f.createdAt ? format(new Date(f.createdAt), 'dd/MM/yyyy', { locale: fr }) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="Consulter"><IconButton size="small" onClick={() => navigate(`/etrangers/${f._id}`)} color="primary"><Visibility fontSize="small" /></IconButton></Tooltip>
                        {canCreate && <Tooltip title="Modifier"><IconButton size="small" onClick={() => navigate(`/etrangers/${f._id}/modifier`)} color="warning"><Edit fontSize="small" /></IconButton></Tooltip>}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <People sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">Aucun dossier trouvé</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={data?.pagination?.total || 0} page={page}
          onPageChange={(e, p) => setPage(p)} rowsPerPage={limit}
          onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Par page:" labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </Card>
    </Box>
  );
}
