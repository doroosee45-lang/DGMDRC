const path = require('path');
const fs = require('fs');
const Foreigner = require('../models/Foreigner');
const Alert = require('../models/Alert');
const Blacklist = require('../models/Blacklist');
const AuditLog = require('../models/AuditLog');
const moment = require('moment');

exports.create = async (req, res) => {
  try {
    const existing = await Foreigner.findOne({ 'passport.number': req.body.passport?.number?.toUpperCase() });
    if (existing) return res.status(409).json({ success: false, message: 'Un dossier avec ce numéro de passeport existe déjà.', data: { dossierNumber: existing.dossierNumber } });

    const foreigner = await Foreigner.create({ ...req.body, createdBy: req.user._id, updatedBy: req.user._id });

    await AuditLog.createLog({
      userId: req.user._id, userName: req.user.name, userRole: req.user.role, institution: req.user.institution,
      action: 'CREATION', targetType: 'FOREIGNER', targetId: String(foreigner._id), targetLabel: `${foreigner.lastName} ${foreigner.firstName} - ${foreigner.dossierNumber}`,
      newValue: { dossierNumber: foreigner.dossierNumber, passport: foreigner.passport.number },
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '', severity: 'INFO',
    });

    res.status(201).json({ success: true, data: foreigner, message: 'Dossier créé avec succès.' });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Doublon détecté (passeport ou numéro de dossier).' });
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
  }
};

const ALLOWED_SORT_FIELDS = ['createdAt', 'lastName', 'firstName', 'nationality', 'currentStatus', 'visa.expiryDate', 'passport.expiryDate'];

exports.getAll = async (req, res) => {
  try {
    const { page = 1, search, nationality, status, isBlacklisted, order = 'desc' } = req.query;
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const sort = ALLOWED_SORT_FIELDS.includes(req.query.sort) ? req.query.sort : 'createdAt';

    const query = { isActive: true };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { lastName: { $regex: escaped, $options: 'i' } },
        { firstName: { $regex: escaped, $options: 'i' } },
        { dossierNumber: { $regex: escaped, $options: 'i' } },
        { 'passport.number': { $regex: escaped, $options: 'i' } },
      ];
    }
    if (nationality) query.nationality = nationality.toUpperCase();
    if (status) query.currentStatus = status;
    if (isBlacklisted !== undefined) query.isBlacklisted = isBlacklisted === 'true';

    const total = await Foreigner.countDocuments(query);
    const foreigners = await Foreigner.find(query)
      .select('-notes -biometricRef')
      .populate('createdBy', 'name role')
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip((Number(page) - 1) * limit)
      .limit(limit);

    res.json({ success: true, data: foreigners, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const query = id.startsWith('DGM-') ? { dossierNumber: id } : { _id: id };
    const foreigner = await Foreigner.findOne(query)
      .populate('createdBy', 'name role institution')
      .populate('updatedBy', 'name role');

    if (!foreigner) return res.status(404).json({ success: false, message: 'Dossier introuvable.' });

    const role = req.user.role;
    let data = foreigner.toObject();

    if (!['ADMIN_NATIONAL', 'AGENT_DGM'].includes(role)) {
      delete data.biometricRef;
    }
    if (!['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM', 'ANR_RENSEIGNEMENT'].includes(role)) {
      data.notes = data.notes?.filter(n => !n.isConfidential) || [];
    }
    if (role === 'AMBASSADE_CONSULAT') {
      data = { _id: data._id, dossierNumber: data.dossierNumber, lastName: data.lastName, firstName: data.firstName, nationality: data.nationality, passport: data.passport, visa: data.visa, currentStatus: data.currentStatus };
    }

    await AuditLog.createLog({
      userId: req.user._id, userName: req.user.name, userRole: req.user.role, institution: req.user.institution,
      action: 'LECTURE', targetType: 'FOREIGNER', targetId: String(foreigner._id), targetLabel: `${foreigner.lastName} ${foreigner.firstName}`,
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '', severity: 'INFO',
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const PROTECTED_FIELDS = ['lastName', 'firstName', 'dateOfBirth', 'nationality', 'passport'];
    const hasProtectedField = PROTECTED_FIELDS.some(f => req.body[f] !== undefined);
    if (hasProtectedField && !['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Modification de champs critiques non autorisée. Soumettez une demande de correction.' });
    }

    const foreigner = await Foreigner.findById(id);
    if (!foreigner) return res.status(404).json({ success: false, message: 'Dossier introuvable.' });

    const oldValue = foreigner.toObject();
    Object.assign(foreigner, req.body);
    foreigner.updatedBy = req.user._id;
    foreigner.version += 1;
    await foreigner.save();

    await AuditLog.createLog({
      userId: req.user._id, userName: req.user.name, userRole: req.user.role, institution: req.user.institution,
      action: 'MODIFICATION', targetType: 'FOREIGNER', targetId: String(foreigner._id), targetLabel: `${foreigner.lastName} ${foreigner.firstName}`,
      oldValue: { status: oldValue.currentStatus, version: oldValue.version },
      newValue: { status: foreigner.currentStatus, version: foreigner.version },
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '', severity: 'INFO',
    });

    res.json({ success: true, data: foreigner, message: 'Dossier mis à jour avec succès.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total, enRegle, enAlerte, enInfraction, blacklisted, present] = await Promise.all([
      Foreigner.countDocuments({ isActive: true }),
      Foreigner.countDocuments({ isActive: true, currentStatus: 'EN_REGLE' }),
      Foreigner.countDocuments({ isActive: true, currentStatus: 'EN_ALERTE' }),
      Foreigner.countDocuments({ isActive: true, currentStatus: 'EN_INFRACTION' }),
      Foreigner.countDocuments({ isActive: true, isBlacklisted: true }),
      Foreigner.countDocuments({ isActive: true, presenceStatus: 'PRESENT' }),
    ]);

    const byNationality = await Foreigner.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$nationality', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const byVisa = await Foreigner.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$visa.type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const monthlyEntries = await require('../models/Movement').aggregate([
      { $match: { type: 'ENTREE', datetime: { $gte: moment().subtract(12, 'months').toDate() } } },
      { $group: { _id: { month: { $month: '$datetime' }, year: { $year: '$datetime' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      data: { total, enRegle, enAlerte, enInfraction, blacklisted, present, byNationality, byVisa, monthlyEntries }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.updatePhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Aucun fichier fourni.' });
    const foreigner = await Foreigner.findById(req.params.id);
    if (!foreigner) return res.status(404).json({ success: false, message: 'Dossier introuvable.' });

    if (foreigner.photo) {
      const oldPath = path.join(__dirname, '../../', foreigner.photo);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    foreigner.photo = `/uploads/photos/${req.file.filename}`;
    foreigner.updatedBy = req.user._id;
    await foreigner.save();

    res.json({ success: true, data: { photo: foreigner.photo }, message: 'Photo mise à jour.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.checkBlacklist = async (req, res) => {
  try {
    const { passportNumber } = req.params;
    const entry = await Blacklist.findOne({ passportNumber: passportNumber.toUpperCase(), isActive: true })
      .populate('foreignerId', 'lastName firstName nationality')
      .populate('issuedBy', 'name institution');
    res.json({ success: true, data: { isBlacklisted: !!entry, entry: entry || null } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
