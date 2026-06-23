const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema({
  foreignerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Foreigner', required: true, index: true },
  type: { type: String, required: true, enum: ['ENTREE', 'SORTIE', 'TRANSIT'], index: true },
  borderPostId: { type: mongoose.Schema.Types.ObjectId, ref: 'BorderPost', required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  transport: {
    mode: { type: String, enum: ['AERIEN', 'TERRESTRE', 'MARITIME', 'AUTRE'], required: true },
    reference: { type: String, default: '' },
    operator: { type: String, default: '' },
  },

  provenance: { type: String, default: '' },
  destination: { type: String, default: '' },

  verificationStatus: {
    type: String,
    enum: ['AUTORISE', 'ALERTE', 'REFUSE', 'INTERPELLE'],
    required: true,
    default: 'AUTORISE',
  },
  refusalReason: { type: String, default: '' },
  alertsTriggered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }],

  passportScanned: { type: Boolean, default: false },
  biometricVerified: { type: Boolean, default: false },

  notes: { type: String, default: '' },
  datetime: { type: Date, required: true, default: Date.now, index: true },
}, {
  timestamps: true,
});

movementSchema.index({ foreignerId: 1, datetime: -1 });
movementSchema.index({ borderPostId: 1, datetime: -1 });
movementSchema.index({ type: 1, datetime: -1 });

module.exports = mongoose.model('Movement', movementSchema);
