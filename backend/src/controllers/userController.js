const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

exports.create = async (req, res) => {
  try {
    const existing = await User.findOne({ email: req.body.email });
    if (existing) return res.status(409).json({ success: false, message: 'Email déjà utilisé.' });
    const user = await User.create({ ...req.body, createdBy: req.user._id });
    const { password, twoFactorSecret, ...userData } = user.toObject();
    await AuditLog.createLog({
      userId: req.user._id, userName: req.user.name, userRole: req.user.role, institution: req.user.institution,
      action: 'CREATION', targetType: 'USER', targetId: String(user._id), targetLabel: `${user.name} (${user.role})`,
      newValue: { email: user.email, role: user.role, institution: user.institution },
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '', severity: 'AVERTISSEMENT',
    });
    res.status(201).json({ success: true, data: userData, message: 'Utilisateur créé avec succès.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.', error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, isActive, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -twoFactorSecret')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: users, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    const { password, twoFactorSecret, ...updateData } = req.body;
    Object.assign(user, updateData);
    await user.save();
    const { password: p, twoFactorSecret: t, ...userData } = user.toObject();
    res.json({ success: true, data: userData, message: 'Utilisateur mis à jour.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.deactivate = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' });
    if (String(user._id) === String(req.user._id)) return res.status(400).json({ success: false, message: 'Impossible de désactiver votre propre compte.' });
    user.isActive = false;
    await user.save();
    await AuditLog.createLog({
      userId: req.user._id, userName: req.user.name, userRole: req.user.role, institution: req.user.institution,
      action: 'SUPPRESSION_LOGIQUE', targetType: 'USER', targetId: String(user._id), targetLabel: user.name,
      oldValue: { isActive: true }, newValue: { isActive: false },
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '', severity: 'CRITIQUE',
    });
    res.json({ success: true, message: 'Compte désactivé avec succès.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect.' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};
