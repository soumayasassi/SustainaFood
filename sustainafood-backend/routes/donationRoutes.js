const express = require('express');
const multer = require('multer');
const upload = multer(); // Pour parser les champs sans fichier
const router = express.Router();
const Donation = require('../models/Donation'); // Import the Donation model
const RequestNeed = require('../models/RequestNeed');
const DonationRecommender=require('../aiService/mlModel');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

require('dotenv').config();
// Route to get recommendations for a donation
router.get('/donations/anomalies', async (req, res) => {
    try {
      const recommender = new DonationRecommender();
      const anomalies = await recommender.detectAnomalies();
  
      const detailedAnomalies = await Promise.all(
        anomalies.map(async (anomaly) => {
          const donation = await Donation.findById(anomaly.donationId).populate('donor', 'name role photo');
          if (!donation || !donation.donor) {
            return {
              donationId: anomaly.donationId,
              title: 'Unknown Donation',
              donor: { id: anomaly.donor || 'Unknown', photo: '', name: 'Unknown Donor', role: 'N/A' },
              quantity: anomaly.quantity,
              daysToExpiry: anomaly.daysToExpiry,
              linkedRequests: anomaly.linkedRequests,
              anomalyScore: anomaly.anomalyScore,
              reason: anomaly.reason,
              isapprovedfromadmin: 'pending' // Statut par défaut si donation introuvable
            };
          }
          return {
            donationId: anomaly.donationId,
            title: donation.title,
            donor: {
              id: donation.donor._id,
              name: donation.donor.name || 'Missing Name',
              role: donation.donor.role || 'Missing Role',
              photo: donation.donor.photo || ''
            },
            quantity: anomaly.quantity,
            daysToExpiry: anomaly.daysToExpiry,
            linkedRequests: anomaly.linkedRequests,
            anomalyScore: anomaly.anomalyScore,
            reason: anomaly.reason,
            isapprovedfromadmin: donation.isapprovedfromadmin // Inclure le statut de la donation
          };
        })
      );
      res.json(detailedAnomalies);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
// Route to get recommendations for a donation
router.get('/donation/:donationId/recommendations', async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.donationId)
            .populate('products.product')
            .populate('meals.meal')
            .populate('donor');
        if (!donation) {
            return res.status(404).json({ message: "Donation not found" });
        }
        const matches = await matchDonationToRequests(donation);
        res.status(200).json(matches);
    } catch (error) {
        res.status(500).json({ message: "Failed to get recommendations", error: error.message });
    }
});
// The matchDonationToRequests function (as previously defined)



// Approbation d'une donation
router.post('/donations/:id/approve', async (req, res) => {
    try {
      const donation = await Donation.findById(req.params.id).populate('donor', 'name email');
      if (!donation) return res.status(404).json({ message: 'Donation not found' });
  
      // Mettre à jour le statut et isAnomaly
      donation.isapprovedfromadmin = 'approved';
      donation.isAnomaly = false; // Une fois approuvée, ce n'est plus une anomalie
      await donation.save();
  
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: { rejectUnauthorized: false },
      });
  
      if (donation.donor.email) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: donation.donor.email,
          subject: 'Your Donation Has Been Approved',
          text: `Dear ${donation.donor.name || 'Donor'},
  
  Your donation titled "${donation.title}" has been reviewed and approved by our admin team.
  It is no longer flagged as an anomaly and is now available for processing.
  
  Thank you for your contribution!
  Best regards,
  SustainaFood Team`,
          html: `
            <div style="font-family: Arial, sans-serif; color: black;">
              <h2 style="color: #228b22;">Donation Approved</h2>
              <p>Dear ${donation.donor.name || 'Donor'},</p>
              <p>Your donation titled "<strong>${donation.title}</strong>" has been reviewed and approved by our admin team.</p>
              <p>It is no longer flagged as an anomaly and is now available for processing.</p>
              <p>Thank you for your contribution!<br>Best regards,<br>SustainaFood Team</p>
            </div>
          `,
        };
  
        await transporter.sendMail(mailOptions);
        console.log(`Approval email sent to ${donation.donor.email}`);
      }
  
      res.status(200).json({ message: 'Donation approved successfully', donation });
    } catch (error) {
      console.error('Error approving donation:', error);
      res.status(500).json({ message: 'Failed to approve donation', error: error.message });
    }
  });
