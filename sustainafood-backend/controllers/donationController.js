const numeric = require('numeric');
const { IsolationForest } = require('ml-isolation-forest');
const DonationTransaction = require('../models/DonationTransaction');
const Donation = require('../models/Donation');
const RequestNeed = require('../models/RequestNeed');
const mongoose = require('mongoose');
const Meal = require('../models/Meals');
const Product = require('../models/Product');
const Counter = require('../models/Counter');
const { classifyFoodItem } = require('../aiService/classifyFoodItem');
const { predictSupplyDemand } = require('../aiService/predictSupplyDemand');
const User = require('../models/User');
const Notification = require('../models/Notification');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const badWords = [
  "damn",
  "hell",
  "idiot",
  "stupid",
  "fuck",
  "t**t"
];

const containsBadWords = (text) => {
  if (!text || typeof text !== 'string') return false;
  const lowerText = text.toLowerCase();
  return badWords.some(word => lowerText.includes(word));
};

const checkBadWords = (text) => {
  if (!text || typeof text !== 'string') return null;
  const lowerText = text.toLowerCase();
  const badWord = badWords.find(word => lowerText.includes(word));
  return badWord ? { containsBadWords: true, badWord } : null;
};

async function sendEmail(to, subject, text) {
  try {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false,
      },
    });

    let mailOptions = {
      from: `"SustainaFood Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    await transporter.verify();
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending email:', {
      message: error.message,
      stack: error.stack,
      to,
      subject,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

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
    const currentDate = new Date();

    console.log('Found donations in detectAnomalies:', donations.length);
    console.log('Sample donations:', donations.slice(0, 2).map(d => ({
      id: d._id,
      title: d.title,
      quantity: d.category === 'prepared_meals' ? d.numberOfMeals : d.products.reduce((sum, p) => sum + p.quantity, 0),
      expirationDate: d.expirationDate,
      isAnomaly: d.isAnomaly,
    })));

    if (donations.length === 0) {
      console.log('No donations found in database.');
      return [];
    }

    if (donations.length === 1) {
      console.log('Only one donation found, checking for extreme values...');
      const d = donations[0];
      const quantity = d.category === 'prepared_meals'
        ? d.numberOfMeals || 0
        : d.products ? d.products.reduce((sum, p) => sum + p.quantity, 0) : 0;
      const daysToExpiry = d.expirationDate
        ? Math.max(0, Math.ceil((new Date(d.expirationDate) - currentDate) / (1000 * 60 * 60 * 24)))
        : 1000;

      console.log('Single donation check:', { id: d._id, quantity, daysToExpiry });

      if (quantity >= 100 && daysToExpiry <= 4 && quantity !== 1) {
        return [{
          donationId: d._id,
          donor: d.donor,
          title: d.title,
          quantity,
          daysToExpiry,
          linkedRequests: d.linkedRequests ? d.linkedRequests.length : 0,
          anomalyScore: 0.9,
          reason: `Large quantity (${quantity}) near expiry (${daysToExpiry} days)`
        }];
      }
      console.log('Single donation does not meet anomaly criteria.');
      return [];
    }

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

      return [Math.log1p(quantity), frequency, daysToExpiry, numLinkedRequests]; // Apply log scaling to quantity
    });

    console.log('Features for anomaly detection:', features);

    // Validate features
    const validFeatures = features.filter(f => f.every(val => !isNaN(val) && val !== null));
    if (validFeatures.length === 0) {
      console.log('No valid features for anomaly detection.');
      return [];
    }

    const normalize = (arr) => {
      const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
      const std = Math.sqrt(
        arr.map((val) => (val - mean) ** 2).reduce((sum, val) => sum + val, 0) / arr.length
      ) || 1; // Avoid division by zero
      return arr.map((val) => (val - mean) / std);
    };

    const transposedFeatures = validFeatures[0].map((_, colIdx) => validFeatures.map((row) => row[colIdx]));
    const normalizedFeatures = transposedFeatures
      .map(normalize)
      .reduce((acc, col, colIdx) => {
        validFeatures.forEach((row, rowIdx) => {
          if (!acc[rowIdx]) acc[rowIdx] = [];
          acc[rowIdx][colIdx] = col[rowIdx];
        });
        return acc;
      }, []);

    console.log('Normalized features:', normalizedFeatures);

    const forest = new IsolationForest({
      nTrees: 100,
      maxSamples: Math.min(256, validFeatures.length),
      contamination: 0.1,
    });

    console.log('Training Isolation Forest with', validFeatures.length, 'samples...');
    forest.train(normalizedFeatures);

    console.log('Predicting anomalies...');
    const anomalyScores = forest.predict(normalizedFeatures);
    console.log('Anomaly scores:', anomalyScores.map((score, idx) => ({
      donationId: donations[idx]._id,
      score,
      quantity: validFeatures[idx][0],
      daysToExpiry: validFeatures[idx][2]
    })));

    const threshold = 0.6; // Increased threshold for more sensitivity

    const anomalies = donations
      .filter((d, idx) => {
        if (idx >= validFeatures.length) return false; // Skip invalid features
        const rawQuantity = d.category === 'prepared_meals'
          ? d.numberOfMeals || 0
          : d.products ? d.products.reduce((sum, p) => sum + p.quantity, 0) : 0;
        const daysToExpiry = d.expirationDate
          ? Math.max(0, Math.ceil((new Date(d.expirationDate) - currentDate) / (1000 * 60 * 60 * 24)))
          : 1000;

        const isLargeQuantity = rawQuantity >= 100;
        const isNearExpiry = daysToExpiry <= 4;
        const isSmallDonation = rawQuantity === 1;
        const isExtremeCase = rawQuantity >= 10000 && daysToExpiry <= 7; // Flag extreme quantities

        const isAnomaly = (anomalyScores[idx] < threshold || isExtremeCase) && isLargeQuantity && isNearExpiry && !isSmallDonation;
        console.log('Anomaly check for donation:', {
          donationId: d._id,
          rawQuantity,
          daysToExpiry,
          anomalyScore: anomalyScores[idx],
          isLargeQuantity,
          isNearExpiry,
          isSmallDonation,
          isExtremeCase,
          isAnomaly
        });

        return isAnomaly;
      })
      .map((d, idx) => ({
        donationId: d._id,
        title: d.title,
        donor: d.donor,
        quantity: d.category === 'prepared_meals'
          ? d.numberOfMeals || 0
          : d.products ? d.products.reduce((sum, p) => sum + p.quantity, 0) : 0,
        daysToExpiry: d.expirationDate
          ? Math.max(0, Math.ceil((new Date(d.expirationDate) - currentDate) / (1000 * 60 * 60 * 24)))
          : 1000,
        linkedRequests: d.linkedRequests ? d.linkedRequests.length : 0,
        anomalyScore: anomalyScores[idx],
        reason: `Large quantity (${d.category === 'prepared_meals' ? d.numberOfMeals || 0 : d.products.reduce((sum, p) => sum + p.quantity, 0)}) near expiry (${d.expirationDate ? Math.max(0, Math.ceil((new Date(d.expirationDate) - currentDate) / (1000 * 60 * 60 * 24))) : 1000} days)`
      }));

    console.log('Detected anomalies:', anomalies);
    if (anomalies.length === 0) {
      console.log('No anomalies detected. Possible reasons: strict criteria, insufficient data, or invalid donation fields.');
    }
    return anomalies;
  }
}

async function createDonation(req, res) {
  let newDonation;
  const recommender = new DonationRecommender();

  try {
    let {
      title,
      location,
      address,
      expirationDate,
      description,
      category,
      type,
      donor,
      products,
      numberOfMeals,
      status,
      meals
    } = req.body;

    console.log("Incoming Request Body:", req.body);

    let parsedLocation;
    try {
      parsedLocation = JSON.parse(location);
      if (
        parsedLocation.type !== 'Point' ||
        !Array.isArray(parsedLocation.coordinates) ||
        parsedLocation.coordinates.length !== 2 ||
        typeof parsedLocation.coordinates[0] !== 'number' ||
        typeof parsedLocation.coordinates[1] !== 'number'
      ) {
        throw new Error('Invalid location format: must be a GeoJSON Point with [longitude, latitude]');
      }
    } catch (error) {
      throw new Error('Invalid location format: must be a valid GeoJSON string');
    }

    if (!address || typeof address !== 'string' || !address.trim()) {
      throw new Error('Missing or invalid required field: address');
    }

    const badWordChecks = [];
    const titleCheck = checkBadWords(title);
    if (titleCheck) badWordChecks.push({ field: 'title', ...titleCheck });
    const descriptionCheck = checkBadWords(description);
    if (descriptionCheck) badWordChecks.push({ field: 'description', ...descriptionCheck });
    const addressCheck = checkBadWords(address);
    if (addressCheck) badWordChecks.push({ field: 'address', ...addressCheck });

    for (const product of products || []) {
      const nameCheck = checkBadWords(product.name);
      if (nameCheck) badWordChecks.push({ field: `product name "${product.name}"`, ...nameCheck });
      const descCheck = checkBadWords(product.productDescription);
      if (descCheck) badWordChecks.push({ field: `product description for "${product.name}"`, ...descCheck });
    }
    for (const meal of meals || []) {
      const nameCheck = checkBadWords(meal.mealName);
      if (nameCheck) badWordChecks.push({ field: `meal name "${meal.mealName}"`, ...nameCheck });
      const descCheck = checkBadWords(meal.mealDescription);
      if (descCheck) badWordChecks.push({ field: `meal description for "${meal.mealName}"`, ...descCheck });
    }

    if (badWordChecks.length > 0) {
      return res.status(400).json({
        message: 'Inappropriate language detected in submission',
        badWordsDetected: badWordChecks
      });
    }

    if (!Array.isArray(products)) {
      if (typeof products === 'string') {
        try {
          products = JSON.parse(products);
        } catch (error) {
          throw new Error('Invalid products format: must be a valid JSON array');
        }
      } else {
        products = [];
      }
    }

    if (!Array.isArray(meals)) {
      if (typeof meals === 'string') {
        try {
          meals = JSON.parse(meals);
        } catch (error) {
          throw new Error('Invalid meals format: must be a valid JSON array');
        }
      } else {
        meals = [];
      }
    }

    const validMealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Other'];

    const validMeals = meals
      .map((meal, index) => {
        if (!meal.mealName || typeof meal.mealName !== 'string' || !meal.mealName.trim()) {
          throw new Error(`Meal at index ${index} is missing a valid mealName`);
        }
        if (!meal.mealDescription || typeof meal.mealDescription !== 'string' || !meal.mealDescription.trim()) {
          throw new Error(`Meal at index ${index} is missing a valid mealDescription`);
        }
        if (!meal.mealType || !validMealTypes.includes(meal.mealType)) {
          throw new Error(`Meal at index ${index} has an invalid mealType: ${meal.mealType}`);
        }
        const quantity = parseInt(meal.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Meal at index ${index} has an invalid quantity: ${meal.quantity}`);
        }
        return {
          mealName: meal.mealName,
          mealDescription: meal.mealDescription,
          mealType: meal.mealType,
          quantity: quantity
        };
      })
      .filter(meal => meal);

    const validProducts = products
      .map((product, index) => {
        if (!product.name || typeof product.name !== 'string' || !product.name.trim()) {
          throw new Error(`Product at index ${index} is missing a valid name`);
        }
        if (!product.productType || typeof product.productType !== 'string') {
          throw new Error(`Product at index ${index} is missing a valid productType`);
        }
        if (!product.productDescription || typeof product.productDescription !== 'string' || !product.productDescription.trim()) {
          throw new Error(`Product at index ${index} is missing a valid productDescription`);
        }
        const weightPerUnit = parseFloat(product.weightPerUnit);
        if (isNaN(weightPerUnit) || weightPerUnit <= 0) {
          throw new Error(`Product at index ${index} has an invalid weightPerUnit: ${product.weightPerUnit}`);
        }
        const totalQuantity = parseInt(product.totalQuantity);
        if (isNaN(totalQuantity) || totalQuantity <= 0) {
          throw new Error(`Product at index ${index} is an invalid totalQuantity: ${product.totalQuantity}`);
        }
        if (!product.status || typeof product.status !== 'string') {
          throw new Error(`Product at index ${index} is missing a valid status`);
        }
        return {
          name: product.name,
          productType: product.productType,
          productDescription: product.productDescription,
          weightPerUnit: weightPerUnit,
          weightUnit: product.weightUnit || 'kg',
          weightUnitTotale: product.weightUnitTotale || 'kg',
          totalQuantity: totalQuantity,
          image: product.image || '',
          status: product.status || 'available'
        };
      })
      .filter(product => product);

    if (!title || typeof title !== 'string' || !title.trim()) {
      throw new Error('Missing or invalid required field: title');
    }
    if (!parsedLocation) {
      throw new Error('Missing or invalid required field: location');
    }
    if (!expirationDate || isNaN(new Date(expirationDate).getTime())) {
      throw new Error('Missing or invalid required field: expirationDate');
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      throw new Error('Missing or invalid required field: description');
    }
    if (!donor || !mongoose.Types.ObjectId.isValid(donor)) {
      throw new Error('Missing or invalid required field: donor');
    }

    if (category === 'prepared_meals' && validMeals.length === 0) {
      throw new Error('At least one valid meal is required for prepared_meals category');
    }
    if (category === 'packaged_products' && validProducts.length === 0) {
      throw new Error('At least one valid product is required for packaged_products category');
    }

    const calculatedNumberOfMeals = category === 'prepared_meals'
      ? validMeals.reduce((sum, meal) => sum + meal.quantity, 0)
      : undefined;

    const providedNumberOfMeals = parseInt(numberOfMeals);
    if (category === 'prepared_meals' && !isNaN(providedNumberOfMeals) && providedNumberOfMeals !== calculatedNumberOfMeals) {
      throw new Error(`Provided numberOfMeals (${providedNumberOfMeals}) does not match the calculated total (${calculatedNumberOfMeals})`);
    }

    newDonation = new Donation({
      title,
      location: parsedLocation,
      address,
      expirationDate: new Date(expirationDate),
      description,
      category: category || 'prepared_meals',
      type: type || 'donation',
      donor,
      meals: [],
      numberOfMeals: category === 'prepared_meals' ? (providedNumberOfMeals || calculatedNumberOfMeals) : undefined,
      remainingMeals: category === 'prepared_meals' ? (providedNumberOfMeals || calculatedNumberOfMeals) : undefined,
      products: [],
      status: status || 'pending',
      isAnomaly: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    let mealEntries = [];
    if (category === 'prepared_meals' && validMeals.length > 0) {
      for (let meal of validMeals) {
        const counter = await Counter.findOneAndUpdate(
          { _id: 'mealId' },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        if (!counter) throw new Error('Failed to generate meal ID');
        const newMeal = new Meal({
          id: counter.seq,
          mealName: meal.mealName,
          mealDescription: meal.mealDescription,
          mealType: meal.mealType,
          quantity: meal.quantity,
          donation: newDonation._id
        });
        await newMeal.save();
        mealEntries.push({ meal: newMeal._id, quantity: meal.quantity });
      }
    }

    let productEntries = [];
    if (category === 'packaged_products' && validProducts.length > 0) {
      for (let product of validProducts) {
        const counter = await Counter.findOneAndUpdate(
          { _id: 'ProductId' },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );
        if (!counter) throw new Error('Failed to generate product ID');
        const newProduct = new Product({
          id: counter.seq,
          name: product.name,
          productType: product.productType,
          productDescription: product.productDescription,
          weightPerUnit: product.weightPerUnit,
          weightUnit: product.weightUnit,
          weightUnitTotale: product.weightUnitTotale,
          totalQuantity: product.totalQuantity,
          image: product.image,
          status: product.status,
          donation: newDonation._id
        });
        await newProduct.save();
        productEntries.push({ product: newProduct._id, quantity: product.totalQuantity });
      }
    }

    newDonation.meals = mealEntries;
    newDonation.products = productEntries;

    await newDonation.save();

    const anomalies = await recommender.detectAnomalies();
    const isAnomaly = anomalies.some(anomaly => anomaly.donationId.toString() === newDonation._id.toString());

    if (isAnomaly) {
      newDonation.isAnomaly = true;
      await newDonation.save();

      const donorUser = await newDonation.populate('donor', 'email name');
      const donorEmail = donorUser.donor.email;
      const donorName = donorUser.donor.name || 'Donor';
      const anomalyDetails = anomalies.find(anomaly => anomaly.donationId.toString() === newDonation._id.toString());

      const emailSubject = 'Anomaly Detected in Your Donation';
      const emailText = `
        Dear ${donorName},

        Your donation titled "${newDonation.title}" has been flagged as an anomaly.
        Reason: ${anomalyDetails.reason}.
        Please review your donation details or contact support for assistance.

        Thank you,
        The Donation Platform Team
      `;

      await sendEmail(donorEmail, emailSubject, emailText);
    }

    const populatedDonation = await Donation.findById(newDonation._id)
      .populate('donor', 'name role email')
      .populate('products.product')
      .populate('meals.meal');

    res.status(201).json({
      message: 'Donation created successfully',
      donation: populatedDonation,
      isAnomaly: newDonation.isAnomaly
    });
  } catch (error) {
    if (newDonation && newDonation._id) {
      if (newDonation.meals && newDonation.meals.length > 0) {
        const mealIds = newDonation.meals.map(entry => entry.meal);
        await Meal.deleteMany({ _id: { $in: mealIds } });
      }
      if (newDonation.products && newDonation.products.length > 0) {
        const productIds = newDonation.products.map(entry => entry.product);
        await Product.deleteMany({ _id: { $in: productIds } });
      }
      await Donation.deleteOne({ _id: newDonation._id });
    }
    console.error("Error creating donation:", error);
    res.status(400).json({
      message: "Failed to create donation",
      error: error.message || error.toString()
    });
  }
}

// Other functions remain unchanged
async function updateDonation(req, res) {
  try {
    const { id } = req.params;
    const { products, meals, location, ...donationData } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid donation ID' });
    }

    const existingDonation = await Donation.findById(id).populate('meals.meal');
    if (!existingDonation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    let parsedLocation;
    if (location) {
      try {
        parsedLocation = JSON.parse(location);
        if (
          parsedLocation.type !== 'Point' ||
          !Array.isArray(parsedLocation.coordinates) ||
          parsedLocation.coordinates.length !== 2 ||
          typeof parsedLocation.coordinates[0] !== 'number' ||
          typeof parsedLocation.coordinates[1] !== 'number'
        ) {
          throw new Error('Invalid location format: must be a GeoJSON Point with [longitude, latitude]');
        }
      } catch (error) {
        throw new Error('Invalid location format: must be a valid GeoJSON string');
      }
    }

    const badWordChecks = [];
    if (donationData.title) {
      const titleCheck = checkBadWords(donationData.title);
      if (titleCheck) badWordChecks.push({ field: 'title', ...titleCheck });
    }
    if (donationData.description) {
      const descriptionCheck = checkBadWords(donationData.description);
      if (descriptionCheck) badWordChecks.push({ field: 'description', ...descriptionCheck });
    }
    if (donationData.address) {
      const addressCheck = checkBadWords(donationData.address);
      if (addressCheck) badWordChecks.push({ field: 'address', ...addressCheck });
    }
    for (const product of products || []) {
      if (product.name) {
        const nameCheck = checkBadWords(product.name);
        if (nameCheck) badWordChecks.push({ field: `product name "${product.name}"`, ...nameCheck });
      }
      if (product.productDescription) {
        const descCheck = checkBadWords(product.productDescription);
        if (descCheck) badWordChecks.push({ field: `product description for "${product.name}"`, ...descCheck });
      }
    }
    for (const meal of meals || []) {
      if (meal.mealName) {
        const nameCheck = checkBadWords(meal.mealName);
        if (nameCheck) badWordChecks.push({ field: `meal name "${meal.mealName}"`, ...nameCheck });
      }
      if (meal.mealDescription) {
        const descCheck = checkBadWords(meal.mealDescription);
        if (descCheck) badWordChecks.push({ field: `meal description for "${meal.mealName}"`, ...descCheck });
      }
    }

    if (badWordChecks.length > 0) {
      return res.status(400).json({
        message: 'Inappropriate language detected in submission',
        badWordsDetected: badWordChecks
      });
    }

    let updatedProducts = existingDonation.products || [];
    if (products !== undefined) {
      if (!Array.isArray(products)) {
        return res.status(400).json({ message: 'Products must be an array' });
      }
      updatedProducts = [];
      for (const item of products) {
        if (item.quantity !== undefined && (typeof item.quantity !== 'number' || item.quantity < 0)) {
          return res.status(400).json({ message: 'Invalid quantity in products array' });
        }

        let productId;
        if (item.id) {
          const product = await Product.findOne({ id: item.id });
          if (!product) {
            return res.status(404).json({ message: `Product with id ${item.id} not found` });
          }
          product.name = item.name ?? product.name;
          product.productDescription = item.productDescription ?? product.productDescription;
          product.productType = item.productType ?? product.productType;
          product.weightPerUnit = item.weightPerUnit ?? product.weightPerUnit;
          product.weightUnit = item.weightUnit ?? product.weightUnit;
          product.totalQuantity = item.totalQuantity ?? product.totalQuantity;
          product.status = item.status ?? product.status;
          await product.save();
          productId = product._id;
        } else {
          const counter = await Counter.findOneAndUpdate(
            { _id: 'ProductId' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
          );
          const newProduct = new Product({
            id: counter.seq,
            name: item.name,
            productDescription: item.productDescription,
            productType: item.productType,
            weightPerUnit: item.weightPerUnit,
            weightUnit: item.weightUnit,
            totalQuantity: item.totalQuantity,
            status: item.status || 'available',
            donation: id
          });
          await newProduct.save();
          productId = newProduct._id;
        }
        updatedProducts.push({ product: productId, quantity: item.quantity || 1 });
      }
    }

    let updatedMeals = [];
    if (meals !== undefined) {
      if (!Array.isArray(meals)) {
        return res.status(400).json({ message: 'Meals must be an array' });
      }

      const existingMealIds = existingDonation.meals.map(mealEntry => mealEntry.meal.id.toString());
      const updatedMealIds = meals
        .filter(item => item.id)
        .map(item => item.id.toString());

      const mealsToDelete = existingMealIds.filter(mealId => !updatedMealIds.includes(mealId));
      if (mealsToDelete.length > 0) {
        await Meal.deleteMany({ id: { $in: mealsToDelete } });
      }

      updatedMeals = [];
      for (const item of meals) {
        if (item.quantity === undefined || typeof item.quantity !== 'number' || item.quantity < 1) {
          return res.status(400).json({ message: 'Invalid or missing quantity in meals array' });
        }

        let mealId;
        if (item.id) {
          const meal = await Meal.findOne({ id: item.id });
          if (!meal) {
            return res.status(404).json({ message: `Meal with id ${item.id} not found` });
          }
          meal.mealName = item.mealName ?? meal.mealName;
          meal.mealDescription = item.mealDescription ?? meal.mealDescription;
          meal.mealType = item.mealType ?? meal.mealType;
          meal.quantity = item.quantity;
          await meal.save();
          mealId = meal._id;
        } else {
          const counter = await Counter.findOneAndUpdate(
            { _id: 'mealId' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
          );
          const newMeal = new Meal({
            id: counter.seq,
            mealName: item.mealName,
            mealDescription: item.mealDescription,
            mealType: item.mealType,
            quantity: item.quantity,
            donation: id
          });
          await newMeal.save();
          mealId = newMeal._id;
        }
        updatedMeals.push({ meal: mealId, quantity: item.quantity });
      }
    } else {
      updatedMeals = existingDonation.meals.map(mealEntry => ({
        meal: mealEntry.meal._id,
        quantity: mealEntry.quantity,
      }));
    }

    const allowedFields = [
      'title',
      'expirationDate',
      'type',
      'category',
      'description',
      'numberOfMeals',
      'address'
    ];
    const updateData = {};
    allowedFields.forEach((field) => {
      if (donationData[field] !== undefined) {
        updateData[field] = donationData[field];
      }
    });
    if (parsedLocation) {
      updateData.location = parsedLocation;
    }

    const updatedDonation = await Donation.findByIdAndUpdate(
      id,
      { ...updateData, products: updatedProducts, meals: updatedMeals },
      { new: true }
    )
      .populate('donor', 'name role email')
      .populate('products.product')
      .populate('meals.meal');

    if (!updatedDonation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    res.status(200).json({
      message: 'Donation updated successfully',
      data: updatedDonation
    });
  } catch (error) {
    console.error('Error updating donation:', error);
    res.status(500).json({
      message: 'Failed to update donation',
      error: error.message || error.toString()
    });
  }
}

async function deleteDonation(req, res) {
  try {
    const { id } = req.params;
    const donation = await Donation.findById(id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.products && donation.products.length > 0) {
      const productIds = donation.products.map(entry => entry.product);
      await Product.deleteMany({ _id: { $in: productIds } });
    }
    if (donation.meals && donation.meals.length > 0) {
      const mealIds = donation.meals.map(entry => entry.meal);
      await Meal.deleteMany({ _id: { $in: mealIds } });
    }

    await Donation.findByIdAndDelete(id);

    res.status(200).json({ message: 'Donation and related items deleted successfully' });
  } catch (error) {
    console.error('Error deleting donation:', error);
    res.status(500).json({ message: 'Failed to delete donation', error: error.message || error.toString() });
  }
}

async function getDonationsByStatus(req, res) {
  try {
    const { status } = req.params;
    const donations = await Donation.find({ status })
      .populate('donor', 'name role email')
      .populate('products.product')
      .populate('meals.meal');

    if (donations.length === 0) {
      return res.status(404).json({ message: 'No donations found with this status' });
    }

    res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching donations by status:', error);
    res.status(500).json({ message: 'Server error', error: error.message || error.toString() });
  }
}

async function getAllDonations(req, res) {
  try {
    const donations = await Donation.find({ isaPost: true, isAnomaly: false, status: { $ne: 'rejected' } })
      .populate('donor', 'name role email photo')
      .populate('products.product')
      .populate('meals.meal')
      .populate('linkedRequests');

    res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching all donations:', error);
    res.status(500).json({ message: 'Server error', error: error.message || error.toString() });
  }
}

async function getDonationById(req, res) {
  try {
    const { id } = req.params;
    const donation = await Donation.findById(id)
      .populate('donor', 'name role email photo')
      .populate('products.product')
      .populate('meals.meal');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    console.log('Fetched donation for getDonationById:', donation);
    res.status(200).json(donation);
  } catch (error) {
    console.error('Error fetching donation by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message || error.toString() });
  }
}

async function getDonationsByUserId(req, res) {
  try {
    const { userId } = req.params;
    const donations = await Donation.find({ donor: userId, isaPost: true, isAnomaly: false })
      .populate('products.product')
      .populate('meals.meal');

    if (donations.length === 0) {
      return res.status(404).json({ message: 'No donations found for this user' });
    }

    res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching donations by user ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message || error.toString() });
  }
}

async function getRequestDonationsByUserId(req, res) {
  try {
    const { userId } = req.params;
    const donations = await Donation.find({ donor: userId, isaPost: false, isAnomaly: false })
      .populate('products.product')
      .populate('linkedRequests')
      .populate('meals.meal');

    if (donations.length === 0) {
      return res.status(404).json({ message: 'No donations found for this user' });
    }

    res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching donations by user ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message || error.toString() });
  }
}

async function getDonationsByDate(req, res) {
  try {
    const { date } = req.params;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const donations = await Donation.find({
      expirationDate: { $gte: startOfDay, $lte: endOfDay }
    })
      .populate('products.product')
      .populate('meals.meal');

    if (donations.length === 0) {
      return res.status(404).json({ message: 'No donations found for this date' });
    }

    res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching donations by date:', error);
    res.status(500).json({ message: 'Server error', error: error.message || error.toString() });
  }
}

async function getDonationsByType(req, res) {
  try {
    const { type } = req.params;
    const donations = await Donation.find({ type })
      .populate('products.product')
      .populate('meals.meal');

    if (donations.length === 0) {
      return res.status(404).json({ message: 'No donations found for this type' });
    }

    res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching donations by type:', error);
    res.status(500).json({ message: 'Server error', error: error.message || error.toString() });
  }
}

async function getDonationsByCategory(req, res) {
  try {
    const { category } = req.params;
    const donations = await Donation.find({ category })
      .populate('products.product')
      .populate('meals.meal');

    if (donations.length === 0) {
      return res.status(404).json({ message: 'No donations found for this category' });
    }

    res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching donations by category:', error);
    res.status(500).json({ message: 'Server error', error: error.message || error.toString() });
  }
}

const getDonationByRequestId = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await RequestNeed.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const donationIds = request.linkedDonation || [];

    if (donationIds.length === 0) {
      return res.status(200).json([]);
    }

    const donations = await Donation.find({ _id: { $in: donationIds } })
      .populate('products.product')
      .populate('meals.meal')
      .populate('donor');

    res.status(200).json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ message: 'Failed to fetch donations', error: error.message });
  }
};

