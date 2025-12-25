const numeric = require('numeric');
const { IsolationForest } = require('ml-isolation-forest');
const DonationTransaction = require('../models/DonationTransaction');
const Donation = require('../models/Donation');
const RequestNeed = require('../models/RequestNeed');

class DonationRecommender {
  constructor() {
    this.interactionMatrix = null;
    this.donationIds = [];
    this.requestIds = [];
    this.U = null;
    this.S = null;
    this.Vt = null;
  }

  async buildInteractionMatrix() {
    const transactions = await DonationTransaction.find({ status: 'completed' })
      .populate('donation')
      .populate('requestNeed');

    console.log('Transactions found:', transactions.length);
    console.log('Sample transaction:', transactions[0] || 'No transactions');

    const donationSet = new Set();
    const requestSet = new Set();
    const interactions = {};

    transactions.forEach((tx) => {
      const donationId = tx.donation._id.toString();
      const requestId = tx.requestNeed._id.toString();
      donationSet.add(donationId);
      requestSet.add(requestId);
      const key = `${donationId}-${requestId}`;
      interactions[key] = (interactions[key] || 0) + 1;
    });

    this.donationIds = Array.from(donationSet);
    this.requestIds = Array.from(requestSet);

    console.log('Donation IDs:', this.donationIds);
    console.log('Request IDs:', this.requestIds);
    console.log('Interactions:', interactions);

    if (this.donationIds.length === 0 || this.requestIds.length === 0) {
      console.log('No data to build matrix. Setting to empty 1x1 matrix.');
      this.interactionMatrix = [[0]];
    } else {
      this.interactionMatrix = numeric.dim([this.donationIds.length, this.requestIds.length], 0);
      Object.entries(interactions).forEach(([key, count]) => {
        const [donationId, requestId] = key.split('-');
        const donationIdx = this.donationIds.indexOf(donationId);
        const requestIdx = this.requestIds.indexOf(requestId);
        if (donationIdx >= 0 && requestIdx >= 0) {
          this.interactionMatrix[donationIdx][requestIdx] = count;
        }
      });
    }

    console.log('Matrix dimensions:', [this.donationIds.length, this.requestIds.length]);
    console.log('Built Interaction Matrix:', this.interactionMatrix);
  }

  train(k = 10) {
    if (!this.interactionMatrix) throw new Error('Interaction matrix not built');

    console.log('Interaction Matrix in train:', this.interactionMatrix);
    console.log('Donation IDs length:', this.donationIds.length);
    console.log('Request IDs length:', this.requestIds.length);

    if (this.donationIds.length === 0 || this.requestIds.length === 0) {
      console.log('No interactions available. Initializing default model.');
      this.U = numeric.dim([1, k], 0);
      this.S = numeric.dim([k], 0);
      this.Vt = numeric.dim([k, 1], 0);
      return;
    }

    const svd = numeric.svd(this.interactionMatrix);
    this.U = svd.U;
    this.S = svd.S;
    this.Vt = svd.V;

    this.U = numeric.getBlock(this.U, [0, 0], [this.donationIds.length - 1, k - 1]);
    this.S = this.S.slice(0, k);
    this.Vt = numeric.getBlock(this.Vt, [0, 0], [k - 1, this.requestIds.length - 1]);

    console.log('Model trained successfully');
  }

  async getRecommendations(donationId, topN = 5) {
    if (!this.U || !this.S || !this.Vt) throw new Error('Model not trained');

    const donation = await Donation.findById(donationId);
    if (!donation) throw new Error('Donation not found');

    let donationIdx = this.donationIds.indexOf(donationId.toString());
    let donationVector;

    if (donationIdx === -1) {
      donationVector = await this.createDonationVector(donation);
    } else {
      donationVector = this.U[donationIdx].slice(0, this.S.length);
    }

    const scores = numeric.dot(numeric.dot(donationVector, numeric.diag(this.S)), this.Vt);

    const requestScores = scores.map((score, idx) => ({
      requestId: this.requestIds[idx],
      score,
    })).sort((a, b) => b.score - a.score).slice(0, topN);

    const recommendations = await Promise.all(
      requestScores.map(async ({ requestId, score }) => {
        const request = await RequestNeed.findById(requestId).populate('recipient');
        const fulfilledItems = this.calculateFulfilledItems(donation, request);
        return { request, fulfilledItems, matchScore: score };
      })
    );

    return recommendations;
  }

