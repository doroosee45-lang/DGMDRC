const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Accès refusé. Token manquant.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -twoFactorSecret');
    if (!user) return res.status(401).json({ success: false, message: 'Utilisateur introuvable.' });
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Compte désactivé.' });
    if (user.isLocked()) return res.status(401).json({ success: false, message: 'Compte temporairement verrouillé.' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré.' });
  }
};

module.exports = { protect };
