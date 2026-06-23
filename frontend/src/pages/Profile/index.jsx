// @ts-nocheck
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button, Divider,
  Alert, CircularProgress, Avatar, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, InputAdornment, IconButton, Stack
} from '@mui/material';
import {
  Person, Lock, Shield, QrCode2, CheckCircle, Visibility, VisibilityOff,
  Security, VerifiedUser, Warning
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';

const ROLE_LABELS = {
  ADMIN_NATIONAL: 'Administrateur National', ADMIN_PROVINCIAL: 'Administrateur Provincial',
  AGENT_DGM: 'Agent DGM', AGENT_FRONTALIER_AERIEN: 'Agent Frontalier Aérien',
  AGENT_FRONTALIER_TERRESTRE: 'Agent Frontalier Terrestre', AGENT_FRONTALIER_MARITIME: 'Agent Frontalier Maritime',
  POLICE_NATIONALE: 'Police Nationale', JUSTICE: 'Justice',
  ANR_RENSEIGNEMENT: 'ANR — Renseignement', MINISTERE_INTERIEUR: "Ministère de l'Intérieur",
  AMBASSADE_CONSULAT: 'Ambassade / Consulat', GOUVERNEMENT_PROVINCIAL: 'Gouvernement Provincial',
  AUDITEUR: 'Auditeur',
};

function SectionHeader({ icon, title }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
      <Box sx={{ color: 'primary.main' }}>{icon}</Box>
      <Typography variant="h6" fontWeight={700} color="primary">{title}</Typography>
      <Divider sx={{ flexGrow: 1 }} />
    </Box>
  );
}

