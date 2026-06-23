const Infraction = require('../models/Infraction');
const Foreigner = require('../models/Foreigner');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');

exports.create = async (req, res) => {
  try {
    const { foreignerId } = req.body;
    const foreigner = await Foreigner.findById(foreignerId);
    if (!foreigner) return res.status(404).json({ success: false, message: 'Dossier étranger introuvable.' });

    const infraction = await Infraction.create({ ...req.body, agentId: req.user._id });

    if (['FAUSSE_IDENTITE', 'SECURITE_NATIONALE', 'FRAUDE_DOCUMENTAIRE', 'ENTREE_IRREGULIERE'].includes(infraction.nature)) {
      foreigner.currentStatus = 'EN_INFRACTION';
      await Alert.create({
        foreignerId, type: 'INFRACTION_GRAVE', severity: 'CRITIQUE',
        message: `Infraction grave enregistrée: ${infraction.nature} par ${req.user.institution}`,
        triggeredBy: req.user._id, isAutomatic: false,
        notifiedRoles: ['ADMIN_NATIONAL', 'ANR_RENSEIGNEMENT', 'POLICE_NATIONALE'],
      });
    } else if (foreigner.currentStatus === 'EN_REGLE') {
      foreigner.currentStatus = 'EN_ALERTE';
    }
    await foreigner.save();

    await AuditLog.createLog({
      userId: req.user._id, userName: req.user.name, userRole: req.user.role, institution: req.user.institution,
      action: 'AJOUT_INFRACTION', targetType: 'INFRACTION', targetId: String(infraction._id),
      targetLabel: `${infraction.nature} - ${foreigner.lastName} ${foreigner.firstName}`,
      newValue: { nature: infraction.nature, pvReference: infraction.pvReference },
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '', severity: 'AVERTISSEMENT',
    });

    res.status(201).json({ success: true, data: infraction, message: 'Infraction enregistrée avec succès.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
  }
};

exports.getByForeigner = async (req, res) => {
  try {
    const { foreignerId } = req.params;
    const infractions = await Infraction.find({ foreignerId, isActive: true })
      .populate('agentId', 'name role institution')
      .populate('updatedBy', 'name')
      .sort({ dateFait: -1 });
    res.json({ success: true, data: infractions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, nature, status, gravity } = req.query;
    const query = { isActive: true };
    if (nature) query.nature = nature;
    if (status) query.status = status;
    if (gravity) query.gravity = gravity;
    const total = await Infraction.countDocuments(query);
    const infractions = await Infraction.find(query)
      .populate('foreignerId', 'lastName firstName nationality dossierNumber')
      .populate('agentId', 'name role institution')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: infractions, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const infraction = await Infraction.findById(id);
    if (!infraction) return res.status(404).json({ success: false, message: 'Infraction introuvable.' });
    Object.assign(infraction, req.body);
    infraction.updatedBy = req.user._id;
    await infraction.save();
    res.json({ success: true, data: infraction, message: 'Infraction mise à jour.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
