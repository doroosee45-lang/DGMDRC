const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: [
      'ALERTE_CRITIQUE', 'ALERTE_HAUTE', 'ALERTE_MOYENNE',
      'CORRECTION_SOUMISE', 'CORRECTION_VALIDEE', 'CORRECTION_REJETEE',
      'INFRACTION_AJOUTEE', 'DOSSIER_CREE', 'BLACKLIST_AJOUT',
      'COMPTE_VERROUILLE', 'SYSTEME'
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: { type: String, default: null },
  relatedType: { type: String, default: null },
  isRead: { type: Boolean, default: false, index: true },
  readAt: { type: Date, default: null },
}, {
  timestamps: true,
});

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
