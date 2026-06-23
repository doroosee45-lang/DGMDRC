import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Grid, Card, CardContent, Typography, Avatar, Button, Chip, Divider,
  List, ListItem, ListItemAvatar, ListItemText, LinearProgress, alpha, Skeleton, Stack
} from '@mui/material';
import {
  People, FlightTakeoff, FlightLand, Warning, GppBad, TrendingUp,
  CheckCircle, ArrowForward, Fingerprint, Shield, LocationOn, AccessTime
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { reportsAPI, foreignersAPI, alertsAPI } from '../../services/api';
import StatusChip from '../../components/Common/StatusChip';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['#003087', '#0052CC', '#E8A000', '#2E7D32', '#D32F2F'];

function StatCard({ title, value, subtitle, icon, color, trend, onClick }) {
  return (
    <Card sx={{ cursor: onClick ? 'pointer' : 'default', height: '100%', position: 'relative', overflow: 'hidden' }} onClick={onClick}>
      <Box sx={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, borderRadius: '50%', bgcolor: alpha(color, 0.08), transform: 'translate(20px,-20px)' }} />
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{title}</Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color, mt: 0.5, lineHeight: 1 }}>
              {value?.toLocaleString('fr-FR') ?? <Skeleton width={60} />}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: alpha(color, 0.12), color, width: 48, height: 48, borderRadius: 2 }}>{icon}</Avatar>
        </Box>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            <TrendingUp sx={{ fontSize: 14, color: trend >= 0 ? 'success.main' : 'error.main' }} />
            <Typography variant="caption" sx={{ color: trend >= 0 ? 'success.main' : 'error.main', fontWeight: 600 }}>
              {trend >= 0 ? '+' : ''}{trend} aujourd'hui
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: dash, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportsAPI.getDashboard().then(r => r.data.data),
    refetchInterval: 30000,
  });

  const { data: foreignerStats } = useQuery({
    queryKey: ['foreignerStats'],
    queryFn: () => foreignersAPI.getStats().then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: alertStats } = useQuery({
    queryKey: ['alertStats'],
    queryFn: () => alertsAPI.getStats().then(r => r.data.data),
    refetchInterval: 60000,
  });

  const nationalityData = foreignerStats?.byNationality?.slice(0, 5).map(n => ({ name: n._id, value: n.count })) || [];
  const visaData = foreignerStats?.byVisa?.map(v => ({ name: v._id, value: v.count })) || [];

  const monthlyData = foreignerStats?.monthlyEntries?.map(m => ({
    mois: `${String(m._id.month).padStart(2, '0')}/${m._id.year}`,
    entrées: m.count,
  })) || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary">{greeting}, {user?.name?.split(' ')[0]}</Typography>
          <Typography color="text.secondary" variant="body2">
            {format(new Date(), "EEEE d MMMM yyyy — HH:mm", { locale: fr })} • {user?.institution}
          </Typography>
        </Box>
        {alertStats?.critique > 0 && (
          <Chip icon={<Warning />} label={`${alertStats.critique} alerte(s) critique(s)`} color="error" onClick={() => navigate('/alertes')} sx={{ fontWeight: 700, cursor: 'pointer', animation: 'pulse 2s infinite' }} />
        )}
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Étrangers enregistrés" value={foreignerStats?.total} icon={<People />} color="#003087" onClick={() => navigate('/etrangers')} subtitle={`${foreignerStats?.present || 0} actuellement présents`} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Entrées aujourd'hui" value={dash?.entriesToday} icon={<FlightLand />} color="#2E7D32" trend={dash?.entriesToday} onClick={() => navigate('/controle-frontalier')} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Sorties aujourd'hui" value={dash?.exitsToday} icon={<FlightTakeoff />} color="#0052CC" trend={dash?.exitsToday} onClick={() => navigate('/controle-frontalier')} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Alertes actives" value={alertStats?.active} icon={<Warning />} color={alertStats?.critique > 0 ? '#D32F2F' : '#E8A000'} subtitle={alertStats?.critique > 0 ? `${alertStats.critique} critique(s)` : 'Aucune critique'} onClick={() => navigate('/alertes')} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} lg={2}>
          <Card sx={{ bgcolor: alpha('#D32F2F', 0.06), border: '1px solid', borderColor: alpha('#D32F2F', 0.2) }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color="error.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{foreignerStats?.enInfraction ?? '—'}</Typography>
              <Typography variant="caption" color="error.main" fontWeight={600}>En Infraction</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <Card sx={{ bgcolor: alpha('#E65100', 0.06), border: '1px solid', borderColor: alpha('#E65100', 0.2) }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} sx={{ color: 'warning.dark', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{foreignerStats?.enAlerte ?? '—'}</Typography>
              <Typography variant="caption" sx={{ color: 'warning.dark' }} fontWeight={600}>En Alerte</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <Card sx={{ bgcolor: alpha('#2E7D32', 0.06), border: '1px solid', borderColor: alpha('#2E7D32', 0.2) }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color="success.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{foreignerStats?.enRegle ?? '—'}</Typography>
              <Typography variant="caption" color="success.main" fontWeight={600}>En Règle</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <Card sx={{ bgcolor: alpha('#D32F2F', 0.06), border: '1px solid', borderColor: alpha('#D32F2F', 0.2) }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color="error.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{foreignerStats?.blacklisted ?? '—'}</Typography>
              <Typography variant="caption" color="error.main" fontWeight={600}>Blacklistés</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <Card sx={{ bgcolor: alpha('#E8A000', 0.06), border: '1px solid', borderColor: alpha('#E8A000', 0.2) }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#C68400', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{dash?.pendingCorrections ?? '—'}</Typography>
              <Typography variant="caption" sx={{ color: '#C68400' }} fontWeight={600}>Corrections</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} lg={2}>
          <Card sx={{ bgcolor: alpha('#003087', 0.06), border: '1px solid', borderColor: alpha('#003087', 0.2) }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
              <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{foreignerStats?.present ?? '—'}</Typography>
              <Typography variant="caption" color="primary.main" fontWeight={600}>Présents RDC</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Flux d'entrées (12 derniers mois)</Typography>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/rapports')}>Voir rapport</Button>
              </Box>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [v.toLocaleString('fr-FR'), 'Entrées']} />
                  <Bar dataKey="entrées" fill="#003087" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Top Nationalités</Typography>
              {nationalityData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie data={nationalityData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                        {nationalityData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [v.toLocaleString('fr-FR'), 'Dossiers']} />
                    </PieChart>
                  </ResponsiveContainer>
                  {nationalityData.map((item, i) => (
                    <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length] }} />
                        <Typography variant="caption" fontWeight={600}>{item.name}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">{item.value}</Typography>
                    </Box>
                  ))}
                </>
              ) : <Typography variant="body2" color="text.secondary">Aucune donnée</Typography>}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Passages récents</Typography>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/controle-frontalier')}>Tout voir</Button>
              </Box>
              {dashLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={60} sx={{ mb: 1 }} />)
              ) : dash?.recentMovements?.length > 0 ? (
                <List dense disablePadding>
                  {dash.recentMovements.slice(0, 6).map((mv, i) => (
                    <ListItem key={mv._id} divider={i < dash.recentMovements.length - 1} sx={{ px: 0, py: 1 }}>
                      <ListItemAvatar sx={{ minWidth: 44 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: mv.type === 'ENTREE' ? alpha('#2E7D32', 0.12) : alpha('#0052CC', 0.12), color: mv.type === 'ENTREE' ? 'success.main' : 'primary.main', fontSize: '0.7rem', fontWeight: 700 }}>
                          {mv.type === 'ENTREE' ? <FlightLand fontSize="small" /> : <FlightTakeoff fontSize="small" />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Typography variant="body2" fontWeight={600}>{mv.foreignerId?.lastName} {mv.foreignerId?.firstName}</Typography><StatusChip status={mv.type} size="small" /></Box>}
                        secondary={<Typography variant="caption" color="text.secondary">{mv.borderPostId?.name} • {mv.foreignerId?.nationality} • {format(new Date(mv.datetime), 'HH:mm')}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : <Typography variant="body2" color="text.secondary">Aucun passage enregistré aujourd'hui.</Typography>}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Alertes par type</Typography>
              {alertStats?.byType?.slice(0, 5).map((a, i) => (
                <Box key={a._id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.72rem' }} noWrap>{a._id?.replace(/_/g, ' ')}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={700}>{a.count}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={Math.min((a.count / (alertStats?.active || 1)) * 100, 100)} color={i === 0 ? 'error' : i === 1 ? 'warning' : 'info'} />
                </Box>
              ))}
              {(!alertStats?.byType || alertStats.byType.length === 0) && <Typography variant="body2" color="text.secondary">Aucune alerte active.</Typography>}
              <Button variant="outlined" fullWidth size="small" sx={{ mt: 1 }} onClick={() => navigate('/alertes')}>
                Gérer les alertes
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