  async createDonationVector(donation) {
    const requests = await RequestNeed.find({ category: donation.category, status: 'pending' });
    const similarityScores = await Promise.all(
      requests.map(async (req) => {
        const fulfilledItems = this.calculateFulfilledItems(donation, req);
        return fulfilledItems.length > 0
          ? fulfilledItems.reduce((sum, item) => sum + item.quantity, 0) * 10
          : 0;
      })
    );

    const avgVector = numeric.div(numeric.add(...this.U), this.U.length);
    return numeric.add(avgVector.slice(0, this.S.length), similarityScores.map((s) => s / 100));
  }

  calculateFulfilledItems(donation, request) {
    const fulfilledItems = [];
    if (donation.category === 'packaged_products') {
      for (const reqProduct of request.requestedProducts || []) {
        const matchingProduct = donation.products.find(
          (p) => p.product.toString() === reqProduct.product.toString()
        );
        if (matchingProduct) {
          const fulfilledQty = Math.min(matchingProduct.quantity, reqProduct.quantity);
          fulfilledItems.push({ product: reqProduct.product, quantity: fulfilledQty });
        }
      }
    } else if (donation.category === 'prepared_meals') {
      const requestedMeals = request.numberOfMeals || 0;
      const donatedMeals = donation.numberOfMeals || 0;
      if (requestedMeals > 0 && donatedMeals > 0) {
        const fulfilledQty = Math.min(donatedMeals, requestedMeals);
        fulfilledItems.push({ quantity: fulfilledQty });
      }
    }
    return fulfilledItems;
  }


