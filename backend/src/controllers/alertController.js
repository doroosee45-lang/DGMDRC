const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, severity, type } = req.query;
    const query = {};
    const FRONTALIER_ROLES = ['AGENT_FRONTALIER_AERIEN', 'AGENT_FRONTALIER_TERRESTRE', 'AGENT_FRONTALIER_MARITIME'];
    const role = req.user.role;

    if (FRONTALIER_ROLES.includes(role)) {
      query.notifiedRoles = { $in: [role] };
    } else if (role === 'POLICE_NATIONALE') {
      query.$or = [{ notifiedRoles: { $in: ['POLICE_NATIONALE'] } }, { severity: { $in: ['HAUTE', 'CRITIQUE'] } }];
    }

    if (status) query.status = status;
    else query.status = { $in: ['ACTIVE', 'EN_TRAITEMENT'] };
    if (severity) query.severity = severity;
    if (type) query.type = type;

    const total = await Alert.countDocuments(query);
    const alerts = await Alert.find(query)
      .populate('foreignerId', 'lastName firstName nationality dossierNumber photo')
      .populate('assignedTo', 'name role')
      .populate('resolvedBy', 'name')
      .sort({ severity: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: alerts, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.create = async (req, res) => {
  try {
    const alert = await Alert.create({ ...req.body, triggeredBy: req.user._id, isAutomatic: false });
    await AuditLog.createLog({
      userId: req.user._id, userName: req.user.name, userRole: req.user.role, institution: req.user.institution,
      action: 'CREATION_ALERTE', targetType: 'ALERT', targetId: String(alert._id), targetLabel: alert.type,
      newValue: { type: alert.type, severity: alert.severity },
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '', severity: 'AVERTISSEMENT',
    });
    res.status(201).json({ success: true, data: alert, message: 'Alerte créée.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.resolve = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alerte introuvable.' });

    alert.status = 'RESOLUE';
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.user._id;
    alert.resolutionNote = req.body.resolutionNote || '';
    await alert.save();

    await AuditLog.createLog({
      userId: req.user._id, userName: req.user.name, userRole: req.user.role, institution: req.user.institution,
      action: 'RESOLUTION_ALERTE', targetType: 'ALERT', targetId: String(alert._id), targetLabel: alert.type,
      oldValue: { status: 'ACTIVE' }, newValue: { status: 'RESOLUE' },
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '', severity: 'INFO',
    });

    res.json({ success: true, data: alert, message: 'Alerte résolue.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total, active, critique, haute, moyenne] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ status: 'ACTIVE' }),
      Alert.countDocuments({ severity: 'CRITIQUE', status: 'ACTIVE' }),
      Alert.countDocuments({ severity: 'HAUTE', status: 'ACTIVE' }),
      Alert.countDocuments({ severity: 'MOYENNE', status: 'ACTIVE' }),
    ]);
    const byType = await Alert.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data: { total, active, critique, haute, moyenne, byType } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
