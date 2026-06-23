import { createTheme, alpha } from '@mui/material/styles';

const DGM_COLORS = {
  navyBlue: '#003087',
  royalBlue: '#0052CC',
  skyBlue: '#0078D4',
  gold: '#E8A000',
  lightGold: '#FFD700',
  darkGold: '#C68400',
  red: '#CC0000',
  green: '#1B7340',
  gray: '#666666',
  lightGray: '#F5F7FA',
  white: '#FFFFFF',
  dark: '#1A1A2E',
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: DGM_COLORS.navyBlue,
      light: DGM_COLORS.royalBlue,
      dark: '#001f5e',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: DGM_COLORS.gold,
      light: DGM_COLORS.lightGold,
      dark: DGM_COLORS.darkGold,
      contrastText: '#1A1A2E',
    },
    error: { main: '#D32F2F', light: '#EF5350', dark: '#B71C1C' },
    warning: { main: '#E65100', light: '#FF9800', dark: '#BF360C' },
    success: { main: DGM_COLORS.green, light: '#2E7D32', dark: '#1B5E20' },
    info: { main: DGM_COLORS.skyBlue },
    background: { default: '#EEF2F7', paper: '#FFFFFF' },
    text: { primary: '#1A1A2E', secondary: '#5A6A7E' },
    divider: '#E0E6ED',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, fontSize: '2.25rem' },
    h2: { fontWeight: 700, fontSize: '1.875rem' },
    h3: { fontWeight: 700, fontSize: '1.5rem' },
    h4: { fontWeight: 700, fontSize: '1.25rem' },
    h5: { fontWeight: 600, fontSize: '1.125rem' },
    h6: { fontWeight: 600, fontSize: '1rem' },
    subtitle1: { fontWeight: 500, fontSize: '0.9rem' },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem' },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
    caption: { fontSize: '0.75rem', color: '#5A6A7E' },
  },
  shape: { borderRadius: 10 },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    '0 2px 6px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
    '0 4px 12px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06)',
    '0 6px 16px rgba(0,0,0,0.12)',
    '0 8px 24px rgba(0,0,0,0.12)',
    '0 10px 30px rgba(0,0,0,0.15)',
    '0 12px 36px rgba(0,0,0,0.15)',
    '0 14px 42px rgba(0,0,0,0.18)',
    '0 16px 48px rgba(0,0,0,0.18)',
    '0 18px 54px rgba(0,0,0,0.2)',
    '0 20px 60px rgba(0,0,0,0.2)',
    '0 22px 66px rgba(0,0,0,0.22)',
    '0 24px 72px rgba(0,0,0,0.22)',
    '0 26px 78px rgba(0,0,0,0.25)',
    '0 28px 84px rgba(0,0,0,0.25)',
    '0 30px 90px rgba(0,0,0,0.28)',
    '0 32px 96px rgba(0,0,0,0.28)',
    '0 34px 102px rgba(0,0,0,0.3)',
    '0 36px 108px rgba(0,0,0,0.3)',
    '0 38px 114px rgba(0,0,0,0.32)',
    '0 40px 120px rgba(0,0,0,0.32)',
    '0 42px 126px rgba(0,0,0,0.35)',
    '0 44px 132px rgba(0,0,0,0.35)',
    '0 46px 138px rgba(0,0,0,0.38)',
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #E8EEF5',
          boxShadow: '0 2px 8px rgba(0,48,135,0.06)',
          transition: 'all 0.2s ease',
          '&:hover': { boxShadow: '0 4px 16px rgba(0,48,135,0.12)' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, padding: '8px 18px' },
        contained: {
          boxShadow: '0 2px 8px rgba(0,48,135,0.25)',
          '&:hover': { boxShadow: '0 4px 14px rgba(0,48,135,0.35)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: 6 } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: alpha(DGM_COLORS.navyBlue, 0.05),
            color: DGM_COLORS.navyBlue,
            fontWeight: 700,
            fontSize: '0.78rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: `2px solid ${alpha(DGM_COLORS.navyBlue, 0.15)}`,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: alpha(DGM_COLORS.navyBlue, 0.025) },
          '&:last-child td': { borderBottom: 'none' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: DGM_COLORS.royalBlue },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: DGM_COLORS.navyBlue },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${DGM_COLORS.navyBlue} 0%, ${DGM_COLORS.royalBlue} 100%)`,
          boxShadow: '0 2px 12px rgba(0,48,135,0.35)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: `linear-gradient(180deg, #001f5e 0%, #003087 60%, #0052CC 100%)`,
          color: '#FFFFFF',
          borderRight: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: alpha('#FFFFFF', 0.15),
            '&:hover': { backgroundColor: alpha('#FFFFFF', 0.2) },
          },
          '&:hover': { backgroundColor: alpha('#FFFFFF', 0.08) },
        },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 12 },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 4, height: 6 },
        bar: { borderRadius: 4 },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: { fontWeight: 700, fontSize: '0.65rem' },
      },
    },
  },
});

export default theme;
