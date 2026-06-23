const mongoose = require('mongoose');

const infractionSchema = new mongoose.Schema({
  foreignerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Foreigner', required: true, index: true },

  nature: {
    type: String,
    required: true,
    enum: [
      'DEPASSEMENT_SEJOUR', 'TRAVAIL_ILLEGAL', 'FAUSSE_IDENTITE', 'FRAUDE_DOCUMENTAIRE',
      'ENTREE_IRREGULIERE', 'SEJOUR_IRREGULIER', 'VIOLATION_ZONE', 'ACTIVITE_ILLICITE',
      'ORDRE_PUBLIC', 'SECURITE_NATIONALE', 'AUTRE'
    ],
  },
  description: { type: String, required: true },
  dateFait: { type: Date, required: true },

  authority: {
    name: { type: String, required: true },
    type: { type: String, enum: ['DGM', 'POLICE', 'ANR', 'JUSTICE', 'AUTRE'], required: true },
    reference: { type: String, default: '' },
  },

  pvReference: { type: String, required: true },
  documentRef: { type: String, default: null },

  status: {
    type: String,
    enum: ['EN_COURS', 'CLASSEE', 'JUGEE', 'APPEL', 'PRESCRITE'],
    default: 'EN_COURS',
    index: true,
  },

  sanctions: { type: String, default: '' },
  judgmentRef: { type: String, default: '' },
  judgmentDate: { type: Date, default: null },

  gravity: { type: String, enum: ['FAIBLE', 'MOYENNE', 'GRAVE', 'TRES_GRAVE'], default: 'MOYENNE' },

  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

infractionSchema.index({ foreignerId: 1, createdAt: -1 });
infractionSchema.index({ nature: 1 });

module.exports = mongoose.model('Infraction', infractionSchema);
