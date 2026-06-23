const mongoose = require('mongoose');

const correctionRequestSchema = new mongoose.Schema({
  foreignerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Foreigner', required: true, index: true },

  field: { type: String, required: true },
  fieldLabel: { type: String, required: true },
  oldValue: { type: mongoose.Schema.Types.Mixed, required: true },
  newValue: { type: mongoose.Schema.Types.Mixed, required: true },
  reason: { type: String, required: true },
  justificationDoc: { type: String, default: null },

  protectionLevel: {
    type: String,
    enum: ['CRITIQUE', 'HAUTE', 'NORMALE'],
    required: true,
    default: 'CRITIQUE',
  },

  status: {
    type: String,
    enum: ['EN_ATTENTE', 'EN_REVISION', 'VALIDEE', 'REJETEE', 'ANNULEE'],
    default: 'EN_ATTENTE',
    index: true,
  },

  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, default: '' },

  appliedAt: { type: Date, default: null },
}, {
  timestamps: true,
});

correctionRequestSchema.index({ foreignerId: 1, status: 1 });
correctionRequestSchema.index({ requestedBy: 1 });

module.exports = mongoose.model('CorrectionRequest', correctionRequestSchema);
