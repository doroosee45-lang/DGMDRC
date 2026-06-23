// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, Box, Badge, Menu, MenuItem,
  Avatar, Divider, ListItemIcon, Tooltip, alpha, List, ListItem, ListItemText, Chip, Button
} from '@mui/material';
import {
  Menu as MenuIcon, Notifications, Logout,
  Person, Shield, Warning, CheckCircle, Circle, DoneAll, Language
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { changeLang } from '../../i18n';
import { alertsAPI, notificationsAPI } from '../../services/api';

const ROLE_LABELS = {
  ADMIN_NATIONAL: 'Administrateur National', ADMIN_PROVINCIAL: 'Administrateur Provincial',
  AGENT_DGM: 'Agent DGM', AGENT_FRONTALIER_AERIEN: 'Agent Frontalier Aérien',
  AGENT_FRONTALIER_TERRESTRE: 'Agent Frontalier Terrestre', AGENT_FRONTALIER_MARITIME: 'Agent Frontalier Maritime',
  POLICE_NATIONALE: 'Police Nationale', JUSTICE: 'Justice',
  ANR_RENSEIGNEMENT: 'ANR — Renseignement', MINISTERE_INTERIEUR: "Ministère de l'Intérieur",
  AMBASSADE_CONSULAT: 'Ambassade / Consulat', GOUVERNEMENT_PROVINCIAL: 'Gouvernement Provincial',
  AUDITEUR: 'Auditeur',
};

export default function TopBar({ onMenuClick }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [langAnchor, setLangAnchor] = useState(null);

  const { data: alertStats } = useQuery({
    queryKey: ['alertStats'],
    queryFn: () => alertsAPI.getStats().then(r => r.data.data),
    refetchInterval: 60000,
    enabled: !!user,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationsAPI.getAll({ limit: 8 }).then(r => r.data),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsAPI.markRead(id),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllRead(),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  });

  const criticalCount = alertStats?.critique || 0;
  const unreadCount = notifData?.unreadCount || 0;
  const notifications = notifData?.data || [];

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/login');
  };

  const handleChangeLang = (lang) => {
    changeLang(lang);
    setLangAnchor(null);
  };

  return (
    <AppBar position="fixed" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, ml: { lg: '260px' }, width: { lg: 'calc(100% - 260px)' } }}>
      <Toolbar sx={{ gap: 1 }}>
        <IconButton color="inherit" onClick={onMenuClick} sx={{ display: { lg: 'none' } }}>
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Shield sx={{ color: '#FFD700', fontSize: 22 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.1, color: 'white', fontSize: { xs: '0.82rem', sm: '0.875rem' } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{t('app.fullName')}</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>{t('app.name')}</Box>
            </Typography>
            <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.06em', display: { xs: 'none', sm: 'block' } }}>
              {t('app.country')}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {criticalCount > 0 && (
          <Tooltip title={`${criticalCount} alerte(s) critique(s)`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: alpha('#FF0000', 0.2), border: '1px solid rgba(255,0,0,0.4)', borderRadius: '20px', px: 1.5, py: 0.5, cursor: 'pointer' }} onClick={() => navigate('/alertes')}>
              <Warning sx={{ color: '#FF6B6B', fontSize: 16 }} />
              <Typography sx={{ color: '#FF6B6B', fontSize: '0.75rem', fontWeight: 700 }}>{criticalCount} critique(s)</Typography>
            </Box>
          </Tooltip>
        )}

        <Tooltip title={t('language.fr') + ' / ' + t('language.en')}>
          <IconButton color="inherit" size="small" onClick={(e) => setLangAnchor(e.currentTarget)}>
            <Language fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={langAnchor}
          open={Boolean(langAnchor)}
          onClose={() => setLangAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { mt: 1, minWidth: 120, borderRadius: 2 } }}
        >
          <MenuItem onClick={() => handleChangeLang('fr')} selected={i18n.language === 'fr'}>
            🇫🇷 {t('language.fr')}
          </MenuItem>
          <MenuItem onClick={() => handleChangeLang('en')} selected={i18n.language === 'en'}>
            🇬🇧 {t('language.en')}
          </MenuItem>
        </Menu>

        <Tooltip title={t('notifications.title')}>
          <IconButton color="inherit" onClick={(e) => setNotifAnchor(e.currentTarget)}>
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <Notifications />
            </Badge>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={notifAnchor}
          open={Boolean(notifAnchor)}
          onClose={() => setNotifAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { mt: 1, width: 340, borderRadius: 2, maxHeight: 480 } }}
        >
          <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>{t('notifications.title')}</Typography>
              {unreadCount > 0 && <Chip label={unreadCount} size="small" color="error" sx={{ height: 18, fontSize: '0.7rem' }} />}
            </Box>
            {unreadCount > 0 && (
              <Tooltip title={t('notifications.markAllRead')}>
                <IconButton size="small" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}>
                  <DoneAll fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">{t('notifications.none')}</Typography>
            </Box>
          ) : (
            <List dense disablePadding sx={{ maxHeight: 350, overflow: 'auto' }}>
              {notifications.map((n) => (
                <ListItem
                  key={n._id}
                  onClick={() => { if (!n.isRead) markReadMutation.mutate(n._id); setNotifAnchor(null); }}
                  sx={{
                    cursor: 'pointer',
                    borderLeft: n.isRead ? 'none' : '3px solid #003087',
                    bgcolor: n.isRead ? 'transparent' : alpha('#003087', 0.04),
                    '&:hover': { bgcolor: 'action.hover' },
                    py: 1.2, px: 2,
                  }}
                >
                  {!n.isRead && <Circle sx={{ fontSize: 8, color: 'primary.main', mr: 1, flexShrink: 0 }} />}
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={n.isRead ? 400 : 600} sx={{ fontSize: '0.8rem' }}>{n.title}</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>{n.message}</Typography>}
                    sx={{ ml: n.isRead ? 2.5 : 0 }}
                  />
                </ListItem>
              ))}
            </List>
          )}

          <Divider />
          <MenuItem onClick={() => { setNotifAnchor(null); navigate('/alertes'); }} sx={{ py: 1 }}>
            <Typography variant="body2" color="primary" fontWeight={600} sx={{ width: '100%', textAlign: 'center' }}>{t('notifications.viewAlerts')}</Typography>
          </MenuItem>
        </Menu>

        <Tooltip title={user?.name}>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#FFD700', color: '#003087', fontWeight: 700, fontSize: '0.85rem' }}>
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{ sx: { mt: 1, width: 240, borderRadius: 2 } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>{user?.name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{user?.email}</Typography>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>{ROLE_LABELS[user?.role] || user?.role}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { setAnchorEl(null); navigate('/profil'); }}>
            <ListItemIcon><Person fontSize="small" /></ListItemIcon>
            {t('nav.profile')}
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon><Logout fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
            {t('auth.logout')}
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