  async detectAnomalies() {
    const donations = await Donation.find();
    const currentDate = new Date(); // Use current date instead of hardcoded '2025-04-02'
  
    console.log('Found donations in detectAnomalies:', donations.length, donations);
  
    // Gestion des cas avec moins de 2 donations
    if (donations.length < 2) {
      console.log('Not enough donations to use Isolation Forest (< 2), checking for extreme values...');
      if (donations.length === 0) return [];
  
      const d = donations[0];
      const quantity = d.category === 'prepared_meals'
        ? d.numberOfMeals || 0
        : d.products ? d.products.reduce((sum, p) => sum + p.quantity, 0) : 0;
      const daysToExpiry = d.expirationDate
        ? Math.max(0, Math.ceil((new Date(d.expirationDate) - currentDate) / (1000 * 60 * 60 * 24)))
        : 1000;
  
      // Check for large quantity (100–20,000) and near expiry (≤4 days), exclude quantity = 1
      if (quantity >= 100 && quantity <= 20000 && daysToExpiry <= 4 && quantity !== 1) {
        return [{
          donationId: d._id,
          donor: d.donor,
          title: d.title,
          quantity,
          daysToExpiry,
          linkedRequests: d.linkedRequests ? d.linkedRequests.length : 0,
          anomalyScore: 0.9, // High score for rule-based detection
          reason: `Large quantity (${quantity}) near expiry (${daysToExpiry} days)`
        }];
      }
      return [];
    }
  
    // Extraction des caractéristiques
    const features = donations.map((d) => {
      const quantity = d.category === 'prepared_meals'
        ? d.numberOfMeals || 0
        : d.products ? d.products.reduce((sum, p) => sum + p.quantity, 0) : 0;
      const frequency = donations.filter(
        (don) => don.donor.toString() === d.donor.toString()
      ).length;
      const daysToExpiry = d.expirationDate
        ? Math.max(0, Math.ceil((new Date(d.expirationDate) - currentDate) / (1000 * 60 * 60 * 24)))
        : 1000;
      const numLinkedRequests = d.linkedRequests ? d.linkedRequests.length : 0;
  
      return [quantity, frequency, daysToExpiry, numLinkedRequests];
    });
  
    console.log('Features for anomaly detection:', features);
  
    // Normalisation
    const normalize = (arr) => {
      const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
      const std = Math.sqrt(
        arr.map((val) => (val - mean) ** 2).reduce((sum, val) => sum + val, 0) / arr.length
      );
      return std ? arr.map((val) => (val - mean) / std) : arr.map(() => 0);
    };
  
    const transposedFeatures = features[0].map((_, colIdx) => features.map((row) => row[colIdx]));
    const normalizedFeatures = transposedFeatures
      .map(normalize)
      .reduce((acc, col, colIdx) => {
        features.forEach((row, rowIdx) => {
          if (!acc[rowIdx]) acc[rowIdx] = [];
          acc[rowIdx][colIdx] = col[rowIdx];
        });
        return acc;
      }, []);
  
    console.log('Normalized features:', normalizedFeatures);
  
    // Isolation Forest
    const forest = new IsolationForest({
      nTrees: 100,
      maxSamples: Math.min(256, donations.length),
      contamination: 0.1,
    });
  
    console.log('Training Isolation Forest...');
    forest.train(normalizedFeatures);
  
    console.log('Predicting anomalies...');
    const anomalyScores = forest.predict(normalizedFeatures);
    console.log('Anomaly scores:', anomalyScores.map((score, idx) => ({
      donationId: donations[idx]._id,
      score
    })));
  
    const threshold = 0.4; // Adjusted threshold
  
    // Filter anomalies based on Isolation Forest and specific rules
    const anomalies = donations
      .filter((d, idx) => {
        const quantity = d.category === 'prepared_meals'
          ? d.numberOfMeals || 0
          : d.products ? d.products.reduce((sum, p) => sum + p.quantity, 0) : 0;
        const daysToExpiry = d.expirationDate
          ? Math.max(0, Math.ceil((new Date(d.expirationDate) - currentDate) / (1000 * 60 * 60 * 24)))
          : 1000;
  
        // Conditions: large quantity (100–20,000), near expiry (≤4 days), not small (quantity ≠ 1)
        const isLargeQuantity = quantity >= 100 && quantity <= 20000;
        const isNearExpiry = daysToExpiry <= 4;
        const isSmallDonation = quantity === 1;
  
        // Anomaly if: low score (Isolation Forest) AND meets specific rules
        return anomalyScores[idx] < threshold && isLargeQuantity && isNearExpiry && !isSmallDonation;
      })
      .map((d) => ({
        donationId: d._id,
        title: d.title,
        donor: d.donor,
        quantity: d.category === 'prepared_meals'
          ? d.numberOfMeals || 0
          : d.products ? d.products.reduce((sum, p) => sum + p.quantity, 0) : 0,
        daysToExpiry: d.expirationDate
          ? Math.ceil((new Date(d.expirationDate) - currentDate) / (1000 * 60 * 60 * 24))
          : 'N/A',
        linkedRequests: d.linkedRequests ? d.linkedRequests.length : 0,
        anomalyScore: anomalyScores[donations.indexOf(d)],
        reason: `Large quantity (${d.category === 'prepared_meals' ? d.numberOfMeals || 0 : d.products.reduce((sum, p) => sum + p.quantity, 0)}) near expiry (${d.expirationDate ? Math.ceil((new Date(d.expirationDate) - currentDate) / (1000 * 60 * 60 * 24)) : 'N/A'} days)`
      }));
  
    console.log('Detected anomalies:', anomalies);
    return anomalies;
  }
}

module.exports = DonationRecommender;