// models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Counter = require('./Counter');

const Sexe = Object.freeze({
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
});

const OngType = Object.freeze({
  ADVOCACY: 'advocacy',
  OPERATIONAL: 'operational',
  CHARITABLE: 'charitable',
  DEVELOPMENT: 'development',
  ENVIRONMENTAL: 'environmental',
  HUMAN_RIGHTS: 'human-rights',
  RELIEF: 'relief',
  RESEARCH: 'research',
  PHILANTHROPIC: 'philanthropic',
  SOCIAL_WELFARE: 'social_welfare',
  CULTURAL: 'cultural',
  FAITH_BASED: 'faith_based'
});

const VehiculeType = Object.freeze({
  CAR: 'car',
  MOTORBIKE: 'motorbike',
  BICYCLE: 'bicycle',
  VAN: 'van',
  TRUCK: 'truck',
  SCOOTER: 'scooter'
});

const Role = Object.freeze({
  ADMIN: 'admin',
  ONG: 'ong',
  RESTAURANT: 'restaurant',
  SUPERMARKET: 'supermarket',
  STUDENT: 'student',
  TRANSPORTER: 'transporter',
  PERSONALDONOR: 'personaldonor'
});

const userSchema = new Schema({
  licenseNumber: { type: String, match: [/^\d{8}$/, 'Invalid license number'] },
  description: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: Object.values(Role) },
  id: { type: Number },
  phone: { type: Number },
  address: { type: String },
  photo: { type: String },
  age: { type: Number },
  sexe: { type: String, enum: Object.values(Sexe), default: null },
  vehiculeType: { type: String, enum: Object.values(VehiculeType), default: null },
  image_carte_etudiant: { type: String },
  num_cin: { type: String },
  id_fiscale: { type: String },
  type: { type: String, enum: Object.values(OngType) },
  taxReference: { type: String },
  isBlocked: { type: Boolean, default: false },
  resetCode: { type: String },
  isActive: { type: Boolean, default: true },
  resetCodeExpires: { type: Date },
  twoFACode: { type: String },
  twoFACodeExpires: { type: Date },
  is2FAEnabled: { type: Boolean, default: false },
  // Ajouts pour les chauffeurs

  isAvailable: { type: Boolean, default: true }, // Disponibilité du chauffeur
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
});

// Index géospatial pour les recherches de localisation
userSchema.index({ currentLocation: '2dsphere' });

userSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: 'userId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.id = counter.seq;
    } catch (err) {
      return next(err);
    }
  }
  next();
});
userSchema.index({ location: '2dsphere' }); // Enable geospatial queries
const User = mongoose.model('User', userSchema);
module.exports = User;