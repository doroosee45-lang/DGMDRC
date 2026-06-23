import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Box, Card, CardContent, Typography, Grid, Chip, alpha, TextField, Button, Stack, MenuItem, Divider, CircularProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { BarChart as BarIcon, Download, Refresh, TableChart, PictureAsPdf } from '@mui/icons-material';
import { reportsAPI } from '../../services/api';
import { useSnackbar } from 'notistack';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['#003087', '#0052CC', '#E8A000', '#2E7D32', '#D32F2F', '#7B1FA2', '#0097A7', '#FF6F00'];
const NATL_LABELS = { FRA: 'France', NGA: 'Nigéria', CHN: 'Chine', ZAF: 'Afr. du Sud', BEL: 'Belgique', USA: 'USA', GBR: 'UK', ESP: 'Espagne', CMR: 'Cameroun', UGA: 'Ouganda', ZMB: 'Zambie', TZA: 'Tanzanie', AGO: 'Angola', RWA: 'Rwanda' };

export default function Reports() {
  const { enqueueSnackbar } = useSnackbar();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const res = await reportsAPI.exportForeigners({ format, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const mime = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const url = URL.createObjectURL(new Blob([res.data], { type: mime }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `dgm-etrangers-${new Date().toISOString().split('T')[0]}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      enqueueSnackbar('Export téléchargé avec succès.', { variant: 'success' });
    } catch {
      enqueueSnackbar('Erreur lors de l\'export.', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const { data: stats, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['reportStats', dateFrom, dateTo],
    queryFn: () => reportsAPI.getStats({ dateFrom, dateTo }).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const byStatusData = stats?.byStatus?.map(s => ({ name: s._id?.replace(/_/g, ' '), value: s.count })) || [];
  const byNationalityData = stats?.byNationality?.slice(0, 8).map(n => ({ name: NATL_LABELS[n._id] || n._id, value: n.count })) || [];
  const byVisaData = stats?.byVisa?.map(v => ({ name: v._id, value: v.count })) || [];

  const monthlyFlowData = (() => {
    if (!stats?.monthlyFlow) return [];
    const map = {};
    for (const item of stats.monthlyFlow) {
      const key = `${String(item._id.month).padStart(2, '0')}/${item._id.year}`;
      if (!map[key]) map[key] = { mois: key, ENTREE: 0, SORTIE: 0 };
      map[key][item._id.type] = item.count;
    }
    return Object.values(map).slice(-12);
  })();

  const infractionData = stats?.infractions?.byNature?.slice(0, 8).map(i => ({ name: i._id?.replace(/_/g, ' '), value: i.count })) || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary">Rapports & Statistiques</Typography>
          <Typography color="text.secondary" variant="body2">Données migratoires nationales — RDC</Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          <Button startIcon={isFetching ? <CircularProgress size={16} color="inherit" /> : <Refresh />} onClick={refetch} variant="outlined" disabled={isFetching}>{isFetching ? 'Actualisation...' : 'Actualiser'}</Button>
          <Button startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <TableChart />} onClick={() => handleExport('xlsx')} variant="outlined" color="success" disabled={exporting}>Excel</Button>
          <Button startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdf />} onClick={() => handleExport('pdf')} variant="outlined" color="error" disabled={exporting}>PDF</Button>
        </Stack>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Typography variant="subtitle2" fontWeight={600}>Période:</Typography>
            <TextField size="small" label="Du" type="date" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <TextField size="small" label="Au" type="date" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            <Button variant="outlined" size="small" onClick={() => { setDateFrom(''); setDateTo(''); }}>Réinitialiser</Button>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total dossiers', value: stats?.summary?.totalForeigners, color: '#003087' },
          { label: 'Présents en RDC', value: stats?.summary?.presentNow, color: '#2E7D32' },
          { label: 'Entrées (période)', value: stats?.summary?.recentEntries, color: '#0052CC' },
          { label: 'Sorties (période)', value: stats?.summary?.recentExits, color: '#E8A000' },
          { label: 'Blacklistés', value: stats?.summary?.blacklistCount, color: '#D32F2F' },
        ].map(s => (
          <Grid item xs={12} sm={4} md key={s.label}>
            <Card sx={{ bgcolor: alpha(s.color, 0.06), border: '1px solid', borderColor: alpha(s.color, 0.2) }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight={800} sx={{ color: s.color }}>{s.value?.toLocaleString('fr-FR') ?? '—'}</Typography>
                <Typography variant="caption" sx={{ color: s.color, fontWeight: 600 }}>{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Flux Entrées / Sorties (12 derniers mois)</Typography>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyFlowData}>
                  <XAxis dataKey="mois" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="ENTREE" stroke="#2E7D32" fill={alpha('#2E7D32', 0.1)} strokeWidth={2} name="Entrées" />
                  <Area type="monotone" dataKey="SORTIE" stroke="#003087" fill={alpha('#003087', 0.1)} strokeWidth={2} name="Sorties" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Statuts migratoires</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={byStatusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {byStatusData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v.toLocaleString('fr-FR'), 'Dossiers']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Top Nationalités</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byNationalityData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip formatter={(v) => [v.toLocaleString('fr-FR'), 'Dossiers']} />
                  <Bar dataKey="value" fill="#003087" radius={[0, 4, 4, 0]}>
                    {byNationalityData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Types de Visa</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={byVisaData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [v.toLocaleString('fr-FR'), 'Dossiers']} />
                  <Bar dataKey="value" fill="#E8A000" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Types d'Infractions</Typography>
              {infractionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={infractionData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={120} />
                    <Tooltip formatter={(v) => [v, 'Infractions']} />
                    <Bar dataKey="value" fill="#D32F2F" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Typography variant="body2" color="text.secondary">Aucune infraction enregistrée.</Typography>}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Top Postes Frontaliers</Typography>
              {stats?.byBorderPost?.length > 0 ? (
                <Box>
                  {stats.byBorderPost.slice(0, 6).map((bp, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="caption" fontWeight={600}>{bp.post?.[0]?.name || 'Inconnu'}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 120, height: 6, bgcolor: 'grey.100', borderRadius: 3, overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', width: `${Math.min((bp.count / (stats.byBorderPost[0]?.count || 1)) * 100, 100)}%`, bgcolor: COLORS[i], borderRadius: 3 }} />
                        </Box>
                        <Typography variant="caption" fontWeight={700} sx={{ minWidth: 32, textAlign: 'right' }}>{bp.count}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : <Typography variant="body2" color="text.secondary">Aucune donnée disponible.</Typography>}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
