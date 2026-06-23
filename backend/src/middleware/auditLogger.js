const AuditLog = require('../models/AuditLog');

const auditLog = (action, targetType, getSeverity = () => 'INFO') => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async function (data) {
      if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
        try {
          const targetId = req.params.id || req.params.dossierNumber || (data.data && data.data._id) || 'N/A';
          await AuditLog.createLog({
            userId: req.user._id,
            userName: req.user.name,
            userRole: req.user.role,
            institution: req.user.institution || '',
            action,
            targetType,
            targetId: String(targetId),
            targetLabel: req.auditLabel || '',
            oldValue: req.auditOldValue || null,
            newValue: req.auditNewValue || null,
            ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'] || '',
            sessionId: req.sessionId || '',
            severity: getSeverity(req, res, data),
          });
        } catch (err) {
          console.error('Audit log error:', err.message);
        }
      }
      return originalJson(data);
    };
    next();
  };
};

module.exports = { auditLog };
