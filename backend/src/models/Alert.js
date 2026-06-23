const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  foreignerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Foreigner', required: true, index: true },
  type: {
    type: String,
    required: true,
    enum: [
      'VISA_EXPIRE', 'DEPASSEMENT_SEJOUR', 'PASSEPORT_EXPIRE',
      'TENTATIVE_SORTIE_VISA_EXPIRE', 'PERSONNE_RECHERCHEE', 'FAUSSE_IDENTITE',
      'PASSAGE_SUSPECT', 'DOUBLE_IDENTITE', 'DOSSIER_INCOMPLET',
      'SEJOUR_HORS_ZONE', 'BLACKLIST_ENTREE', 'INFRACTION_GRAVE'
    ],
    index: true,
  },
  severity: {
    type: String,
    enum: ['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE'],
    required: true,
    default: 'MOYENNE',
    index: true,
  },
  message: { type: String, required: true },
  details: { type: String, default: '' },

  status: {
    type: String,
    enum: ['ACTIVE', 'EN_TRAITEMENT', 'RESOLUE', 'IGNOREE'],
    default: 'ACTIVE',
    index: true,
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolutionNote: { type: String, default: '' },

  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isAutomatic: { type: Boolean, default: true },

  notifiedRoles: [{ type: String }],
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
  timestamps: true,
});

alertSchema.index({ status: 1, severity: -1 });
alertSchema.index({ foreignerId: 1, status: 1 });

module.exports = mongoose.model('Alert', alertSchema);
