const mongoose = require('mongoose');
const crypto = require('crypto');

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  institution: { type: String, default: '' },

  action: {
    type: String,
    required: true,
    enum: [
      'CREATION', 'LECTURE', 'MODIFICATION', 'SUPPRESSION_LOGIQUE',
      'VALIDATION', 'REJET', 'EXPORT', 'CONNEXION', 'DECONNEXION',
      'TENTATIVE_CONNEXION_ECHOUEE', 'VERROUILLAGE_COMPTE',
      'ENREGISTREMENT_MOUVEMENT', 'AJOUT_INFRACTION', 'CREATION_ALERTE',
      'RESOLUTION_ALERTE', 'BLACKLIST', 'DEBLOCAGE_BLACKLIST',
      'DEMANDE_CORRECTION', 'VALIDATION_CORRECTION', 'MODIFICATION_CONFIG',
      'ACCES_REFUSE', 'GENERATION_RAPPORT', 'ACTIVATION_2FA', 'DESACTIVATION_2FA'
    ],
    index: true,
  },

  targetType: { type: String, required: true, index: true },
  targetId: { type: String, required: true },
  targetLabel: { type: String, default: '' },

  oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
  newValue: { type: mongoose.Schema.Types.Mixed, default: null },

  ipAddress: { type: String, required: true },
  userAgent: { type: String, default: '' },
  sessionId: { type: String, default: '' },

  previousHash: { type: String, default: '' },
  hash: { type: String, required: true },

  severity: { type: String, enum: ['INFO', 'AVERTISSEMENT', 'CRITIQUE'], default: 'INFO' },
  notes: { type: String, default: '' },
}, {
  timestamps: true,
});

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ createdAt: -1 });

auditLogSchema.statics.createLog = async function (data) {
  const lastLog = await this.findOne().sort({ createdAt: -1 }).select('hash');
  const previousHash = lastLog ? lastLog.hash : '0000000000000000000000000000000000000000000000000000000000000000';

  const logData = { ...data, previousHash };
  const hashContent = JSON.stringify({
    userId: logData.userId,
    action: logData.action,
    targetId: logData.targetId,
    timestamp: new Date().toISOString(),
    previousHash,
  });
  const hash = crypto.createHash('sha256').update(hashContent).digest('hex');

  return this.create({ ...logData, hash });
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
