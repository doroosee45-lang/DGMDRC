const mongoose = require('mongoose');

const borderPostSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ['AERIEN', 'TERRESTRE', 'MARITIME'], index: true },
  province: { type: String, required: true, index: true },
  coordinates: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  address: { type: String, default: '' },
  responsable: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isActive: { type: Boolean, default: true, index: true },
  offlineCapable: { type: Boolean, default: false },
  lastSyncAt: { type: Date, default: null },
}, {
  timestamps: true,
});

module.exports = mongoose.model('BorderPost', borderPostSchema);
