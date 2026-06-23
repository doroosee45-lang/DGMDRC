const Blacklist = require('../models/Blacklist');
const Foreigner = require('../models/Foreigner');
const Infraction = require('../models/Infraction');
const AuditLog = require('../models/AuditLog');

exports.add = async (req, res) => {
  try {
    const { foreignerId, reason, reasonCategory, level, startDate, endDate, notes, confidentialityLevel } = req.body;

    const foreigner = await Foreigner.findById(foreignerId);
    if (!foreigner) return res.status(404).json({ success: false, message: 'Dossier introuvable.' });

    const existing = await Blacklist.findOne({ foreignerId, isActive: true });
    if (existing) return res.status(409).json({ success: false, message: 'Cette personne est déjà sur la liste noire.' });

    const entry = await Blacklist.create({
      foreignerId, passportNumber: foreigner.passport.number,
      reason, reasonCategory, level, startDate: startDate || new Date(), endDate,
      notes, confidentialityLevel, issuedBy: req.user._id,
    });

    foreigner.isBlacklisted = true;
    foreigner.currentStatus = 'BLACKLISTE';
    await foreigner.save();

    await AuditLog.createLog({
      userId: req.user._id, userName: req.user.name, userRole: req.user.role, institution: req.user.institution,
      action: 'BLACKLIST', targetType: 'BLACKLIST', targetId: String(entry._id),
      targetLabel: `${foreigner.lastName} ${foreigner.firstName} - ${level}`,
      newValue: { reason, level, passportNumber: foreigner.passport.number },
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '', severity: 'CRITIQUE',
    });

    res.status(201).json({ success: true, data: entry, message: 'Personne ajoutée à la liste noire.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, isActive, level } = req.query;
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    else query.isActive = true;
    if (level) query.level = level;

    const role = req.user.role;
    if (!['ADMIN_NATIONAL', 'POLICE_NATIONALE', 'ANR_RENSEIGNEMENT', 'JUSTICE'].includes(role)) {
      query.confidentialityLevel = 'PUBLIC';
    }

    const total = await Blacklist.countDocuments(query);
    const entries = await Blacklist.find(query)
      .populate('foreignerId', 'lastName firstName nationality dossierNumber photo')
      .populate('issuedBy', 'name role institution')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: entries, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.check = async (req, res) => {
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

exports.lift = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await Blacklist.findById(id).populate('foreignerId');
    if (!entry) return res.status(404).json({ success: false, message: 'Entrée introuvable.' });

    entry.isActive = false;
    entry.liftedBy = req.user._id;
    entry.liftedAt = new Date();
    entry.liftReason = req.body.reason || '';
    await entry.save();

    const foreigner = await Foreigner.findById(entry.foreignerId);
    if (foreigner) {
      foreigner.isBlacklisted = false;
      const activeInfraction = await Infraction.findOne({
        foreignerId: foreigner._id,
        status: { $in: ['EN_COURS', 'APPEL'] },
      });
      foreigner.currentStatus = activeInfraction ? 'EN_INFRACTION' : 'EN_REGLE';
      await foreigner.save();
    }

    await AuditLog.createLog({
      userId: req.user._id, userName: req.user.name, userRole: req.user.role, institution: req.user.institution,
      action: 'DEBLOCAGE_BLACKLIST', targetType: 'BLACKLIST', targetId: String(entry._id),
      oldValue: { isActive: true }, newValue: { isActive: false, liftReason: entry.liftReason },
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '', severity: 'AVERTISSEMENT',
    });

    res.json({ success: true, message: 'Interdiction levée avec succès.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