// Rejet d'une donation
router.post('/donations/:id/reject', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('donor', 'name email');
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    donation.isapprovedfromadmin = 'rejected';
    await donation.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });

    if (donation.donor.email) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: donation.donor.email,
        subject: 'Your Donation Has Been Rejected',
        text: `Dear ${donation.donor.name || 'Donor'},

Your donation titled "${donation.title}" has been reviewed and rejected by our admin team.
Please contact support if you have any questions.

Best regards,
SustainaFood Team`,
        html: `
          <div style="font-family: Arial, sans-serif; color: black;">
            <h2 style="color: #ff4444;">Donation Rejected</h2>
            <p>Dear ${donation.donor.name || 'Donor'},</p>
            <p>Your donation titled "<strong>${donation.title}</strong>" has been reviewed and rejected by our admin team.</p>
            <p>Please contact support if you have any questions.</p>
            <p>Best regards,<br>SustainaFood Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Rejection email sent to ${donation.donor.email}`);
    }

    res.status(200).json({ message: 'Donation rejected successfully', donation });
  } catch (error) {
    console.error('Error rejecting donation:', error);
    res.status(500).json({ message: 'Failed to reject donation', error: error.message });
  }
});

async function matchDonationToRequests(donation) {
  const { category, products, meals, expirationDate, numberOfMeals: donatedMeals } = donation;

  const requests = await RequestNeed.find({
      category: donation.category,
      status: 'pending',
      expirationDate: { $gte: new Date() }
  }).populate('recipient');

  const matches = [];
  for (const request of requests) {
      let matchScore = 0;
      let fulfilledItems = [];

      if (category === 'packaged_products') {
          const requestedProducts = request.requestedProducts || [];
          for (const reqProduct of requestedProducts) {
              // Handle both nested and flat structures
              const reqProductType = reqProduct.product?.productType || reqProduct.productType;
              const reqQuantity = reqProduct.quantity || reqProduct.totalQuantity || 0;

              const matchingProduct = products.find(p => p.productType === reqProductType);
              if (matchingProduct) {
                  const fulfilledQty = Math.min(matchingProduct.totalQuantity || matchingProduct.quantity || 0, reqQuantity);
                  fulfilledItems.push({ 
                      product: reqProduct.product?._id || reqProduct._id || reqProduct.productType, 
                      quantity: fulfilledQty 
                  });
                  matchScore += fulfilledQty * 10;
              }
          }
      } else if (category === 'prepared_meals') {
          const requestedMeals = request.numberOfMeals || 0;
          if (requestedMeals > 0 && donatedMeals > 0) {
              const fulfilledQty = Math.min(donatedMeals, requestedMeals);
              fulfilledItems.push({ quantity: fulfilledQty });
              matchScore += fulfilledQty * 10;
          }
      }

      if (fulfilledItems.length > 0) {
          const daysUntilExpiration = (new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24);
          if (daysUntilExpiration < 3) matchScore += 50;
          else if (daysUntilExpiration < 7) matchScore += 20;

          if (request.recipient?.type === 'RELIEF' && daysUntilExpiration < 7) {
              matchScore += 30;
          } else if (request.recipient?.type === 'SOCIAL_WELFARE') {
              matchScore += 10;
          }

          matches.push({
              request,
              fulfilledItems,
              matchScore
          });
      }
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

// Other routes (e.g., for getting donations by user ID)
router.get('/user/:userId', async (req, res) => {
    try {
        const donations = await Donation.find({ donor: req.params.userId })
            .populate('products.product')
            .populate('meals.meal')
            .populate('donor');
        res.status(200).json(donations);
    } catch (error) {
        res.status(500).json({ message: "Failed to get donations", error: error.message });
    }
});

const donationController = require('../controllers/donationController');
router.post('/donations/classify-food', donationController.classifyFood);
// Log to confirm this route is hit
router.get('/donations/predict-supply-demand', (req, res, next) => {
    console.log('Route /donations/predict-supply-demand matched');
    next();
  }, donationController.getSupplyDemandPrediction);
  
  // Log to confirm this route is hit
  router.get('/donations/:requestId', (req, res, next) => {
    console.log('Route /donations/:requestId matched with:', req.params.requestId);
    next();
  }, donationController.getDonationByRequestId);
// ✅ Get all donations
router.get('/', donationController.getAllDonations);


// ✅ Get donation by ID
router.get('/:id', donationController.getDonationById);

// ✅ Get donations by User ID
router.get('/user/:userId', donationController.getDonationsByUserId);
// ✅ Get donations by Donor ID not post
router.get('/donor/:donorId', donationController.getRequestDonationsByUserId);

// ✅ Get donations by Date
router.get('/date/:date', donationController.getDonationsByDate);

// ✅ Get donations by Type (donation/request)
router.get('/type/:type', donationController.getDonationsByType);

// ✅ Get donations by Category (Prepared_Meals, Packaged_Products)
router.get('/category/:category', donationController.getDonationsByCategory);

// ✅ Create a new donation (with associated products)
// Ajout de "upload.none()" pour parser les champs du FormData
router.post('/', upload.none(), donationController.createDonation);

// ✅ Update a donation (and update associated products)
router.put('/:id', donationController.updateDonation);

// ✅ Delete a donation (and delete associated products)
router.delete('/:id', donationController.deleteDonation);
router.get('/donations/:requestId',donationController.getDonationByRequestId)
// Donor Analytics
// Donor Analytics
// Donor Analytics

router.get("/api/analytics/donor/:donorId", async (req, res) => {
  const donorId = req.params.donorId;
  try {
    if (!donorId) {
      return res.status(400).json({ error: "Donor ID is required" });
    }

    const donorObjectId = new mongoose.Types.ObjectId(donorId);
    const donations = await Donation.find({ donor: donorObjectId });
    const totalDonations = donations.length;
    const totalItems = donations.reduce((sum, d) => {
      if (d.category === "prepared_meals") {
        return sum + (d.numberOfMeals || 0);
      }
      return sum + (d.products ? d.products.reduce((s, p) => s + (p.totalQuantity || 0), 0) : 0);
    }, 0);
    const categories = [...new Set(donations.map((d) => d.category))];
    const weeklyTrends = await Donation.aggregate([
      { $match: { donor: donorObjectId } },
      { $group: { _id: { $week: "$createdAt" }, count: { $sum: 1 } } },
      { $sort: { "_id": 1 } },
    ]);
    console.log("weeklyTrends from donor aggregation:", weeklyTrends); // Log ajouté

    res.json({ totalDonations, totalItems, categories, weeklyTrends });
  } catch (error) {
    console.error("Donor Analytics Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Recipient Analytics
router.get("/api/analytics/recipient/:recipientId", async (req, res) => {
  const recipientId = req.params.recipientId;
  try {
    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required" });
    }

    const recipientObjectId = new mongoose.Types.ObjectId(recipientId);
    const requests = await RequestNeed.find({ recipient: recipientObjectId });
    const totalRequests = requests.length;
    const fulfilledRequests = requests.filter((r) => r.status === "fulfilled").length;
    const totalFulfilledItems = requests.reduce((sum, r) => {
      if (r.category === "prepared_meals") {
        return sum + (r.numberOfMeals || 0);
      }
      return sum + ((r.requestedProducts || []).reduce((s, p) => s + (p.quantity || 0), 0));
    }, 0);
    const categories = [...new Set(requests.map((r) => r.category))];
    const weeklyTrends = await RequestNeed.aggregate([
      { $match: { recipient: recipientObjectId } },
      { $group: { _id: { $week: "$created_at" }, count: { $sum: 1 } } },
      { $sort: { "_id": 1 } },
    ]);
    console.log("weeklyTrends from recipient aggregation:", weeklyTrends); // Log ajouté

    res.json({ totalRequests, fulfilledRequests, totalFulfilledItems, categories, weeklyTrends });
  } catch (error) {
    console.error("Recipient Analytics Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/personal-stats/donor/:donorId", async (req, res) => {
  const donorId = req.params.donorId;
  try {
    if (!donorId) {
      return res.status(400).json({ error: "Donor ID is required" });
    }

    const donorObjectId = new mongoose.Types.ObjectId(donorId); // Conversion en ObjectId
    const donations = await Donation.find({ donor: donorObjectId });
    const acceptedDonations = donations.filter((d) => d.status === "fulfilled").length;
    const requestsForDonations = await RequestNeed.countDocuments({ donation: { $in: donations.map((d) => d._id) } });
    const weeklyAcceptedTrends = await Donation.aggregate([
      { $match: { donor: donorObjectId, status: "fulfilled" } },
      { $group: { _id: { $week: "$createdAt" }, count: { $sum: 1 } } }, // Corrigé : createdAt
      { $sort: { "_id": 1 } },
    ]);
    console.log("weeklyAcceptedTrends:", weeklyAcceptedTrends); // Log pour débogage

    res.json({ acceptedDonations, requestsForDonations, weeklyAcceptedTrends });
  } catch (error) {
    console.error("Donor Personal Stats Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/api/personal-stats/recipient/:recipientId", async (req, res) => {
  const recipientId = req.params.recipientId;
  try {
    if (!recipientId) {
      return res.status(400).json({ error: "Recipient ID is required" });
    }

    const recipientObjectId = new mongoose.Types.ObjectId(recipientId); // Conversion en ObjectId
    const requests = await RequestNeed.find({ recipient: recipientObjectId });
    const totalRequests = requests.length;
    const acceptedDonations = requests.filter((r) => r.status === "fulfilled").length;
    const weeklyRequestTrends = await RequestNeed.aggregate([
      { $match: { recipient: recipientObjectId } },
      { $group: { _id: { $week: "$created_at" }, count: { $sum: 1 } } }, // Correct : created_at
      { $sort: { "_id": 1 } },
    ]);
    console.log("weeklyRequestTrends:", weeklyRequestTrends); // Log pour débogage

    res.json({ totalRequests, acceptedDonations, weeklyRequestTrends });
  } catch (error) {
    console.error("Recipient Personal Stats Error:", error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;