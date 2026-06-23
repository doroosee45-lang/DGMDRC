const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = [
  'ADMIN_NATIONAL', 'ADMIN_PROVINCIAL', 'AGENT_DGM',
  'AGENT_FRONTALIER_AERIEN', 'AGENT_FRONTALIER_TERRESTRE', 'AGENT_FRONTALIER_MARITIME',
  'POLICE_NATIONALE', 'JUSTICE', 'ANR_RENSEIGNEMENT',
  'MINISTERE_INTERIEUR', 'AMBASSADE_CONSULAT', 'GOUVERNEMENT_PROVINCIAL', 'AUDITEUR'
];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, required: true, enum: ROLES },
  institution: { type: String, required: true },
  province: { type: String, default: null },
  borderPost: { type: mongoose.Schema.Types.ObjectId, ref: 'BorderPost', default: null },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  twoFactorSecret: { type: String, default: null },
  twoFactorEnabled: { type: Boolean, default: false },
  mustChangePwd: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > Date.now();
};

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', userSchema);
