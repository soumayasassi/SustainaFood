const mongoose = require('mongoose');
const DonationRecommender = require('../aiService/mlModel');
const Donation = require('../models/Donation');
const User = require('../models/User');

mongoose.connect('mongodb://127.0.0.1:27017/sustainafood');

async function setupTestData() {
  await Donation.deleteMany({});

  const donor1 = new mongoose.Types.ObjectId();
  const donor2 = new mongoose.Types.ObjectId();

  const testDonations = [
    {
      donor: donor1,
      title: 'Donation de repas normaux',
      location: 'Paris',
      numberOfMeals: 5,
      meals: [{ meal: new mongoose.Types.ObjectId(), quantity: 5 }],
      expirationDate: new Date('2025-04-12'),
      linkedRequests: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
      category: 'prepared_meals',
      createdAt: new Date('2025-03-01'),
    },
    {
      donor: donor1,
      title: 'Donation de pâtes',
      location: 'Lyon',
      products: [{ product: new mongoose.Types.ObjectId(), quantity: 10 }],
      expirationDate: new Date('2025-04-15'),
      linkedRequests: [new mongoose.Types.ObjectId()],
      category: 'packaged_products',
      createdAt: new Date('2025-03-02'),
    },
    {
      donor: donor2,
      title: 'Gros don de repas',
      location: 'Marseille',
      numberOfMeals: 199,
      meals: [{ meal: new mongoose.Types.ObjectId(), quantity: 199 }],
      expirationDate: new Date('2025-04-03'),
      linkedRequests: [new mongoose.Types.ObjectId()],
      category: 'prepared_meals',
      createdAt: new Date('2025-03-03'),
    },
    {
      donor: donor2,
      title: 'Donation de riz suspecte',
      location: 'Toulouse',
      products: [{ product: new mongoose.Types.ObjectId(), quantity: 50 }],
      expirationDate: new Date('2025-04-20'),
      linkedRequests: Array(12).fill(new mongoose.Types.ObjectId()),
      category: 'packaged_products',
      createdAt: new Date('2025-03-04'),
    },
    // Nouveau don normal
    {
      donor: donor1,
      title: 'Donation de pain',
      location: 'Nice',
      products: [{ product: new mongoose.Types.ObjectId(), quantity: 15 }],
      expirationDate: new Date('2025-04-10'),
      linkedRequests: [new mongoose.Types.ObjectId()],
      category: 'packaged_products',
      createdAt: new Date('2025-03-05'),
    },
  ];

  for (const donationData of testDonations) {
    const donation = new Donation(donationData);
    await donation.save();
  }
  console.log('Test data inserted');

  const insertedDonations = await Donation.find();
  console.log('Inserted donations:', insertedDonations.length, insertedDonations);
}

async function testAnomalyDetection() {
  const recommender = new DonationRecommender();

  await setupTestData();

  const anomalies = await recommender.detectAnomalies();
  console.log('Test Result - Detected Anomalies:', anomalies);

  console.log('\nValidation:');
  anomalies.forEach((anomaly) => {
    if (anomaly.quantity > 100) {
      console.log(`- High quantity detected: ${anomaly.donationId} (Qty: ${anomaly.quantity})`);
    }
    if (anomaly.linkedRequests > 10) {
      console.log(`- High linkedRequests detected: ${anomaly.donationId} (Linked: ${anomaly.linkedRequests})`);
    }
    if (anomaly.daysToExpiry < 5) {
      console.log(`- Near expiry detected: ${anomaly.donationId} (Days: ${anomaly.daysToExpiry})`);
    }
  });

  if (anomalies.length === 0) {
    console.log('Aucune anomalie détectée - vérifier le seuil ou les données.');
  }

  await mongoose.connection.close();
}

testAnomalyDetection().catch((err) => console.error('Test failed:', err));