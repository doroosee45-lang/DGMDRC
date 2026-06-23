// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField, MenuItem,
  Divider, Alert, CircularProgress, Avatar, IconButton, Tooltip
} from '@mui/material';
import { Save, ArrowBack, Person, CreditCard, FlightTakeoff, Contacts, PhotoCamera, Delete } from '@mui/icons-material';
import { foreignersAPI } from '../../services/api';
import { useSnackbar } from 'notistack';

const VISA_TYPES = ['TOURISME', 'AFFAIRES', 'RESIDENCE', 'DIPLOMATIQUE', 'TRANSIT', 'ETUDES', 'TRAVAIL', 'AUTRE'];
const NATIONALITIES = [{ code: 'FRA', label: 'France' }, { code: 'NGA', label: 'Nigeria' }, { code: 'CHN', label: 'Chine' }, { code: 'ZAF', label: 'Afrique du Sud' }, { code: 'BEL', label: 'Belgique' }, { code: 'USA', label: 'États-Unis' }, { code: 'GBR', label: 'Royaume-Uni' }, { code: 'ESP', label: 'Espagne' }, { code: 'ITA', label: 'Italie' }, { code: 'CMR', label: 'Cameroun' }, { code: 'SEN', label: 'Sénégal' }, { code: 'CIV', label: "Côte d'Ivoire" }, { code: 'ZMB', label: 'Zambie' }, { code: 'UGA', label: 'Ouganda' }, { code: 'RWA', label: 'Rwanda' }, { code: 'BDI', label: 'Burundi' }, { code: 'TZA', label: 'Tanzanie' }, { code: 'AGO', label: 'Angola' }, { code: 'ZWE', label: 'Zimbabwe' }, { code: 'KEN', label: 'Kenya' }, { code: 'ETH', label: 'Éthiopie' }, { code: 'MAR', label: 'Maroc' }, { code: 'EGY', label: 'Égypte' }, { code: 'ZAR', label: 'RDC' }];

const API_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

function SectionHeader({ icon, title }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 0.5 }}>
      <Box sx={{ color: 'primary.main' }}>{icon}</Box>
      <Typography variant="h6" fontWeight={700} color="primary">{title}</Typography>
      <Divider sx={{ flexGrow: 1 }} />
    </Box>
  );
}

