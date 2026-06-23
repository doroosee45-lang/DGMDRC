// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress, Divider, alpha
} from '@mui/material';
import { Visibility, VisibilityOff, Shield, Security, Lock } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { loading, error, requiresTwoFactor, login, clearError } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', totpCode: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(form);
    if (success) navigate('/dashboard');
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #001f5e 0%, #003087 40%, #0052CC 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.03, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 50px, white 50px, white 51px), repeating-linear-gradient(90deg, transparent, transparent 50px, white 50px, white 51px)' }} />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', p: 2, position: 'relative', zIndex: 1 }}>
        <Box sx={{ width: '100%', maxWidth: 440 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: '18px', bgcolor: '#FFD700', mb: 2.5, boxShadow: '0 8px 32px rgba(232,160,0,0.5)' }}>
              <Shield sx={{ fontSize: 40, color: '#003087' }} />
            </Box>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 0.5 }}>{t('app.name')}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{t('app.system')}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('app.country')}</Typography>
          </Box>

          <Card sx={{ borderRadius: 3, boxShadow: '0 24px 80px rgba(0,0,0,0.4)', border: 'none' }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Lock sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="h5" fontWeight={700} color="primary">
                  {requiresTwoFactor ? t('auth.twoFA') : t('auth.login')}
                </Typography>
              </Box>

              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

              <form onSubmit={handleSubmit}>
                {!requiresTwoFactor ? (
                  <>
                    <TextField
                      fullWidth label={t('auth.email')} name="email" type="email"
                      value={form.email} onChange={handleChange} required disabled={loading}
                      sx={{ mb: 2 }} placeholder="prenom.nom@dgm.gouv.cd"
                      InputProps={{ startAdornment: <InputAdornment position="start">@</InputAdornment> }}
                    />
                    <TextField
                      fullWidth label={t('auth.password')} name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password} onChange={handleChange} required disabled={loading}
                      sx={{ mb: 3 }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Security sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Entrez le code à 6 chiffres de votre application d'authentification (Google Authenticator, Authy, etc.)
                    </Typography>
                    <TextField
                      fullWidth label={t('auth.codeTotp')} name="totpCode"
                      value={form.totpCode} onChange={handleChange} required disabled={loading}
                      inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5em' } }}
                      sx={{ mb: 3 }}
                    />
                  </Box>
                )}

                <Button
                  type="submit" fullWidth variant="contained" size="large" disabled={loading}
                  sx={{ py: 1.5, fontSize: '0.95rem', fontWeight: 700, borderRadius: 2, background: 'linear-gradient(135deg, #003087 0%, #0052CC 100%)', boxShadow: '0 4px 20px rgba(0,48,135,0.4)', '&:hover': { background: 'linear-gradient(135deg, #001f5e 0%, #003087 100%)' } }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : (requiresTwoFactor ? t('auth.verify') : t('auth.submit'))}
                </Button>
              </form>

              <Divider sx={{ my: 3 }} />
              <Box sx={{ bgcolor: alpha('#003087', 0.04), borderRadius: 2, p: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  🔐 {t('auth.unauthorized')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('auth.restricted')}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
              {t('auth.demo')}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
