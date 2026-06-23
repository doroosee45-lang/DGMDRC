const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '8h' });
  return { accessToken, refreshToken };
};

exports.login = async (req, res) => {
  try {
    const { email, password, totpCode } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });

    const user = await User.findOne({ email }).select('+password +twoFactorSecret');
    if (!user) return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Compte désactivé. Contactez votre administrateur.' });

    if (user.isLocked()) {
      return res.status(401).json({ success: false, message: `Compte verrouillé jusqu'à ${user.lockedUntil.toLocaleString('fr-FR')}.` });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      await AuditLog.createLog({
        userId: user._id, userName: user.name, userRole: user.role,
        action: 'TENTATIVE_CONNEXION_ECHOUEE', targetType: 'USER', targetId: String(user._id),
        ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '',
        severity: 'AVERTISSEMENT', hash: 'pending',
      });
      return res.status(401).json({ success: false, message: 'Identifiants incorrects.' });
    }

    if (user.twoFactorEnabled) {
      if (!totpCode) return res.status(200).json({ success: true, requiresTwoFactor: true, message: 'Code 2FA requis.' });
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret, encoding: 'base32', token: totpCode, window: 2
      });
      if (!verified) return res.status(401).json({ success: false, message: 'Code 2FA invalide.' });
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user._id);

    await AuditLog.createLog({
      userId: user._id, userName: user.name, userRole: user.role, institution: user.institution,
      action: 'CONNEXION', targetType: 'USER', targetId: String(user._id),
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '',
      severity: 'INFO',
    });

    res.json({
      success: true,
      data: {
        user: { _id: user._id, name: user.name, email: user.email, role: user.role, institution: user.institution, province: user.province, twoFactorEnabled: user.twoFactorEnabled },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.user) {
      await AuditLog.createLog({
        userId: req.user._id, userName: req.user.name, userRole: req.user.role, institution: req.user.institution,
        action: 'DECONNEXION', targetType: 'USER', targetId: String(req.user._id),
        ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '',
        severity: 'INFO',
      });
    }
    res.json({ success: true, message: 'Déconnecté avec succès.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Token de rafraîchissement manquant.' });
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Utilisateur invalide.' });
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Token invalide ou expiré.' });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

exports.setup2FA = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: `DGM-SIMN (${req.user.email})`, issuer: 'DGM-RDC' });
    const user = await User.findById(req.user._id);
    user.twoFactorSecret = secret.base32;
    await user.save();
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ success: true, data: { secret: secret.base32, qrCode: qrCodeUrl } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur configuration 2FA.' });
  }
};

exports.verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    if (!user.twoFactorSecret) return res.status(400).json({ success: false, message: 'Secret 2FA non configuré.' });
    const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token, window: 2 });
    if (!verified) return res.status(400).json({ success: false, message: 'Code invalide.' });
    user.twoFactorEnabled = true;
    await user.save();
    await AuditLog.createLog({
      userId: user._id, userName: user.name, userRole: user.role,
      action: 'ACTIVATION_2FA', targetType: 'USER', targetId: String(user._id),
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '',
      severity: 'INFO',
    });
    res.json({ success: true, message: '2FA activé avec succès.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur vérification 2FA.' });
  }
};

exports.disable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    if (!user.twoFactorEnabled) return res.status(400).json({ success: false, message: '2FA n\'est pas activé.' });
    const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token, window: 2 });
    if (!verified) return res.status(400).json({ success: false, message: 'Code invalide. Désactivation refusée.' });
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    await user.save();
    await AuditLog.createLog({
      userId: user._id, userName: user.name, userRole: user.role,
      action: 'DESACTIVATION_2FA', targetType: 'USER', targetId: String(user._id),
      ipAddress: req.ip || 'unknown', userAgent: req.headers['user-agent'] || '',
      severity: 'AVERTISSEMENT',
    });
    res.json({ success: true, message: '2FA désactivé.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur désactivation 2FA.' });
  }
};