async function classifyFood(req, res) {
  try {
    const { name, description, category } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({ message: 'Name, description, and category are required' });
    }

    if (!['packaged_products', 'prepared_meals'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const badWordChecks = [];
    const nameCheck = checkBadWords(name);
    if (nameCheck) badWordChecks.push({ field: 'name', ...nameCheck });
    const descCheck = checkBadWords(description);
    if (descCheck) badWordChecks.push({ field: 'description', ...descCheck });

    if (badWordChecks.length > 0) {
      return res.status(400).json({
        message: 'Inappropriate language detected in submission',
        badWordsDetected: badWordChecks
      });
    }

    const classification = await classifyFoodItem({ name, description, category });
    res.status(200).json(classification);
  } catch (error) {
    console.error('Error classifying food item:', error);
    res.status(500).json({ message: 'Failed to classify food item', error: error.message || error.toString() });
  }
}

async function getSupplyDemandPrediction(req, res) {
  console.log('getSupplyDemandPrediction called');
  try {
    const { period } = req.query;
    console.log('Fetching predictions for period:', period || 'week');
    const predictions = await predictSupplyDemand(period || 'week');
    console.log('Predictions:', predictions);
    if (!predictions.supply || !predictions.demand) {
      throw new Error('Prediction data is incomplete');
    }
    res.status(200).json(predictions);
  } catch (error) {
    console.error('Prediction Error Details:', error.stack);
    res.status(500).json({ message: 'Failed to predict supply and demand', error: error.message || error.toString() });
  }
}

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
      for (const reqProduct of request.requestedProducts || []) {
        const matchingProduct = products.find(p => p.product.productType === reqProduct.product.productType);
        if (matchingProduct) {
          const fulfilledQty = Math.min(matchingProduct.quantity, reqProduct.quantity);
          fulfilledItems.push({ product: reqProduct.product._id, quantity: fulfilledQty });
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
      const daysUntilExpiration = (expirationDate - new Date()) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiration < 3) matchScore += 50;
      else if (daysUntilExpiration < 7) matchScore += 20;

      if (request.recipient.type === 'RELIEF' && daysUntilExpiration < 7) {
        matchScore += 30;
      } else if (request.recipient.type === 'SOCIAL_WELFARE') {
        matchScore += 10;
      }

      matches.push({
        request,
        fulfilledItems,
        matchScore
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

module.exports = {
  getRequestDonationsByUserId,
  matchDonationToRequests,
  getDonationByRequestId,
  getSupplyDemandPrediction,
  classifyFood,
  getDonationsByUserId,
  getAllDonations,
  getDonationById,
  getDonationsByDate,
  getDonationsByType,
  getDonationsByCategory,
  createDonation,
  updateDonation,
  deleteDonation,
  getDonationsByStatus
};