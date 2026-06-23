// @ts-nocheck
import React, { useEffect } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Foreigners from './pages/Foreigners';
import ForeignerDetail from './pages/Foreigners/ForeignerDetail';
import ForeignerForm from './pages/Foreigners/ForeignerForm';
import BorderControl from './pages/BorderControl';
import Infractions from './pages/Infractions';
import Alerts from './pages/Alerts';
import Blacklist from './pages/Blacklist';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import Users from './pages/Users';
import Corrections from './pages/Corrections';
import Profile from './pages/Profile';

function LoadingScreen() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'linear-gradient(135deg, #003087 0%, #0052CC 100%)' }}>
      <CircularProgress size={56} sx={{ color: '#FFD700', mb: 3 }} />
      <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>DGM — SIMN</Typography>
      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>Système d'Information Migratoire National</Typography>
    </Box>
  );
}

function Root() {
  const { initialized, fetchMe, setInitialized } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchMe();
    } else {
      setInitialized(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!initialized) return <LoadingScreen />;
  return <Outlet />;
}

function LoginGuard({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function AuthGuard({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        path: '/login',
        element: <LoginGuard><Login /></LoginGuard>,
      },
      {
        element: <AuthGuard><MainLayout /></AuthGuard>,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'etrangers', element: <Foreigners /> },
          { path: 'etrangers/nouveau', element: <ForeignerForm /> },
          { path: 'etrangers/:id', element: <ForeignerDetail /> },
          { path: 'etrangers/:id/modifier', element: <ForeignerForm /> },
          { path: 'controle-frontalier', element: <BorderControl /> },
          { path: 'infractions', element: <Infractions /> },
          { path: 'alertes', element: <Alerts /> },
          { path: 'liste-noire', element: <Blacklist /> },
          { path: 'rapports', element: <Reports /> },
          { path: 'audit', element: <AuditLogs /> },
          { path: 'utilisateurs', element: <Users /> },
          { path: 'corrections', element: <Corrections /> },
          { path: 'profil', element: <Profile /> },
        ],
      },
      { path: '*', element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);