export default function Profile() {
  const { t } = useTranslation();
  const { user, fetchMe } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const [pwData, setPwData] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwError, setPwError] = useState('');

  const [twoFADialog, setTwoFADialog] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState('');
  const [totpInput, setTotpInput] = useState('');
  const [step2FA, setStep2FA] = useState('scan');

  const changePwMutation = useMutation({
    mutationFn: (data) => authAPI.changePassword(data),
    onSuccess: () => {
      enqueueSnackbar(t('profile.passwordChanged'), { variant: 'success' });
      setPwData({ currentPassword: '', newPassword: '', confirm: '' });
      setPwError('');
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.message || t('errors.server'), { variant: 'error' });
    },
  });

  const setup2FAMutation = useMutation({
    mutationFn: () => authAPI.setup2FA(),
    onSuccess: (res) => {
      setQrCode(res.data.data.qrCode);
      setSecret(res.data.data.secret);
      setStep2FA('scan');
      setTwoFADialog(true);
    },
    onError: () => enqueueSnackbar(t('errors.server'), { variant: 'error' }),
  });

  const verify2FAMutation = useMutation({
    mutationFn: (token) => authAPI.verify2FA(token),
    onSuccess: () => {
      setStep2FA('done');
      fetchMe();
      enqueueSnackbar('Authentification à deux facteurs activée!', { variant: 'success' });
    },
    onError: () => enqueueSnackbar('Code invalide. Réessayez.', { variant: 'error' }),
  });

  const handleChangePassword = () => {
    setPwError('');
    if (!pwData.currentPassword || !pwData.newPassword) {
      setPwError('Tous les champs sont obligatoires.');
      return;
    }
    if (pwData.newPassword.length < 8) {
      setPwError(t('profile.minLength'));
      return;
    }
    if (pwData.newPassword !== pwData.confirm) {
      setPwError(t('profile.passwordMismatch'));
      return;
    }
    changePwMutation.mutate({ currentPassword: pwData.currentPassword, newPassword: pwData.newPassword });
  };

  const handleVerify2FA = () => {
    if (!totpInput || totpInput.length !== 6) {
      enqueueSnackbar('Le code doit comporter 6 chiffres.', { variant: 'warning' });
      return;
    }
    verify2FAMutation.mutate(totpInput);
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} color="primary">{t('profile.title')}</Typography>
        <Typography color="text.secondary" variant="body2">{t('profile.subtitle')}</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Avatar sx={{ width: 96, height: 96, bgcolor: 'primary.main', fontSize: 36, fontWeight: 700, mx: 'auto', mb: 2 }}>
                {initials}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{user?.email}</Typography>
              <Chip label={ROLE_LABELS[user?.role] || user?.role} color="primary" size="small" sx={{ mb: 1 }} />
              {user?.institution && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{user.institution}</Typography>
              )}
              {user?.province && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Province: {user.province}</Typography>
              )}
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">{t('profile.twoFA')}</Typography>
                  {user?.twoFactorEnabled ? (
                    <Chip icon={<CheckCircle />} label={t('profile.twoFAEnabled')} color="success" size="small" />
                  ) : (
                    <Chip icon={<Warning />} label={t('profile.twoFADisabled')} color="warning" size="small" />
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Grid container spacing={3} direction="column">
            <Grid item>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <SectionHeader icon={<Lock />} title={t('profile.changePassword')} />
                  {pwError && <Alert severity="error" sx={{ mb: 2 }}>{pwError}</Alert>}
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t('profile.currentPassword')}
                        type={showPw.current ? 'text' : 'password'}
                        value={pwData.currentPassword}
                        onChange={e => setPwData(p => ({ ...p, currentPassword: e.target.value }))}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPw(p => ({ ...p, current: !p.current }))} edge="end">
                                {showPw.current ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('profile.newPassword')}
                        type={showPw.new ? 'text' : 'password'}
                        value={pwData.newPassword}
                        onChange={e => setPwData(p => ({ ...p, newPassword: e.target.value }))}
                        helperText={t('profile.minLength')}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPw(p => ({ ...p, new: !p.new }))} edge="end">
                                {showPw.new ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={t('profile.confirmPassword')}
                        type={showPw.confirm ? 'text' : 'password'}
                        value={pwData.confirm}
                        onChange={e => setPwData(p => ({ ...p, confirm: e.target.value }))}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))} edge="end">
                                {showPw.confirm ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        onClick={handleChangePassword}
                        disabled={changePwMutation.isPending}
                        startIcon={changePwMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Lock />}
                      >
                        {changePwMutation.isPending ? t('common.loading') : t('profile.changePassword')}
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <SectionHeader icon={<Security />} title={t('profile.twoFA')} />
                  {user?.twoFactorEnabled ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200' }}>
                      <VerifiedUser sx={{ color: 'success.main', fontSize: 40 }} />
                      <Box>
                        <Typography fontWeight={700} color="success.main">{t('profile.twoFAEnabled')}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Votre compte est protégé par l'authentification à deux facteurs via une application TOTP (Google Authenticator, Authy, etc.).
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Alert severity="warning" sx={{ mb: 2 }}>{t('profile.twoFAWarning')}</Alert>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        La 2FA ajoute une couche de sécurité supplémentaire: en plus de votre mot de passe, vous devrez entrer un code temporaire généré par votre application d'authentification.
                      </Typography>
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={setup2FAMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <QrCode2 />}
                        onClick={() => setup2FAMutation.mutate()}
                        disabled={setup2FAMutation.isPending}
                      >
                        {setup2FAMutation.isPending ? t('common.loading') : t('profile.twoFAActivate')}
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Dialog open={twoFADialog} onClose={() => { setTwoFADialog(false); setTotpInput(''); setStep2FA('scan'); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <QrCode2 color="primary" />
          Configuration de la 2FA
        </DialogTitle>
        <DialogContent>
          {step2FA === 'scan' && (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="info" sx={{ mb: 2, textAlign: 'left' }}>
                <strong>Étape 1:</strong> Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, Microsoft Authenticator…)
              </Alert>
              {qrCode && (
                <Box component="img" src={qrCode} alt="QR Code 2FA" sx={{ width: 200, height: 200, display: 'block', mx: 'auto', mb: 2, borderRadius: 2, border: '2px solid', borderColor: 'primary.light' }} />
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Ou entrez manuellement ce code secret dans votre application:</Typography>
              <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', bgcolor: 'grey.100', px: 2, py: 1, borderRadius: 1, letterSpacing: '0.15em', wordBreak: 'break-all' }}>
                {secret}
              </Typography>
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}><strong>Étape 2:</strong> Entrez le code à 6 chiffres généré par l'application:</Typography>
                <TextField
                  fullWidth
                  label="Code de vérification"
                  value={totpInput}
                  onChange={e => setTotpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em', fontWeight: 700 } }}
                  placeholder="000000"
                />
              </Box>
            </Box>
          )}
          {step2FA === 'done' && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} color="success.main">2FA activée avec succès!</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Votre compte est maintenant protégé. Vous devrez entrer un code à chaque connexion.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {step2FA === 'scan' && (
            <>
              <Button onClick={() => { setTwoFADialog(false); setTotpInput(''); }}>{t('common.cancel')}</Button>
              <Button
                variant="contained"
                onClick={handleVerify2FA}
                disabled={verify2FAMutation.isPending || totpInput.length !== 6}
                startIcon={verify2FAMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Shield />}
              >
                {verify2FAMutation.isPending ? t('common.loading') : 'Vérifier et activer'}
              </Button>
            </>
          )}
          {step2FA === 'done' && (
            <Button variant="contained" onClick={() => { setTwoFADialog(false); setTotpInput(''); setStep2FA('scan'); }}>{t('common.close')}</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
