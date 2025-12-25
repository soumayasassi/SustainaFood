// models/Delivery.js
const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  donationTransaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DonationTransaction',
    required: true,
  },
  transporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    
  },
  pickupAddress: { type: String, required: true }, // Adresse lisible du donateur
  deliveryAddress: { type: String, required: true }, // Adresse lisible du bénéficiaire
  pickupCoordinates: {
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
  deliveryCoordinates: {
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
  status: { type: String, enum: ['accepted','pending', 'picked_up', 'in_progress', 'delivered', 'failed', null], default: null },
 
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ajouter un hook pour mettre à jour updatedAt lors des modifications
deliverySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Delivery', deliverySchema);