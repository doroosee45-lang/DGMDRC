const PERMISSIONS = {
  CREATE_DOSSIER: ['ADMIN_NATIONAL', 'AGENT_DGM'],
  READ_DOSSIER_FULL: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM', 'AGENT_FRONTALIER_AERIEN', 'AGENT_FRONTALIER_TERRESTRE', 'AGENT_FRONTALIER_MARITIME', 'POLICE_NATIONALE', 'JUSTICE', 'ANR_RENSEIGNEMENT'],
  READ_DOSSIER_SUMMARY: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM', 'AGENT_FRONTALIER_AERIEN', 'AGENT_FRONTALIER_TERRESTRE', 'AGENT_FRONTALIER_MARITIME', 'POLICE_NATIONALE', 'JUSTICE', 'ANR_RENSEIGNEMENT', 'AMBASSADE_CONSULAT'],
  MODIFY_IDENTITY: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL'],
  REGISTER_MOVEMENT: ['ADMIN_NATIONAL', 'AGENT_DGM', 'AGENT_FRONTALIER_AERIEN', 'AGENT_FRONTALIER_TERRESTRE', 'AGENT_FRONTALIER_MARITIME'],
  ADD_INFRACTION: ['ADMIN_NATIONAL', 'POLICE_NATIONALE', 'JUSTICE'],
  CREATE_ALERT: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM', 'AGENT_FRONTALIER_AERIEN', 'AGENT_FRONTALIER_TERRESTRE', 'AGENT_FRONTALIER_MARITIME', 'POLICE_NATIONALE', 'ANR_RENSEIGNEMENT'],
  VALIDATE_CORRECTION: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL'],
  READ_AUDIT_LOGS: ['ADMIN_NATIONAL', 'AUDITEUR'],
  GENERATE_REPORTS: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM', 'MINISTERE_INTERIEUR'],
  MANAGE_USERS: ['ADMIN_NATIONAL'],
  ACCESS_BIOMETRICS: ['ADMIN_NATIONAL', 'AGENT_DGM'],
  EXPORT_DATA: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'MINISTERE_INTERIEUR'],
  BLACKLIST: ['ADMIN_NATIONAL', 'POLICE_NATIONALE', 'JUSTICE', 'ANR_RENSEIGNEMENT'],
  DEACTIVATE_ACCOUNT: ['ADMIN_NATIONAL'],
  READ_INFRACTIONS: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM', 'POLICE_NATIONALE', 'JUSTICE', 'ANR_RENSEIGNEMENT'],
  READ_ALERTS: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM', 'AGENT_FRONTALIER_AERIEN', 'AGENT_FRONTALIER_TERRESTRE', 'AGENT_FRONTALIER_MARITIME', 'POLICE_NATIONALE', 'ANR_RENSEIGNEMENT'],
  READ_STATS: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM', 'MINISTERE_INTERIEUR', 'GOUVERNEMENT_PROVINCIAL'],
  MANAGE_BORDER_POSTS: ['ADMIN_NATIONAL', 'ADMIN_PROVINCIAL'],
  SUBMIT_CORRECTION: ['AGENT_DGM', 'ADMIN_PROVINCIAL', 'ADMIN_NATIONAL'],
};

const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié.' });
    }
    const userRole = req.user.role;
    const hasPermission = permissions.some(perm => {
      const allowedRoles = PERMISSIONS[perm];
      return allowedRoles && allowedRoles.includes(userRole);
    });
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle '${userRole}' insuffisant pour cette action.`,
      });
    }
    next();
  };
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Non authentifié.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé. Rôle '${req.user.role}' non autorisé.`,
      });
    }
    next();
  };
};

module.exports = { authorize, authorizeRoles, PERMISSIONS };
