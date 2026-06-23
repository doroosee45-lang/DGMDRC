import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Slide } from '@mui/material';
import { WifiOff } from '@mui/icons-material';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export default function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();

  return (
    <Slide direction="up" in={!isOnline} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
          bgcolor: '#B71C1C', color: 'white', py: 0.8, px: 2,
          display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center',
          boxShadow: '0 -2px 16px rgba(0,0,0,0.3)',
        }}
      >
        <WifiOff fontSize="small" />
        <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.82rem' }}>
          {t('offline.banner')}
        </Typography>
      </Box>
    </Slide>
  );
}
