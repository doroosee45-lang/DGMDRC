const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: String,
  commune: String,
  city: String,
  province: String,
  dateFrom: Date,
  dateTo: Date,
  current: { type: Boolean, default: false },
}, { _id: false });

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relation: { type: String, required: true },
  country: String,
}, { _id: false });

const foreignerSchema = new mongoose.Schema({
  dossierNumber: { type: String, unique: true },
  lastName: { type: String, required: true, uppercase: true, trim: true },
  middleName: { type: String, trim: true, default: '' },
  firstName: { type: String, required: true, trim: true },
  gender: { type: String, required: true, enum: ['M', 'F', 'AUTRE'] },
  dateOfBirth: { type: Date, required: true },
  placeOfBirth: { type: String, required: true },
  nationality: { type: String, required: true, uppercase: true, maxlength: 3 },
  secondNationality: { type: String, uppercase: true, maxlength: 3, default: null },

  passport: {
    number: { type: String, required: true, uppercase: true },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    issueCountry: { type: String, required: true, uppercase: true },
  },

  visa: {
    number: { type: String, required: true, uppercase: true },
    type: {
      type: String, required: true,
      enum: ['TOURISME', 'AFFAIRES', 'RESIDENCE', 'DIPLOMATIQUE', 'TRANSIT', 'ETUDES', 'TRAVAIL', 'AUTRE']
    },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    maxDays: { type: Number, required: true, default: 90 },
    issuedBy: { type: String, default: '' },
  },

  photo: { type: String, default: null },
  biometricRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Biometric', default: null },

  addresses: [addressSchema],
  emergencyContacts: [emergencyContactSchema],

  employer: { type: String, default: '' },
  stayPurpose: { type: String, default: '' },
  stayPurposeDetails: { type: String, default: '' },

  currentStatus: {
    type: String,
    enum: ['EN_REGLE', 'EN_ALERTE', 'EN_INFRACTION', 'EXPULSE', 'BLACKLISTE', 'INCONNU'],
    default: 'INCONNU',
    index: true,
  },
  presenceStatus: {
    type: String,
    enum: ['PRESENT', 'SORTI', 'INCONNU'],
    default: 'INCONNU',
    index: true,
  },
  isBlacklisted: { type: Boolean, default: false, index: true },
  isActive: { type: Boolean, default: true },

  notes: [{
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    isConfidential: { type: Boolean, default: false },
  }],

  totalDaysInRDC: { type: Number, default: 0 },
  lastEntryDate: { type: Date, default: null },
  lastExitDate: { type: Date, default: null },
  entryCount: { type: Number, default: 0 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  version: { type: Number, default: 1 },
}, {
  timestamps: true,
});

foreignerSchema.index({ lastName: 'text', firstName: 'text', middleName: 'text' });
foreignerSchema.index({ dossierNumber: 1 }, { unique: true, sparse: true });
foreignerSchema.index({ 'passport.number': 1 }, { unique: true });
foreignerSchema.index({ 'visa.number': 1 });
foreignerSchema.index({ nationality: 1 });
foreignerSchema.index({ dateOfBirth: 1 });
foreignerSchema.index({ 'visa.expiryDate': 1 });
foreignerSchema.index({ 'passport.expiryDate': 1 });

foreignerSchema.pre('save', async function (next) {
  if (!this.dossierNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Foreigner').countDocuments();
    this.dossierNumber = `DGM-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Foreigner', foreignerSchema);