export default function ForeignerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const isEdit = Boolean(id);
  const fileInputRef = useRef(null);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['foreigner', id],
    queryFn: () => foreignersAPI.getOne(id).then(r => r.data.data),
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      lastName: '', middleName: '', firstName: '', gender: 'M',
      dateOfBirth: '', placeOfBirth: '', nationality: '', secondNationality: '',
      'passport.number': '', 'passport.issueDate': '', 'passport.expiryDate': '', 'passport.issueCountry': '',
      'visa.number': '', 'visa.type': 'TOURISME', 'visa.issueDate': '', 'visa.expiryDate': '', 'visa.maxDays': 90,
      employer: '', stayPurpose: '', stayPurposeDetails: '',
      'emergencyContacts[0].name': '', 'emergencyContacts[0].phone': '', 'emergencyContacts[0].relation': '',
    }
  });

  useEffect(() => {
    if (existing) {
      reset({
        lastName: existing.lastName || '', middleName: existing.middleName || '', firstName: existing.firstName || '',
        gender: existing.gender || 'M', dateOfBirth: existing.dateOfBirth?.split('T')[0] || '', placeOfBirth: existing.placeOfBirth || '',
        nationality: existing.nationality || '', secondNationality: existing.secondNationality || '',
        'passport.number': existing.passport?.number || '', 'passport.issueDate': existing.passport?.issueDate?.split('T')[0] || '',
        'passport.expiryDate': existing.passport?.expiryDate?.split('T')[0] || '', 'passport.issueCountry': existing.passport?.issueCountry || '',
        'visa.number': existing.visa?.number || '', 'visa.type': existing.visa?.type || 'TOURISME',
        'visa.issueDate': existing.visa?.issueDate?.split('T')[0] || '', 'visa.expiryDate': existing.visa?.expiryDate?.split('T')[0] || '',
        'visa.maxDays': existing.visa?.maxDays || 90, employer: existing.employer || '',
        stayPurpose: existing.stayPurpose || '', stayPurposeDetails: existing.stayPurposeDetails || '',
      });
      if (existing.photo) setPhotoPreview(`${API_URL}${existing.photo}`);
    }
  }, [existing, reset]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      enqueueSnackbar('Photo trop grande. Maximum 5 Mo.', { variant: 'error' });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(isEdit && existing?.photo ? `${API_URL}${existing.photo}` : null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const data = {
        lastName: formData.lastName?.toUpperCase(),
        middleName: formData.middleName,
        firstName: formData.firstName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        placeOfBirth: formData.placeOfBirth,
        nationality: formData.nationality?.toUpperCase(),
        secondNationality: formData.secondNationality?.toUpperCase() || null,
        passport: {
          number: formData['passport.number']?.toUpperCase(),
          issueDate: formData['passport.issueDate'],
          expiryDate: formData['passport.expiryDate'],
          issueCountry: formData['passport.issueCountry']?.toUpperCase(),
        },
        visa: {
          number: formData['visa.number']?.toUpperCase(),
          type: formData['visa.type'],
          issueDate: formData['visa.issueDate'],
          expiryDate: formData['visa.expiryDate'],
          maxDays: Number(formData['visa.maxDays']),
        },
        employer: formData.employer,
        stayPurpose: formData.stayPurpose,
        stayPurposeDetails: formData.stayPurposeDetails,
        emergencyContacts: [
          { name: formData['emergencyContacts[0].name'], phone: formData['emergencyContacts[0].phone'], relation: formData['emergencyContacts[0].relation'] }
        ].filter(c => c.name),
      };

      let targetId = id;
      if (isEdit) {
        await foreignersAPI.update(id, data);
      } else {
        const res = await foreignersAPI.create(data);
        targetId = res.data.data._id;
      }

      if (photoFile) {
        const fd = new FormData();
        fd.append('photo', photoFile);
        await foreignersAPI.uploadPhoto(targetId, fd);
      }

      enqueueSnackbar(isEdit ? 'Dossier mis à jour!' : 'Dossier créé avec succès!', { variant: 'success' });
      qc.invalidateQueries(['foreigners']);
      if (isEdit) qc.invalidateQueries(['foreigner', id]);
      navigate(`/etrangers/${targetId}`);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Erreur lors de l\'enregistrement', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (isEdit && loadingExisting) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} variant="outlined">Retour</Button>
        <Box>
          <Typography variant="h4" fontWeight={800} color="primary">{isEdit ? 'Modifier le Dossier' : 'Nouveau Dossier Étranger'}</Typography>
          <Typography color="text.secondary" variant="body2">{isEdit ? existing?.dossierNumber : "Enregistrement d'un nouvel étranger"}</Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2.5}>

          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <SectionHeader icon={<Person />} title="Photo & État Civil" />
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={12} sm="auto">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={photoPreview}
                        sx={{ width: 120, height: 120, border: '3px solid', borderColor: 'primary.light', bgcolor: 'grey.100', fontSize: 40 }}
                      >
                        {!photoPreview && <Person sx={{ fontSize: 60, color: 'grey.400' }} />}
                      </Avatar>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handlePhotoChange} />
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Changer la photo">
                          <IconButton size="small" color="primary" onClick={() => fileInputRef.current?.click()} sx={{ bgcolor: 'primary.50' }}>
                            <PhotoCamera fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {photoPreview && (
                          <Tooltip title="Supprimer la photo">
                            <IconButton size="small" color="error" onClick={removePhoto}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>JPEG / PNG / WEBP<br />Max 5 Mo</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Nom de famille *" {...register('lastName', { required: 'Obligatoire' })} error={!!errors.lastName} helperText={errors.lastName?.message} inputProps={{ style: { textTransform: 'uppercase' } }} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Postnom" {...register('middleName')} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Prénom(s) *" {...register('firstName', { required: 'Obligatoire' })} error={!!errors.firstName} helperText={errors.firstName?.message} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth select label="Sexe *" defaultValue="M" {...register('gender', { required: true })}>
                          <MenuItem value="M">Masculin</MenuItem>
                          <MenuItem value="F">Féminin</MenuItem>
                          <MenuItem value="AUTRE">Autre</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Date de naissance *" type="date" InputLabelProps={{ shrink: true }} {...register('dateOfBirth', { required: 'Obligatoire' })} error={!!errors.dateOfBirth} helperText={errors.dateOfBirth?.message} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Lieu de naissance *" {...register('placeOfBirth', { required: 'Obligatoire' })} error={!!errors.placeOfBirth} helperText={errors.placeOfBirth?.message} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth select label="Nationalité principale *" defaultValue="" {...register('nationality', { required: 'Obligatoire' })} error={!!errors.nationality} helperText={errors.nationality?.message}>
                          {NATIONALITIES.map(n => <MenuItem key={n.code} value={n.code}>{n.label} ({n.code})</MenuItem>)}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth select label="Double nationalité" defaultValue="" {...register('secondNationality')}>
                          <MenuItem value="">Aucune</MenuItem>
                          {NATIONALITIES.map(n => <MenuItem key={n.code} value={n.code}>{n.label} ({n.code})</MenuItem>)}
                        </TextField>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <SectionHeader icon={<CreditCard />} title="Passeport" />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Numéro de passeport *" {...register('passport.number', { required: 'Obligatoire' })} error={!!errors['passport.number']} helperText={errors['passport.number']?.message} inputProps={{ style: { textTransform: 'uppercase' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Date d'émission *" type="date" InputLabelProps={{ shrink: true }} {...register('passport.issueDate', { required: 'Obligatoire' })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Date d'expiration *" type="date" InputLabelProps={{ shrink: true }} {...register('passport.expiryDate', { required: 'Obligatoire' })} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth select label="Pays émetteur *" defaultValue="" {...register('passport.issueCountry', { required: 'Obligatoire' })} error={!!errors['passport.issueCountry']}>
                      {NATIONALITIES.map(n => <MenuItem key={n.code} value={n.code}>{n.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <SectionHeader icon={<FlightTakeoff />} title="Visa" />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Numéro de visa *" {...register('visa.number', { required: 'Obligatoire' })} inputProps={{ style: { textTransform: 'uppercase' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth select label="Type de visa *" defaultValue="TOURISME" {...register('visa.type')}>
                      {VISA_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Durée max (jours)" type="number" defaultValue={90} {...register('visa.maxDays')} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Date d'émission *" type="date" InputLabelProps={{ shrink: true }} {...register('visa.issueDate', { required: 'Obligatoire' })} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Date d'expiration *" type="date" InputLabelProps={{ shrink: true }} {...register('visa.expiryDate', { required: 'Obligatoire' })} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <SectionHeader icon={<Contacts />} title="Contact d'urgence & Séjour" />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Nom du contact d'urgence" {...register('emergencyContacts[0].name')} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Téléphone" {...register('emergencyContacts[0].phone')} placeholder="+243..." />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Relation" {...register('emergencyContacts[0].relation')} placeholder="Épouse, Père, Employeur..." />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Employeur / Organisation" {...register('employer')} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Motif du séjour" {...register('stayPurpose')} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={2} label="Détails du séjour" {...register('stayPurposeDetails')} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => navigate(-1)} disabled={submitting}>Annuler</Button>
              <Button type="submit" variant="contained" startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <Save />} disabled={submitting} sx={{ fontWeight: 700, px: 4 }}>
                {submitting ? 'Enregistrement...' : (isEdit ? 'Enregistrer les modifications' : 'Créer le dossier')}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
