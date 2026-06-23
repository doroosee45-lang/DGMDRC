const CorrectionRequest = require('../models/CorrectionRequest');
const Foreigner = require('../models/Foreigner');
const AuditLog = require('../models/AuditLog');

const FIELD_PROTECTION = {
  lastName: 'CRITIQUE', firstName: 'CRITIQUE', dateOfBirth: 'CRITIQUE',
  nationality: 'CRITIQUE', 'passport.number': 'CRITIQUE', 'passport.issueDate': 'CRITIQUE',
  'passport.expiryDate': 'HAUTE', 'visa.number': 'HAUTE', 'visa.type': 'HAUTE',
  'visa.expiryDate': 'HAUTE', addresses: 'NORMALE', emergencyContacts: 'NORMALE',
  employer: 'NORMALE', stayPurpose: 'NORMALE',
};

const FIELD_LABELS = {
  lastName: 'Nom de famille', firstName: 'Prénom', dateOfBirth: 'Date de naissance',
  nationality: 'Nationalité', 'passport.number': 'Numéro de passeport',
  'passport.expiryDate': "Date d'expiration du passeport",
  'visa.number': 'Numéro de visa', 'visa.type': 'Type de visa',
  'visa.expiryDate': "Date d'expiration du visa",
};

exports.submit = async (req, res) => {
  try {
    const { foreignerId, field, oldValue, newValue, reason } = req.body;

    if (!FIELD_PROTECTION[field]) {
      return res.status(400).json({ success: false, message: `Champ '${field}' non autorisé pour correction.` });
    }

    const foreigner = await Foreigner.findById(foreignerId);
    if (!foreigner) return res.status(404).json({ success: false, message: 'Dossier introuvable.' });

    const existing = await CorrectionRequest.findOne({ foreignerId, field, status: 'EN_ATTENTE' });
    if (existing) return res.status(409).json({ success: false, message: 'Une demande de correction est déjà en attente pour ce champ.' });

    if (String(oldValue) === String(newValue)) {
      return res.status(400).json({ success: false, message: 'La nouvelle valeur est identique à l\'ancienne.' });
    }

    const protectionLevel = FIELD_PROTECTION[field];
    const fieldLabel = FIELD_LABELS[field] || field;

    const correction = await CorrectionRequest.create({
      foreignerId, field, fieldLabel, oldValue, newValue, reason,
      protectionLevel, requestedBy: req.user._id,
    });

    await AuditLog.createLog({
      userId: req.user._id, userName: req.user.name, userRole: req.user.role, institution: req.user.institution,
      action: 'DEMANDE_CORRECTION', targetType: 'CORRECTION', targetId: String(correction._id),
      targetLabel: `${fieldLabel} - ${foreigner.dossierNumber}`,
      newValue: { field, oldValue, newValue: '[valeur proposée]' },
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '', severity: 'AVERTISSEMENT',
    });

    res.status(201).json({ success: true, data: correction, message: 'Demande de correction soumise. En attente de validation.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
  }
};

exports.validate = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, reviewNote } = req.body;
    if (!['VALIDEE', 'REJETEE'].includes(decision)) return res.status(400).json({ success: false, message: 'Décision invalide.' });

    const correction = await CorrectionRequest.findById(id).populate('foreignerId');
    if (!correction) return res.status(404).json({ success: false, message: 'Demande introuvable.' });
    if (correction.status !== 'EN_ATTENTE' && correction.status !== 'EN_REVISION') {
      return res.status(400).json({ success: false, message: 'Cette demande a déjà été traitée.' });
    }

    if (correction.protectionLevel === 'CRITIQUE' && req.user.role !== 'ADMIN_NATIONAL') {
      return res.status(403).json({ success: false, message: 'Correction critique: validation Admin National requise.' });
    }

    correction.status = decision;
    correction.reviewedBy = req.user._id;
    correction.reviewedAt = new Date();
    correction.reviewNote = reviewNote || '';

    if (decision === 'VALIDEE') {
      const foreigner = await Foreigner.findById(correction.foreignerId);
      if (foreigner) {
        const fieldParts = correction.field.split('.');
        if (fieldParts.length === 1) {
          foreigner[fieldParts[0]] = correction.newValue;
        } else if (fieldParts.length === 2) {
          foreigner[fieldParts[0]][fieldParts[1]] = correction.newValue;
        }
        foreigner.updatedBy = req.user._id;
        foreigner.version += 1;
        await foreigner.save();
      }
      correction.appliedAt = new Date();
    }

    await correction.save();

    await AuditLog.createLog({
      userId: req.user._id, userName: req.user.name, userRole: req.user.role, institution: req.user.institution,
      action: 'VALIDATION_CORRECTION', targetType: 'CORRECTION', targetId: String(correction._id),
      targetLabel: `${correction.fieldLabel} - ${decision}`,
      oldValue: { status: 'EN_ATTENTE' }, newValue: { status: decision, reviewNote },
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '',
      severity: decision === 'VALIDEE' ? 'AVERTISSEMENT' : 'INFO',
    });

    res.json({ success: true, data: correction, message: `Demande ${decision === 'VALIDEE' ? 'validée et appliquée' : 'rejetée'}.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, protectionLevel } = req.query;
    const query = {};
    if (status) query.status = status;
    else query.status = { $in: ['EN_ATTENTE', 'EN_REVISION'] };
    if (protectionLevel) query.protectionLevel = protectionLevel;

    if (!['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL'].includes(req.user.role)) {
      query.requestedBy = req.user._id;
    }

    const total = await CorrectionRequest.countDocuments(query);
    const corrections = await CorrectionRequest.find(query)
      .populate('foreignerId', 'lastName firstName dossierNumber nationality')
      .populate('requestedBy', 'name role institution')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: corrections, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
