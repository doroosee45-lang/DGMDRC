const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
  foreignerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Foreigner', required: true, index: true },
  passportNumber: { type: String, required: true, uppercase: true, index: true },

  reason: { type: String, required: true },
  reasonCategory: {
    type: String,
    enum: ['SECURITE_NATIONALE', 'INFRACTION_GRAVE', 'FRAUDE', 'EXPULSION', 'ORDRE_PUBLIC', 'AUTRE'],
    required: true,
  },

  level: {
    type: String,
    enum: ['AVERTISSEMENT', 'INTERDICTION_TEMPORAIRE', 'INTERDICTION_PERMANENTE'],
    required: true,
    default: 'INTERDICTION_TEMPORAIRE',
  },

  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date, default: null },

  isActive: { type: Boolean, default: true, index: true },

  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },

  liftedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  liftedAt: { type: Date, default: null },
  liftReason: { type: String, default: '' },

  notes: { type: String, default: '' },
  confidentialityLevel: { type: String, enum: ['PUBLIC', 'RESTREINT', 'SECRET'], default: 'RESTREINT' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Blacklist', blacklistSchema);
