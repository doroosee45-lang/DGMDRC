const Movement = require('../models/Movement');
const Foreigner = require('../models/Foreigner');
const Alert = require('../models/Alert');
const Blacklist = require('../models/Blacklist');
const AuditLog = require('../models/AuditLog');
const moment = require('moment');

const calculateStayDays = async (foreignerId) => {
  const movements = await Movement.find({ foreignerId, verificationStatus: 'AUTORISE' }).sort({ datetime: 1 });
  let totalDays = 0;
  let entryDate = null;
  for (const mv of movements) {
    if (mv.type === 'ENTREE') entryDate = mv.datetime;
    else if (mv.type === 'SORTIE' && entryDate) {
      totalDays += moment(mv.datetime).diff(moment(entryDate), 'days');
      entryDate = null;
    }
  }
  if (entryDate) totalDays += moment().diff(moment(entryDate), 'days');
  return totalDays;
};

exports.register = async (req, res) => {
  try {
    const { foreignerId, type, borderPostId, transport, provenance, destination, passportScanned, biometricVerified, notes } = req.body;

    const foreigner = await Foreigner.findById(foreignerId);
    if (!foreigner) return res.status(404).json({ success: false, message: 'Dossier étranger introuvable.' });

    const alerts = [];
    let verificationStatus = 'AUTORISE';

    const blacklistEntry = await Blacklist.findOne({ foreignerId, isActive: true });
    if (blacklistEntry) {
      verificationStatus = 'REFUSE';
      alerts.push({ foreignerId, type: 'BLACKLIST_ENTREE', severity: 'CRITIQUE', message: `Personne sur la liste noire: ${blacklistEntry.reason}`, isAutomatic: true, notifiedRoles: ['AGENT_FRONTALIER_AERIEN', 'AGENT_FRONTALIER_TERRESTRE', 'POLICE_NATIONALE', 'ANR_RENSEIGNEMENT'] });
    }

    if (type === 'ENTREE' && foreigner.visa.expiryDate < new Date()) {
      verificationStatus = 'ALERTE';
      alerts.push({ foreignerId, type: 'VISA_EXPIRE', severity: 'CRITIQUE', message: `Visa expiré le ${moment(foreigner.visa.expiryDate).format('DD/MM/YYYY')}`, isAutomatic: true, notifiedRoles: ['AGENT_DGM', 'POLICE_NATIONALE'] });
    }

    if (foreigner.passport.expiryDate < new Date()) {
      alerts.push({ foreignerId, type: 'PASSEPORT_EXPIRE', severity: 'HAUTE', message: `Passeport expiré le ${moment(foreigner.passport.expiryDate).format('DD/MM/YYYY')}`, isAutomatic: true, notifiedRoles: ['AGENT_DGM'] });
    }

    if (alerts.length > 0 && verificationStatus === 'AUTORISE') verificationStatus = 'ALERTE';
    if (blacklistEntry) verificationStatus = 'REFUSE';

    const movement = await Movement.create({
      foreignerId, type, borderPostId, agentId: req.user._id,
      transport, provenance, destination, passportScanned, biometricVerified,
      notes, verificationStatus, datetime: new Date(),
    });

    for (const alertData of alerts) {
      const existing = await Alert.findOne({ foreignerId, type: alertData.type, status: 'ACTIVE' });
      if (!existing) await Alert.create(alertData);
    }

    if (type === 'ENTREE' && verificationStatus === 'AUTORISE') {
      foreigner.presenceStatus = 'PRESENT';
      foreigner.lastEntryDate = new Date();
      foreigner.entryCount += 1;
    } else if (type === 'SORTIE') {
      foreigner.presenceStatus = 'SORTI';
      foreigner.lastExitDate = new Date();
      foreigner.totalDaysInRDC = await calculateStayDays(foreignerId);
    }

    if (foreigner.currentStatus === 'EN_REGLE' && alerts.some(a => a.severity === 'CRITIQUE')) {
      foreigner.currentStatus = 'EN_ALERTE';
    }

    await foreigner.save();

    await AuditLog.createLog({
      userId: req.user._id, userName: req.user.name, userRole: req.user.role, institution: req.user.institution,
      action: 'ENREGISTREMENT_MOUVEMENT', targetType: 'MOVEMENT', targetId: String(movement._id),
      targetLabel: `${type} - ${foreigner.lastName} ${foreigner.firstName}`,
      newValue: { type, verificationStatus, borderPostId },
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '',
      severity: verificationStatus === 'AUTORISE' ? 'INFO' : 'AVERTISSEMENT',
    });

    res.status(201).json({
      success: true,
      data: { movement, alerts, verificationStatus },
      message: `Passage enregistré: ${verificationStatus}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
  }
};

exports.getByForeigner = async (req, res) => {
  try {
    const { foreignerId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const total = await Movement.countDocuments({ foreignerId });
    const movements = await Movement.find({ foreignerId })
      .populate('borderPostId', 'name code type province')
      .populate('agentId', 'name role')
      .sort({ datetime: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: movements, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, borderPostId, dateFrom, dateTo, verificationStatus } = req.query;
    const query = {};
    if (type) query.type = type;
    if (borderPostId) query.borderPostId = borderPostId;
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (dateFrom || dateTo) {
      query.datetime = {};
      if (dateFrom) query.datetime.$gte = new Date(dateFrom);
      if (dateTo) query.datetime.$lte = new Date(dateTo);
    }

    const total = await Movement.countDocuments(query);
    const movements = await Movement.find(query)
      .populate('foreignerId', 'lastName firstName nationality dossierNumber')
      .populate('borderPostId', 'name code type province')
      .populate('agentId', 'name role')
      .sort({ datetime: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: movements, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
