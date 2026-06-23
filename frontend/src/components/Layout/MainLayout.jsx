// @ts-nocheck
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import OfflineBanner from '../Common/OfflineBanner';
import { useOfflineSync } from '../../hooks/useOfflineSync';

const DRAWER_WIDTH = 260;

export default function MainLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  useOfflineSync();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar drawerWidth={DRAWER_WIDTH} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0, ml: { lg: `${DRAWER_WIDTH}px` } }}>
        <TopBar drawerWidth={DRAWER_WIDTH} onMenuClick={() => setMobileOpen(true)} />
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, mt: '64px', overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
      <OfflineBanner />
    </Box>
  );
}
