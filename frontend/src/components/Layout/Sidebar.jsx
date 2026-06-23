// @ts-nocheck
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Drawer, Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Avatar, alpha, IconButton
} from '@mui/material';
import {
  Dashboard, People, FlightTakeoff, Warning, Security, BarChart,
  History, ManageAccounts, Edit, GppBad, Shield, LocationOn, Close, AccountCircle
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH = 260;

const NAV_ITEMS = [
  { labelKey: 'nav.dashboard', path: '/dashboard', icon: <Dashboard />, roles: [] },
  { labelKey: 'nav.foreigners', path: '/etrangers', icon: <People />, roles: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM', 'AGENT_FRONTALIER_AERIEN', 'AGENT_FRONTALIER_TERRESTRE', 'AGENT_FRONTALIER_MARITIME', 'POLICE_NATIONALE', 'JUSTICE', 'ANR_RENSEIGNEMENT'] },
  { labelKey: 'nav.borderControl', path: '/controle-frontalier', icon: <FlightTakeoff />, roles: ['ADMIN_NATIONAL', 'AGENT_DGM', 'AGENT_FRONTALIER_AERIEN', 'AGENT_FRONTALIER_TERRESTRE', 'AGENT_FRONTALIER_MARITIME'] },
  { labelKey: 'nav.infractions', path: '/infractions', icon: <GppBad />, roles: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM', 'POLICE_NATIONALE', 'JUSTICE', 'ANR_RENSEIGNEMENT'] },
  { labelKey: 'nav.alerts', path: '/alertes', icon: <Warning />, roles: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM', 'AGENT_FRONTALIER_AERIEN', 'AGENT_FRONTALIER_TERRESTRE', 'AGENT_FRONTALIER_MARITIME', 'POLICE_NATIONALE', 'ANR_RENSEIGNEMENT'] },
  { labelKey: 'nav.blacklist', path: '/liste-noire', icon: <Security />, roles: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'POLICE_NATIONALE', 'JUSTICE', 'ANR_RENSEIGNEMENT'] },
  { labelKey: 'nav.corrections', path: '/corrections', icon: <Edit />, roles: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM'] },
  { labelKey: 'nav.reports', path: '/rapports', icon: <BarChart />, roles: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM', 'MINISTERE_INTERIEUR', 'GOUVERNEMENT_PROVINCIAL'] },
  { labelKey: 'nav.audit', path: '/audit', icon: <History />, roles: ['ADMIN_NATIONAL', 'AUDITEUR'] },
  { labelKey: 'nav.users', path: '/utilisateurs', icon: <ManageAccounts />, roles: ['ADMIN_NATIONAL'] },
];

const ROLE_LABELS = {
  ADMIN_NATIONAL: 'Admin National', ADMIN_PROVINCIAL: 'Admin Provincial',
  AGENT_DGM: 'Agent DGM', AGENT_FRONTALIER_AERIEN: 'Agent Frontalier Aérien',
  AGENT_FRONTALIER_TERRESTRE: 'Agent Frontalier Terrestre', AGENT_FRONTALIER_MARITIME: 'Agent Frontalier Maritime',
  POLICE_NATIONALE: 'Police Nationale', JUSTICE: 'Justice',
  ANR_RENSEIGNEMENT: 'ANR', MINISTERE_INTERIEUR: "Ministère de l'Intérieur",
  AMBASSADE_CONSULAT: 'Ambassade/Consulat', GOUVERNEMENT_PROVINCIAL: 'Gouvernement Provincial',
  AUDITEUR: 'Auditeur',
};

function NavItem({ item, userRole, onClose }) {
  const { t } = useTranslation();
  if (item.roles.length > 0 && !item.roles.includes(userRole)) return null;
  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      <ListItemButton
        component={NavLink}
        to={item.path}
        onClick={onClose}
        sx={{
          color: 'rgba(255,255,255,0.75)',
          '&.active': { color: '#FFFFFF', bgcolor: alpha('#FFFFFF', 0.15), '& .MuiListItemIcon-root': { color: '#FFD700' } },
          '&:hover': { color: '#FFFFFF', bgcolor: alpha('#FFFFFF', 0.08) },
          borderRadius: '8px', mx: 1, my: 0.3, py: 1.1,
        }}
      >
        <ListItemIcon sx={{ color: 'inherit', minWidth: 40, fontSize: '1.1rem' }}>
          {item.icon}
        </ListItemIcon>
        <ListItemText primary={t(item.labelKey)} primaryTypographyProps={{ fontSize: '0.83rem', fontWeight: 500 }} />
      </ListItemButton>
    </ListItem>
  );
}

function DrawerContent({ userRole, user, onClose }) {
  const { t } = useTranslation();
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ p: 2.5, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield sx={{ color: '#003087', fontSize: 24 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>{t('app.name')}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('app.system')}</Typography>
          </Box>
          {onClose && (
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.12)' }, display: { lg: 'none' } }}
            >
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#FFD700', color: '#003087', fontWeight: 700, fontSize: '0.85rem' }}>
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ROLE_LABELS[userRole] || userRole}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', py: 1 }}>
        <List dense>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.path} item={item} userRole={userRole} onClose={onClose} />
          ))}
        </List>
      </Box>

      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <ListItem disablePadding>
          <ListItemButton
            component={NavLink}
            to="/profil"
            onClick={onClose}
            sx={{
              color: 'rgba(255,255,255,0.75)',
              '&.active': { color: '#FFFFFF', bgcolor: alpha('#FFFFFF', 0.15), '& .MuiListItemIcon-root': { color: '#FFD700' } },
              '&:hover': { color: '#FFFFFF', bgcolor: alpha('#FFFFFF', 0.08) },
              borderRadius: '8px', mx: 1, my: 0.5, py: 1,
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><AccountCircle /></ListItemIcon>
            <ListItemText primary={t('nav.profile')} primaryTypographyProps={{ fontSize: '0.83rem', fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>RDC — {t('app.version')}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function Sidebar({ drawerWidth, mobileOpen, onMobileClose }) {
  const { user } = useAuth();
  const userRole = user?.role;

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', lg: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
      >
        <DrawerContent userRole={userRole} user={user} onClose={onMobileClose} />
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{ display: { xs: 'none', lg: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', position: 'fixed', height: '100vh' } }}
        open
      >
        <DrawerContent userRole={userRole} user={user} />
      </Drawer>
    </>
  );
}
