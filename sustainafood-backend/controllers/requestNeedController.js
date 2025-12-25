const RequestNeed = require('../models/RequestNeed');
const Product = require('../models/Product');
const Counter = require('../models/Counter');
const Donation = require('../models/Donation');
const DonationTransaction = require('../models/DonationTransaction');
const nodemailer = require('nodemailer');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const multer = require('multer');
const Meals = require('../models/Meals');
const fs = require('fs');
const upload = multer().none();

const badWords = [
  'damn',
  'hell',
  'idiot',
  'stupid',
  'fuck',
  't**t',
];

const containsBadWords = (text) => {
  if (!text || typeof text !== 'string') return false;
  const lowerText = text.toLowerCase();
  return badWords.some((word) => lowerText.includes(word));
};

const checkBadWords = (text) => {
  if (!text || typeof text !== 'string') return null;
  const lowerText = text.toLowerCase();
  const badWord = badWords.find((word) => lowerText.includes(word));
  return badWord ? { containsBadWords: true, badWord } : null;
};

// ✅ Get all requests
async function getAllRequests(req, res) {
  try {
    const requests = await RequestNeed.find({ isaPost: true , status:{ $ne: 'fulfilled' } })
      .populate('recipient')
      .populate('requestedProducts.product')
      .populate('requestedMeals.meal');
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ✅ Get all requests for backoffice
async function getAllRequestsbackoffice(req, res) {
  try {
    const requests = await RequestNeed.find()
      .populate('recipient', 'name role photo')
      .populate('requestedProducts.product', 'name')
      .populate('requestedMeals.meal', 'mealName');
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ✅ Get request by ID
async function getRequestById(req, res) {
  try {
    const { id } = req.params;
    const request = await RequestNeed.findById(id)
      .populate('recipient')
      .populate('requestedProducts.product')
      .populate('requestedMeals.meal');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ✅ Get requests by Recipient ID
async function getRequestsByRecipientId(req, res) {
  try {
    const { recipientId } = req.params;
    const requests = await RequestNeed.find({ recipient: recipientId, isaPost: true })
      .populate('requestedProducts.product')
      .populate('requestedMeals.meal');

    if (!requests.length) {
      return res.status(404).json({ message: 'No requests found for this recipient' });
    }

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ✅ Get requests by Status
async function getRequestsByStatus(req, res) {
  try {
    const { status } = req.params;
    const requests = await RequestNeed.find({ status })
      .populate('recipient')
      .populate('requestedProducts.product')
      .populate('requestedMeals.meal');

    if (!requests.length) {
      return res.status(404).json({ message: 'No requests found with this status' });
    }

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ✅ Create a new request
async function createRequest(req, res) {
    console.log('Request body received:', req.body);
  
    try {
      let {
        title,
        location,
        address, // Add address to request body
        expirationDate,
        description,
        category,
        recipient,
        requestedProducts,
        requestedMeals,
        status,
        linkedDonation,
        numberOfMeals,
      } = req.body;
  
      // Parse location from JSON string
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
        return res.status(400).json({
          message: 'Invalid location format: must be a valid GeoJSON string',
          error: error.message,
        });
      }
  
      // Validate address if provided
      if (address && (typeof address !== 'string' || address.trim() === '')) {
        return res.status(400).json({ message: 'Address must be a non-empty string' });
      }
  
      // Vérification des "bad words" (skip location and address)
      const badWordChecks = [];
      const titleCheck = checkBadWords(title);
      if (titleCheck) badWordChecks.push({ field: 'title', ...titleCheck });
      const descriptionCheck = checkBadWords(description);
      if (descriptionCheck) badWordChecks.push({ field: 'description', ...descriptionCheck });
  
      for (const product of requestedProducts || []) {
        const nameCheck = checkBadWords(product.name);
        if (nameCheck) badWordChecks.push({ field: `product name "${product.name}"`, ...nameCheck });
        const descCheck = checkBadWords(product.productDescription);
        if (descCheck) badWordChecks.push({ field: `product description for "${product.name}"`, ...descCheck });
      }
      for (const meal of requestedMeals || []) {
        const nameCheck = checkBadWords(meal.mealName);
        if (nameCheck) badWordChecks.push({ field: `meal name "${meal.mealName}"`, ...nameCheck });
        const descCheck = checkBadWords(meal.mealDescription);
        if (descCheck) badWordChecks.push({ field: `meal description for "${meal.mealName}"`, ...descCheck });
      }
  
      if (badWordChecks.length > 0) {
        return res.status(400).json({
          message: 'Inappropriate language detected in submission',
          badWordsDetected: badWordChecks,
        });
      }
  
      // Ensure requestedProducts is parsed correctly
      if (typeof requestedProducts === 'string') {
        try {
          requestedProducts = JSON.parse(requestedProducts);
        } catch (error) {
          return res.status(400).json({ message: 'Invalid requestedProducts format' });
        }
      }
      if (!Array.isArray(requestedProducts)) {
        requestedProducts = [];
      }
  
      // Ensure requestedMeals is parsed correctly
      if (typeof requestedMeals === 'string') {
        try {
          requestedMeals = JSON.parse(requestedMeals);
        } catch (error) {
          return res.status(400).json({ message: 'Invalid requestedMeals format' });
        }
      }
      if (!Array.isArray(requestedMeals)) {
        requestedMeals = [];
      }
  
      // Validate and filter products
      const validProducts = requestedProducts.map((product, index) => {
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
          throw new Error(`Product at index ${index} has an invalid totalQuantity: ${product.totalQuantity}`);
        }
        if (!product.status || typeof product.status !== 'string') {
          throw new Error(`Product at index ${index} is missing a valid status`);
        }
        return product;
      });
  
      // Validate and filter meals
      const validMeals = requestedMeals.map((meal, index) => {
        if (!meal.mealName || typeof meal.mealName !== 'string' || !meal.mealName.trim()) {
          throw new Error(`Meal at index ${index} is missing a valid mealName`);
        }
        if (!meal.mealDescription || typeof meal.mealDescription !== 'string' || !meal.mealDescription.trim()) {
          throw new Error(`Meal at index ${index} is missing a valid mealDescription`);
        }
        if (!meal.mealType || typeof meal.mealType !== 'string') {
          throw new Error(`Meal at index ${index} is missing a valid mealType`);
        }
        const quantity = parseInt(meal.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Meal at index ${index} has an invalid quantity: ${meal.quantity}`);
        }
        return meal;
      });
  
    
  
      // Validate numberOfMeals for prepared meals
      let totalMeals = 0;
      if (category === 'prepared_meals') {
        const parsedNumberOfMeals = parseInt(numberOfMeals, 10);
        if (isNaN(parsedNumberOfMeals) || parsedNumberOfMeals <= 0) {
          return res.status(400).json({ message: 'numberOfMeals must be a valid positive integer for prepared meals' });
        }
        totalMeals = parsedNumberOfMeals;
        const calculatedMeals = validMeals.reduce((sum, meal) => sum + meal.quantity, 0);
      }
  
      // Create the request without products or meals first
      const newRequest = new RequestNeed({
        title,
        location: parsedLocation,
        address, // Add address to the new request
        expirationDate: new Date(expirationDate),
        description,
        category,
        recipient,
        requestedProducts: [],
        requestedMeals: [],
        status: status || 'pending',
        linkedDonation: linkedDonation || [],
        numberOfMeals: category === 'prepared_meals' ? totalMeals : undefined,
        isaPost: true,
      });
  
      await newRequest.save();
      const requestId = newRequest._id;
  
      // Handle products for packaged_products
      if (category === 'packaged_products' && validProducts.length > 0) {
        const counter = await Counter.findOneAndUpdate(
          { _id: 'ProductId' },
          { $inc: { seq: validProducts.length } },
          { new: true, upsert: true }
        );
  
        const startId = counter.seq - validProducts.length + 1;
  
        const productDocs = validProducts.map((product, index) => ({
          id: startId + index,
          name: product.name,
          productType: product.productType,
          productDescription: product.productDescription,
          weightPerUnit: product.weightPerUnit,
          weightUnit: product.weightUnit || 'kg',
          weightUnitTotale: product.weightUnitTotale || 'kg',
          totalQuantity: product.totalQuantity,
          image: product.image || '',
          status: product.status,
          request: requestId,
        }));
  
        const createdProducts = await Product.insertMany(productDocs);
        newRequest.requestedProducts = createdProducts.map((product) => ({
          product: product._id,
          quantity: parseInt(product.totalQuantity),
        }));
      }
  
      // Handle meals for prepared_meals
      if (category === 'prepared_meals' && validMeals.length > 0) {
        const counter = await Counter.findOneAndUpdate(
          { _id: 'MealId' },
          { $inc: { seq: validMeals.length } },
          { new: true, upsert: true }
        );
  
        const startId = counter.seq - validProducts.length + 1;
  
        const mealDocs = validMeals.map((meal, index) => ({
          id: startId + index,
          mealName: meal.mealName,
          mealDescription: meal.mealDescription,
          mealType: meal.mealType,
          quantity: meal.quantity,
          request: requestId,
        }));
  
        const createdMeals = await Meals.insertMany(mealDocs);
        newRequest.requestedMeals = createdMeals.map((meal) => ({
          meal: meal._id,
          quantity: parseInt(meal.quantity),
        }));
      }
  
      await newRequest.save();
  
      const populatedRequest = await RequestNeed.findById(newRequest._id)
        .populate('recipient')
        .populate('requestedProducts.product')
        .populate('requestedMeals.meal');
  
      console.log('Saved request:', populatedRequest);
      res.status(201).json({ message: 'Request created successfully', newRequest: populatedRequest });
    } catch (error) {
      console.error('Request Creation Error:', error);
      res.status(500).json({
        message: 'Failed to create request',
        error: error.message,
      });
    }
  }
// ✅ Update a request by ID
async function updateRequest(req, res) {
    try {
      const { id } = req.params;
      const { requestedProducts, requestedMeals, numberOfMeals, mealName, mealDescription, mealType, location, address, ...requestData } = req.body;
  
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Valid Request ID is required' });
      }
  
      // Parse location if provided
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
          return res.status(400).json({
            message: 'Invalid location format: must be a valid GeoJSON string',
            error: error.message,
          });
        }
      }
  
      // Validate address if provided
      if (address && (typeof address !== 'string' || address.trim() === '')) {
        return res.status(400).json({ message: 'Address must be a non-empty string' });
      }
  
      // Vérification des "bad words" (skip location and address)
      const badWordChecks = [];
      if (requestData.title) {
        const titleCheck = checkBadWords(requestData.title);
        if (titleCheck) badWordChecks.push({ field: 'title', ...titleCheck });
      }
      if (requestData.description) {
        const descriptionCheck = checkBadWords(requestData.description);
        if (descriptionCheck) badWordChecks.push({ field: 'description', ...descriptionCheck });
      }
      for (const product of requestedProducts || []) {
        if (product.name) {
          const nameCheck = checkBadWords(product.name);
          if (nameCheck) badWordChecks.push({ field: `product name "${product.name}"`, ...nameCheck });
        }
        if (product.productDescription) {
          const descCheck = checkBadWords(product.productDescription);
          if (descCheck) badWordChecks.push({ field: `product description for "${product.name}"`, ...descCheck });
        }
      }
      if (mealName) {
        const nameCheck = checkBadWords(mealName);
        if (nameCheck) badWordChecks.push({ field: 'meal name', ...nameCheck });
      }
      if (mealDescription) {
        const descCheck = checkBadWords(mealDescription);
        if (descCheck) badWordChecks.push({ field: 'meal description', ...descCheck });
      }
  
      if (badWordChecks.length > 0) {
        return res.status(400).json({
          message: 'Inappropriate language detected in submission',
          badWordsDetected: badWordChecks,
        });
      }
  
      // Validate required fields
      if (requestData.title && (typeof requestData.title !== 'string' || requestData.title.trim() === '')) {
        return res.status(400).json({ message: 'Title must be a non-empty string' });
      }
      if (requestData.category && !['packaged_products', 'prepared_meals'].includes(requestData.category)) {
        return res.status(400).json({ message: 'Category must be either "packaged_products" or "prepared_meals"' });
      }
      if (requestData.expirationDate && isNaN(new Date(requestData.expirationDate).getTime())) {
        return res.status(400).json({ message: 'Expiration Date must be a valid date' });
      }
      if (requestData.status && !['available', 'pending', 'reserved', 'fulfilled', 'partially_fulfilled', 'rejected'].includes(requestData.status)) {
        return res.status(400).json({ message: 'Status must be one of: available, pending, reserved, fulfilled, partially_fulfilled, rejected' });
      }
  
      const existingRequest = await RequestNeed.findById(id);
      if (!existingRequest) {
        return res.status(404).json({ message: 'Request not found' });
      }
  
      let updatedProducts = existingRequest.requestedProducts;
      if (requestData.category === 'packaged_products' && requestedProducts) {
        if (!Array.isArray(requestedProducts)) {
          return res.status(400).json({ message: 'requestedProducts must be an array' });
        }
  
        updatedProducts = [];
        for (const item of requestedProducts) {
          if (!item.product || typeof item.product !== 'object') {
            return res.status(400).json({ message: 'Each requested product must have a product object' });
          }
          if (typeof item.quantity !== 'number' || item.quantity < 0) {
            return res.status(400).json({ message: `Invalid quantity for product: ${item.quantity}` });
          }
  
          const { productType, productDescription, weightPerUnit, weightUnit, status } = item.product;
  
          if (!productType || typeof productType !== 'string' || productType.trim() === '') {
            return res.status(400).json({ message: 'productType is required for each product' });
          }
          if (!productDescription || typeof productDescription !== 'string' || productDescription.trim() === '') {
            return res.status(400).json({ message: 'productDescription is required for each product' });
          }
          if (typeof weightPerUnit !== 'number' || weightPerUnit <= 0) {
            return res.status(400).json({ message: 'weightPerUnit must be a positive number for each product' });
          }
          if (!weightUnit || !['kg', 'g', 'lb', 'oz'].includes(weightUnit)) {
            return res.status(400).json({ message: 'weightUnit must be one of: kg, g, lb, oz' });
          }
          if (status && !['available', 'pending', 'reserved'].includes(status)) {
            return res.status(400).json({ message: 'Product status must be one of: available, pending, reserved' });
          }
  
          let productDoc = await Product.findOne({
            productType,
            productDescription,
          });
  
          if (!productDoc) {
            const counter = await Counter.findOneAndUpdate(
              { _id: 'ProductId' },
              { $inc: { seq: 1 } },
              { new: true, upsert: true }
            );
  
            productDoc = new Product({
              id: counter.seq.toString(),
              name: productType,
              productType,
              productDescription,
              weightPerUnit: Number(weightPerUnit),
              weightUnit,
              weightUnitTotale: weightUnit,
              totalQuantity: Number(item.quantity),
              status: status || 'available',
              request: id,
            });
            await productDoc.save();
          } else {
            productDoc.totalQuantity = (productDoc.totalQuantity || 0) + Number(item.quantity);
            await productDoc.save();
          }
  
          updatedProducts.push({
            product: productDoc._id,
            quantity: Number(item.quantity),
          });
        }
      }
  
      let updatedMeals = existingRequest.requestedMeals;
      if (requestData.category === 'prepared_meals' && requestedMeals) {
        if (!Array.isArray(requestedMeals)) {
          return res.status(400).json({ message: 'requestedMeals must be an array' });
        }
  
        updatedMeals = [];
        for (const meal of requestedMeals) {
          if (!meal.mealName || typeof meal.mealName !== 'string' || meal.mealName.trim() === '') {
            return res.status(400).json({ message: 'Each meal must have a valid mealName' });
          }
          if (!meal.mealDescription || typeof meal.mealDescription !== 'string' || meal.mealDescription.trim() === '') {
            return res.status(400).json({ message: 'Each meal must have a valid mealDescription' });
          }
          if (!meal.mealType || typeof meal.mealType !== 'string') {
            return res.status(400).json({ message: 'Each meal must have a valid mealType' });
          }
          if (typeof meal.quantity !== 'number' || meal.quantity < 1) {
            return res.status(400).json({ message: `Invalid quantity for meal ${meal.mealName}: ${meal.quantity}` });
          }
  
          let mealDoc = await Meals.findOne({
            mealName: meal.mealName,
            mealType: meal.mealType,
          });
  
          if (!mealDoc) {
            const counter = await Counter.findOneAndUpdate(
              { _id: 'MealId' },
              { $inc: { seq: 1 } },
              { new: true, upsert: true }
            );
  
            mealDoc = new Meals({
              id: counter.seq.toString(),
              mealName: meal.mealName,
              mealDescription: meal.mealDescription,
              mealType: meal.mealType,
              quantity: Number(meal.quantity),
              request: id,
            });
            await mealDoc.save();
          } else {
            mealDoc.quantity = (mealDoc.quantity || 0) + Number(meal.quantity);
            await mealDoc.save();
          }
  
          updatedMeals.push({
            meal: mealDoc._id,
            quantity: Number(meal.quantity),
          });
        }
  
        // Validate numberOfMeals if provided
        if (numberOfMeals !== undefined) {
          if (typeof numberOfMeals !== 'number' || numberOfMeals <= 0) {
            return res.status(400).json({ message: 'numberOfMeals must be a positive number for prepared_meals category' });
          }
          const totalMeals = updatedMeals.reduce((sum, m) => sum + m.quantity, 0);
          if (totalMeals !== numberOfMeals) {
            return res.status(400).json({
              message: `Total quantity of meals (${totalMeals}) must match numberOfMeals (${numberOfMeals})`,
            });
          }
        }
      }
  
      const updateData = { ...requestData };
      if (parsedLocation) {
        updateData.location = parsedLocation;
      }
      if (address !== undefined) {
        updateData.address = address;
      }
      if (requestData.category === 'packaged_products') {
        updateData.requestedProducts = updatedProducts;
        updateData.requestedMeals = [];
        updateData.numberOfMeals = undefined;
        updateData.mealName = undefined;
        updateData.mealDescription = undefined;
        updateData.mealType = undefined;
      } else if (requestData.category === 'prepared_meals') {
        updateData.requestedMeals = updatedMeals;
        updateData.requestedProducts = [];
        updateData.numberOfMeals = numberOfMeals !== undefined ? numberOfMeals : existingRequest.numberOfMeals;
        updateData.mealName = mealName !== undefined ? mealName : existingRequest.mealName;
        updateData.mealDescription = mealDescription !== undefined ? mealDescription : existingRequest.mealDescription;
        updateData.mealType = mealType !== undefined ? mealType : existingRequest.mealType;
      }
  
      const updatedRequest = await RequestNeed.findByIdAndUpdate(id, updateData, { new: true })
        .populate('recipient')
        .populate('requestedProducts.product')
        .populate('requestedMeals.meal');
  
      if (!updatedRequest) {
        return res.status(404).json({ message: 'Request not found' });
      }
  
      res.status(200).json({ message: 'Request updated successfully', updatedRequest });
    } catch (error) {
      console.error('Update Request Error:', error);
      res.status(500).json({ message: 'Failed to update request', error: error.message });
    }
  }

// ✅ Delete a request by ID
async function deleteRequest(req, res) {
  try {
    const { id } = req.params;
    const deletedRequest = await RequestNeed.findByIdAndDelete(id);

    if (!deletedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Delete associated products and meals
    if (deletedRequest.requestedProducts.length > 0) {
      const productIds = deletedRequest.requestedProducts.map((p) => p.product);
      await Product.deleteMany({ _id: { $in: productIds } });
    }
    if (deletedRequest.requestedMeals.length > 0) {
      const mealIds = deletedRequest.requestedMeals.map((m) => m.meal);
      await Meals.deleteMany({ _id: { $in: mealIds } });
    }

    res.status(200).json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete request', error: error.message });
  }
}

// ✅ Create request for existing donation
async function createRequestNeedForExistingDonation(req, res) {
  try {
    const { donationId } = req.params;
    const { recipientId, requestedProducts, requestedMeals, description, numberOfMeals, location, address } = req.body;

    // Validate input
    if (!donationId || !mongoose.Types.ObjectId.isValid(donationId)) {
      return res.status(400).json({ message: 'Invalid donation ID' });
    }
    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: 'Invalid recipient ID' });
    }

    // Fetch the donation and populate its products and meals
    const donation = await Donation.findById(donationId)
      .populate('products.product')
      .populate('meals.meal')
      .populate('donor');
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (new Date(donation.expirationDate) <= new Date()) {
      return res.status(400).json({ message: 'Donation has expired' });
    }

    // Fetch the recipient to validate their role
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }
    if (!['ong', 'student'].includes(recipient.role)) {
      return res.status(403).json({ message: 'Only users with role "ong" or "student" can create requests' });
    }

    // Determine the donation type (products or meals)
    const isMealDonation = donation.category === 'prepared_meals';
    let validatedProducts = [];
    let validatedMeals = [];
    let totalMeals = 0;

    if (isMealDonation) {
      if (!requestedMeals || !Array.isArray(requestedMeals)) {
        return res.status(400).json({ message: 'requestedMeals must be an array for meal donations' });
      }

      const donationMealMap = new Map(
        donation.meals.map((mealEntry) => [mealEntry.meal._id.toString(), { quantity: mealEntry.quantity, meal: mealEntry.meal }])
      );

      for (const { meal: mealId, quantity } of requestedMeals) {
        if (!mongoose.Types.ObjectId.isValid(mealId)) {
          return res.status(400).json({ message: `Invalid meal ID: ${mealId}` });
        }
        if (!donationMealMap.has(mealId)) {
          return res.status(400).json({ message: `Meal ${mealId} is not part of this donation` });
        }

        const availableQuantity = donationMealMap.get(mealId).quantity;
        if (!Number.isInteger(quantity) || quantity <= 0) {
          return res.status(400).json({ message: `Quantity for meal ${mealId} must be a positive integer` });
        }
        if (quantity > availableQuantity) {
          return res.status(400).json({
            message: `Requested quantity (${quantity}) for meal ${mealId} exceeds available quantity (${availableQuantity})`,
          });
        }

        validatedMeals.push({ meal: mealId, quantity });
        totalMeals += quantity;
      }

      if (totalMeals !== numberOfMeals) {
        return res.status(400).json({
          message: `Total requested meals (${totalMeals}) do not match provided numberOfMeals (${numberOfMeals})`,
        });
      }
      if (totalMeals > donation.numberOfMeals) {
        return res.status(400).json({
          message: `Total requested meals (${totalMeals}) exceed available number of meals (${donation.numberOfMeals})`,
        });
      }
    } else {
      if (!requestedProducts || !Array.isArray(requestedProducts)) {
        return res.status(400).json({ message: 'requestedProducts must be an array for product donations' });
      }

      const donationProductMap = new Map(
        donation.products.map((p) => [p.product._id.toString(), { quantity: p.quantity, product: p.product }])
      );

      for (const { product: productId, quantity } of requestedProducts) {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
          return res.status(400).json({ message: `Invalid product ID: ${productId}` });
        }
        if (!donationProductMap.has(productId)) {
          return res.status(400).json({ message: `Product ${productId} is not part of this donation` });
        }

        const availableQuantity = donationProductMap.get(productId).quantity;
        if (!Number.isInteger(quantity) || quantity <= 0) {
          return res.status(400).json({ message: `Quantity for product ${productId} must be a positive integer` });
        }
        if (quantity > availableQuantity) {
          return res.status(400).json({
            message: `Requested quantity (${quantity}) for product ${productId} exceeds available quantity (${availableQuantity})`,
          });
        }

        validatedProducts.push({ product: productId, quantity });
      }
    }

    // Create the new RequestNeed
    const newRequest = new RequestNeed({
      title: `Request for ${donation.title}`,
      location: location, // Use donation's GeoJSON location directly
      address:address,
      expirationDate: donation.expirationDate,
      description: description || '',
      category: donation.category,
      recipient: recipientId,
      requestedProducts: isMealDonation ? [] : validatedProducts,
      requestedMeals: isMealDonation ? validatedMeals : [],
      status: 'pending',
      linkedDonation: [donationId],
      isaPost: false,
      numberOfMeals: isMealDonation ? totalMeals : undefined,
    });

    await newRequest.save();

    // Update the Donation to link the new request
    await Donation.findByIdAndUpdate(donationId, { $push: { linkedRequests: newRequest._id } }, { new: true });

    // Create a DonationTransaction with status 'pending'
    const counter = await Counter.findOneAndUpdate(
      { _id: 'DonationTransactionId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    if (!counter) throw new Error('Failed to increment DonationTransactionId counter');
    const transactionId = counter.seq;

    const transaction = new DonationTransaction({
      id: transactionId,
      donation: donationId,
      requestNeed: newRequest._id,
      donor: donation.donor,
      recipient: recipientId,
      allocatedProducts: validatedProducts,
      allocatedMeals: validatedMeals,
      status: 'pending',
    });

    await transaction.save();

    // Fetch the populated request for the response
    const populatedRequest = await RequestNeed.findById(newRequest._id)
      .populate('recipient')
      .populate('requestedProducts.product')
      .populate('requestedMeals.meal');

    // Send notification to donor (if email exists)
    if (donation.donor && donation.donor.email) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: donation.donor.email,
        subject: `New Request for Your Donation: ${donation.title}`,
        text: `Dear ${donation.donor.name || 'Donor'},

A new request has been made for your donation titled "${donation.title}".

Request Details:
- Title: ${newRequest.title}
- Recipient: ${recipient.name || 'Unknown Recipient'}
${isMealDonation ? 
    `- Requested Meals: ${validatedMeals.map(item => {
        const mealEntry = donation.meals.find(m => m.meal._id.toString() === item.meal.toString());
        return `${mealEntry.meal.mealName} (Quantity: ${item.quantity})`;
    }).join(', ')} (Total: ${totalMeals})` :
    `- Requested Products: ${validatedProducts.map(item => {
        const productEntry = donation.products.find(p => p.product._id.toString() === item.product.toString());
        return `${productEntry.product.name} (Quantity: ${item.quantity})`;
    }).join(', ')}`
}
- Expiration Date: ${newRequest.expirationDate.toLocaleDateString()}

Please review the request in your dashboard and accept or reject it.

Best regards,
Your Platform Team`,
        html: `
          <div style="font-family: Arial, sans-serif; color: black;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="cid:logo" alt="Platform Logo" style="max-width: 150px; height: auto;" />
            </div>
            <h2 style="color: #228b22;">New Request for Your Donation</h2>
            <p>Dear ${donation.donor.name || 'Donor'},</p>
            <p>A new request has been made for your donation titled "<strong>${donation.title}</strong>".</p>
            <h3>Request Details:</h3>
            <ul>
              <li><strong>Title:</strong> ${newRequest.title}</li>
              <li><strong>Recipient:</strong> ${recipient.name || 'Unknown Recipient'}</li>
              ${isMealDonation ? 
                  `<li><strong>Requested Meals:</strong> ${validatedMeals.map(item => {
                      const mealEntry = donation.meals.find(m => m.meal._id.toString() === item.meal.toString());
                      return `${mealEntry.meal.mealName} (Quantity: ${item.quantity})`;
                  }).join(', ')} (Total: ${totalMeals})</li>` :
                  `<li><strong>Requested Products:</strong> ${validatedProducts.map(item => {
                      const productEntry = donation.products.find(p => p.product._id.toString() === item.product.toString());
                      return `${productEntry.product.name} (Quantity: ${item.quantity})`;
                  }).join(', ')}</li>`
              }
              <li><strong>Expiration Date:</strong> ${newRequest.expirationDate.toLocaleDateString()}</li>
            </ul>
            <p>Please review the request in your dashboard and accept or reject it.</p>
            <p style="margin-top: 20px;">Best regards,<br>Your Platform Team</p>
          </div>
        `,
        attachments: [
          {
            filename: 'logo.png',
            path: path.join(__dirname, '../Uploads/logo.png'),
            cid: 'logo',
          },
        ],
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${donation.donor.email}`);
    }

    res.status(201).json({
      message: 'Request created successfully for the donation',
      request: populatedRequest,
      transactionId: transaction._id,
    });
  } catch (error) {
    console.error('Create Request Error:', error);
    res.status(500).json({
      message: 'Failed to create request for the donation',
      error: error.message,
    });
  }
}

// ✅ Add donation to request
async function addDonationToRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { products, meals, donor, expirationDate, numberOfMeals ,address , location} = req.body;

    // Input Validation
    if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Valid Request ID is required' });
    }

    if (!donor || !mongoose.Types.ObjectId.isValid(donor)) {
      return res.status(400).json({ message: 'Valid Donor ID is required' });
    }

    // Fetch the request with populated fields
    const request = await RequestNeed.findById(requestId)
      .populate('requestedProducts.product')
      .populate('requestedMeals.meal')
      .populate('recipient');
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Validate based on category
    let donationProducts = [];
    let donationMeals = [];
    if (request.category === 'packaged_products') {
      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: 'Products array is required for packaged_products category' });
      }

      const productMap = new Map(
        request.requestedProducts.map((p) => [p.product?._id.toString(), p.quantity])
      );

      donationProducts = products.map(({ product, quantity }) => {
        if (!product || !mongoose.Types.ObjectId.isValid(product)) {
          throw new Error(`Invalid product ID: ${product}`);
        }
        if (!productMap.has(product)) {
          throw new Error(`Product ${product} not found in request`);
        }
        const maxQty = productMap.get(product);
        if (typeof quantity !== 'number' || quantity < 0) {
          throw new Error(`Invalid quantity for product ${product}: ${quantity}`);
        }
        return {
          product,
          quantity: Math.min(quantity, maxQty),
        };
      });
    } else if (request.category === 'prepared_meals') {
      if (!meals || !Array.isArray(meals) || meals.length === 0) {
        return res.status(400).json({ message: 'Meals array is required for prepared_meals category' });
      }

      if (typeof numberOfMeals !== 'number' || numberOfMeals <= 0) {
        return res.status(400).json({ message: 'numberOfMeals must be a positive number for prepared_meals category' });
      }

      for (const meal of meals) {
        if (!meal.mealName || typeof meal.mealName !== 'string' || meal.mealName.trim() === '') {
          return res.status(400).json({ message: 'Each meal must have a valid mealName' });
        }
        if (!meal.mealDescription || typeof meal.mealDescription !== 'string' || meal.mealDescription.trim() === '') {
          return res.status(400).json({ message: 'Each meal must have a valid mealDescription' });
        }
        if (!meal.mealType || typeof meal.mealType !== 'string' || meal.mealType.trim() === '') {
          return res.status(400).json({ message: 'Each meal must have a valid mealType' });
        }
        if (typeof meal.quantity !== 'number' || meal.quantity < 1) {
          return res.status(400).json({ message: `Invalid quantity for meal ${meal.mealName}: ${meal.quantity}` });
        }
      }

      donationMeals = [];
      for (const meal of meals) {
        let mealDoc = await Meals.findOne({
          mealName: meal.mealName,
          mealType: meal.mealType,
        });

        if (!mealDoc) {
          const counter = await Counter.findOneAndUpdate(
            { _id: 'MealId' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
          );

          mealDoc = new Meals({
            id: counter.seq.toString(),
            mealName: meal.mealName,
            mealDescription: meal.mealDescription,
            mealType: meal.mealType,
            quantity: Number(meal.quantity),
          });
          await mealDoc.save();
        }

        donationMeals.push({
          meal: mealDoc._id,
          quantity: Number(meal.quantity),
        });
      }

      const totalMeals = donationMeals.reduce((sum, m) => sum + m.quantity, 0);
      if (totalMeals !== numberOfMeals) {
        return res.status(400).json({
          message: `Total quantity of meals (${totalMeals}) must match numberOfMeals (${numberOfMeals})`,
        });
      }
    } else {
      return res.status(400).json({ message: 'Invalid request category' });
    }

    // Create New Donation
    const newDonation = new Donation({
      title: request.title,
      donor: donor,
      description: `Donation for request ${request.title}`,
      category: request.category,
      location: location, // Use request's GeoJSON location
      address: address,
      products: donationProducts,
      meals: donationMeals,
      numberOfMeals: request.category === 'prepared_meals' ? numberOfMeals : undefined,
      expirationDate: expirationDate || request.expirationDate,
      isaPost: false,
      linkedRequests: [requestId],
    });

    const savedDonation = await newDonation.save();

    // Update Request's linkedDonation Field
    if (!request.linkedDonation) {
      request.linkedDonation = [];
    }
    request.linkedDonation.push(savedDonation._id);
    await request.save();

    // Create a DonationTransaction with status 'pending'
    const counter = await Counter.findOneAndUpdate(
      { _id: 'DonationTransactionId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    if (!counter) throw new Error('Failed to increment DonationTransactionId counter');
    const transactionId = counter.seq;

    const transaction = new DonationTransaction({
      id: transactionId,
      donation: savedDonation._id,
      requestNeed: requestId,
      donor: savedDonation.donor,
      recipient: request.recipient,
      allocatedProducts: donationProducts,
      allocatedMeals: donationMeals,
      status: 'pending',
    });

    await transaction.save();

    // Send Notification Email
    const recipient = request.recipient;
    if (recipient && recipient.email) {
      const populatedDonation = await Donation.findById(savedDonation._id)
        .populate('donor')
        .populate('meals.meal')
        .populate('products.product');

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const productList = populatedDonation.products?.length > 0
        ? populatedDonation.products
            .map((p) => `${p.product?.name || 'Unknown Product'} (Quantity: ${p.quantity || 0})`)
            .join(', ')
        : 'None';
      const mealList = populatedDonation.meals?.length > 0
        ? populatedDonation.meals
            .map((m) => `${m.meal?.mealName || 'Unknown Meal'} (Type: ${m.meal?.mealType || 'Unknown Type'}, Quantity: ${m.quantity || 0})`)
            .join(', ')
        : 'None';

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient.email,
        subject: `New Donation Added to Your Request: ${request.title}`,
        text: `Dear ${recipient.name || 'Recipient'},

A new donation has been added to your request titled "${request.title}".

Donation Details:
- Title: ${populatedDonation.title}
- Donor: ${populatedDonation.donor?.name || 'Unknown Donor'}
${request.category === 'packaged_products' ? `- Products: ${productList}` : `- Meals: ${mealList}`}
- Expiration Date: ${populatedDonation.expirationDate ? new Date(populatedDonation.expirationDate).toLocaleDateString() : 'Not set'}

Thank you for using our platform!

Best regards,
Your Platform Team`,
        html: `
          <div style="font-family: Arial, sans-serif; color: black;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="cid:logo" alt="Platform Logo" style="max-width: 150px; height: auto;" />
            </div>
            <h2 style="color: #228b22;">New Donation Added to Your Request</h2>
            <p>Dear ${recipient.name || 'Recipient'},</p>
            <p>A new donation has been added to your request titled "<strong>${request.title}</strong>".</p>
            <h3>Donation Details:</h3>
            <ul>
              <li><strong>Title:</strong> ${populatedDonation.title}</li>
              <li><strong>Donor:</strong> ${populatedDonation.donor?.name || 'Unknown Donor'}</li>
              ${request.category === 'packaged_products' ? `<li><strong>Products:</strong> ${productList}</li>` : `<li><strong>Meals:</strong> ${mealList}</li>`}
              <li><strong>Expiration Date:</strong> ${populatedDonation.expirationDate ? new Date(populatedDonation.expirationDate).toLocaleDateString() : 'Not set'}</li>
            </ul>
            <p>Thank you for using our platform!</p>
            <p style="margin-top: 20px;">Best regards,<br>Your Platform Team</p>
          </div>
        `,
        attachments: [],
      };

      const logoPath = path.join(__dirname, '../Uploads/logo.png');
      if (fs.existsSync(logoPath)) {
        mailOptions.attachments.push({
          filename: 'logo.png',
          path: logoPath,
          cid: 'logo',
        });
      } else {
        console.warn('Logo file not found at:', logoPath);
        mailOptions.html = mailOptions.html.replace(
          '<img src="cid:logo" alt="Platform Logo" style="max-width: 150px; height: auto;" />',
          ''
        );
      }

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${recipient.email}`);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    } else {
      console.warn('Recipient email not found for request:', requestId);
    }

    // Response
    res.status(201).json({
      message: 'Donation added to request successfully',
      donation: savedDonation,
      transactionId: transaction._id,
    });
  } catch (error) {
    console.error('Donation Error:', error);
    res.status(500).json({ message: 'Failed to add donation to request', error: error.message });
  }
}

// ✅ Update add donation to request
async function UpdateAddDonationToRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { donationId, products, meals, donor, expirationDate, numberOfMeals, fulfilledItems } = req.body;

    // Input Validation
    if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Valid Request ID is required' });
    }

    if (!donationId || !mongoose.Types.ObjectId.isValid(donationId)) {
      return res.status(400).json({ message: 'Valid Donation ID is required' });
    }

    if (!donor || !mongoose.Types.ObjectId.isValid(donor)) {
      return res.status(400).json({ message: 'Valid Donor ID is required' });
    }

    // Fetch the request with populated fields
    const request = await RequestNeed.findById(requestId)
      .populate('requestedProducts.product')
      .populate('requestedMeals.meal')
      .populate('recipient');
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Fetch the existing donation
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Validate donor
    if (donation.donor.toString() !== donor) {
      return res.status(403).json({ message: 'Donor does not match the donation owner' });
    }

    // Check if the donation is already assigned to this request
    if (donation.linkedRequests && donation.linkedRequests.includes(requestId)) {
      return res.status(400).json({ message: 'Donation is already assigned to this request' });
    }

    // Validate based on category
    let donationProducts = [];
    let donationMeals = [];
    if (request.category === 'packaged_products') {
      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: 'Products array is required for packaged_products category' });
      }

      const productMap = new Map(
        request.requestedProducts.map((p) => [p.product?._id.toString(), p.quantity])
      );

      donationProducts = products.map(({ product, quantity }) => {
        if (!product || !mongoose.Types.ObjectId.isValid(product)) {
          throw new Error(`Invalid product ID: ${product}`);
        }
        if (!productMap.has(product)) {
          throw new Error(`Product ${product} not found in request`);
        }
        const maxQty = productMap.get(product);
        if (typeof quantity !== 'number' || quantity < 0) {
          throw new Error(`Invalid quantity for product ${product}: ${quantity}`);
        }
        return {
          product,
          quantity: Math.min(quantity, maxQty),
        };
      });

      donation.products = donationProducts;
    } else if (request.category === 'prepared_meals') {
      if (!meals || !Array.isArray(meals) || meals.length === 0) {
        return res.status(400).json({ message: 'Meals array is required for prepared_meals category' });
      }

      if (typeof numberOfMeals !== 'number' || numberOfMeals <= 0) {
        return res.status(400).json({ message: 'numberOfMeals must be a positive number for prepared_meals category' });
      }

      for (const meal of meals) {
        if (!meal.mealName || typeof meal.mealName !== 'string' || meal.mealName.trim() === '') {
          return res.status(400).json({ message: 'Each meal must have a valid mealName' });
        }
        if (!meal.mealDescription || typeof meal.mealDescription !== 'string' || meal.mealDescription.trim() === '') {
          return res.status(400).json({ message: 'Each meal must have a valid mealDescription' });
        }
        if (!meal.mealType || typeof meal.mealType !== 'string' || meal.mealType.trim() === '') {
          return res.status(400).json({ message: 'Each meal must have a valid mealType' });
        }
        if (typeof meal.quantity !== 'number' || meal.quantity < 1) {
          return res.status(400).json({ message: `Invalid quantity for meal ${meal.mealName}: ${meal.quantity}` });
        }
      }

      donationMeals = [];
      for (const meal of meals) {
        let mealDoc = await Meals.findOne({
          mealName: meal.mealName,
          mealType: meal.mealType,
        });

        if (!mealDoc) {
          const counter = await Counter.findOneAndUpdate(
            { _id: 'MealId' },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
          );

          mealDoc = new Meals({
            id: counter.seq.toString(),
            mealName: meal.mealName,
            mealDescription: meal.mealDescription,
            mealType: meal.mealType,
            quantity: Number(meal.quantity),
          });
          await mealDoc.save();
        }

        donationMeals.push({
          meal: mealDoc._id,
          quantity: Number(meal.quantity),
        });
      }

      const totalMeals = donationMeals.reduce((sum, m) => sum + m.quantity, 0);
      if (totalMeals !== numberOfMeals) {
        return res.status(400).json({
          message: `Total quantity of meals (${totalMeals}) must match numberOfMeals (${numberOfMeals})`,
        });
      }

      donation.meals = donationMeals;
      donation.numberOfMeals = numberOfMeals;
    } else {
      return res.status(400).json({ message: 'Invalid request category' });
    }

    // Update Donation
    if (!donation.linkedRequests) {
      donation.linkedRequests = [];
    }
    donation.linkedRequests.push(requestId);

    if (expirationDate) {
      donation.expirationDate = expirationDate;
    }

    // Calculate total quantity allocated across all linked requests
    let totalAllocated = 0;
    for (const linkedRequestId of donation.linkedRequests) {
      const linkedRequest = await RequestNeed.findById(linkedRequestId);
      if (linkedRequest) {
        const fulfilledForThisRequest = linkedRequest.linkedDonation
          .filter((d) => d.toString() === donationId)
          .length > 0
          ? fulfilledItems.reduce((sum, item) => sum + item.quantity, 0)
          : 0;
        totalAllocated += fulfilledForThisRequest;
      }
    }

    // Calculate total available quantity in the donation
    const totalAvailable = donation.category === 'packaged_products'
      ? donation.products.reduce((sum, p) => sum + p.quantity, 0)
      : donation.numberOfMeals || 0;

    // Update donation status
    donation.status = totalAllocated >= totalAvailable ? 'fulfilled' : 'partially_fulfilled';

    await donation.save();

    // Update Request's linkedDonation Field
    if (!request.linkedDonation) {
      request.linkedDonation = [];
    }
    if (!request.linkedDonation.includes(donationId)) {
      request.linkedDonation.push(donationId);
    }

    // Calculate and update request status based on fulfilled items
    const totalFulfilledForRequest = fulfilledItems.reduce((total, item) => total + item.quantity, 0);
    request.status = totalFulfilledForRequest >= request.numberOfMeals ? 'fulfilled' : 'partially_fulfilled';

    await request.save();

    // Send Notification Email
    const recipient = request.recipient;
    if (recipient && recipient.email) {
      const populatedDonation = await Donation.findById(donationId)
        .populate('donor')
        .populate('meals.meal')
        .populate('products.product');

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      const productList = populatedDonation.products?.length > 0
        ? populatedDonation.products
            .map((p) => `${p.product?.name || 'Unknown Product'} (Quantity: ${p.quantity || 0})`)
            .join(', ')
        : 'None';
      const mealList = populatedDonation.meals?.length > 0
        ? populatedDonation.meals
            .map((m) => `${m.meal?.mealName || 'Unknown Meal'} (Type: ${m.meal?.mealType || 'Unknown Type'}, Quantity: ${m.quantity || 0})`)
            .join(', ')
        : 'None';

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient.email,
        subject: `Donation Assigned to Your Request: ${request.title}`,
        text: `Dear ${recipient.name || 'Recipient'},

A donation has been assigned to your request titled "${request.title}".

Donation Details:
- Title: ${populatedDonation.title}
- Donor: ${populatedDonation.donor?.name || 'Unknown Donor'}
${request.category === 'packaged_products' ? `- Products: ${productList}` : `- Meals: ${mealList}`}
- Expiration Date: ${populatedDonation.expirationDate ? new Date(populatedDonation.expirationDate).toLocaleDateString() : 'Not set'}

Thank you for using our platform!

Best regards,
Your Platform Team`,
        html: `
          <div style="font-family: Arial, sans-serif; color: black;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="cid:logo" alt="Platform Logo" style="max-width: 150px; height: auto;" />
            </div>
            <h2 style="color: #228b22;">Donation Assigned to Your Request</h2>
            <p>Dear ${recipient.name || 'Recipient'},</p>
            <p>A donation has been assigned to your request titled "<strong>${request.title}</strong>".</p>
            <h3>Donation Details:</h3>
            <ul>
              <li><strong>Title:</strong> ${populatedDonation.title}</li>
              <li><strong>Donor:</strong> ${populatedDonation.donor?.name || 'Unknown Donor'}</li>
              ${request.category === 'packaged_products' ? `<li><strong>Products:</strong> ${productList}</li>` : `<li><strong>Meals:</strong> ${mealList}</li>`}
              <li><strong>Expiration Date:</strong> ${populatedDonation.expirationDate ? new Date(populatedDonation.expirationDate).toLocaleDateString() : 'Not set'}</li>
            </ul>
            <p>Thank you for using our platform!</p>
            <p style="margin-top: 20px;">Best regards,<br>Your Platform Team</p>
          </div>
        `,
        attachments: [],
      };

      const logoPath = path.join(__dirname, '../Uploads/logo.png');
      if (fs.existsSync(logoPath)) {
        mailOptions.attachments.push({
          filename: 'logo.png',
          path: logoPath,
          cid: 'logo',
        });
      } else {
        console.warn('Logo file not found at:', logoPath);
        mailOptions.html = mailOptions.html.replace(
          '<img src="cid:logo" alt="Platform Logo" style="max-width: 150px; height: auto;" />',
          ''
        );
      }

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${recipient.email}`);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    } else {
      console.warn('Recipient email not found for request:', requestId);
    }

    // Response
    res.status(200).json({
      message: 'Donation assigned to request successfully',
      donation,
    });
  } catch (error) {
    console.error('Donation Assignment Error:', error);
    res.status(500).json({ message: 'Failed to assign donation to request', error: error.message });
  }
}

// ✅ Get request with donations
async function getRequestWithDonations(req, res) {
  try {
    const { requestId } = req.params;

    const request = await RequestNeed.findById(requestId)
      .populate('recipient')
      .populate('requestedProducts.product')
      .populate('requestedMeals.meal')
      .populate('linkedDonation');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    const transactions = await DonationTransaction.find({ requestNeed: requestId })
      .populate('donation')
      .populate('allocatedProducts.product')
      .populate('allocatedMeals.meal')
      .populate('donor');

    res.status(200).json({
      request,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
}

// ✅ Get requests by donation ID
async function getRequestsByDonationId(req, res) {
  try {
    const { donationId } = req.params;
    console.log(`Fetching requests for donationId: ${donationId}`);

    if (!mongoose.Types.ObjectId.isValid(donationId)) {
      return res.status(400).json({ message: 'Invalid donation ID' });
    }

    const requests = await RequestNeed.find({
      $or: [{ linkedDonation: donationId }, { linkedDonation: { $in: [donationId] } }],
    })
      .populate('recipient')
      .populate('requestedProducts.product')
      .populate('requestedMeals.meal');

    console.log(`Found ${requests.length} requests for donationId: ${donationId}`);
    if (!requests.length) {
      return res.status(404).json({ message: 'No requests found for this donation' });
    }

    const cleanedRequests = requests.map((request) => {
      const requestObj = request.toObject();

      if (!requestObj.recipient) {
        console.warn(`Recipient not found for request ${requestObj._id}`);
        requestObj.recipient = { firstName: 'Unknown', lastName: '', role: 'N/A' };
      }

      if (requestObj.category === 'packaged_products') {
        requestObj.requestedProducts = requestObj.requestedProducts?.map((item) => {
          if (!item.product) {
            console.warn(`Product not found for requestedProduct in request ${requestObj._id}`);
            return {
              product: { name: 'N/A', productType: 'N/A', weightPerUnit: 0, weightUnit: 'N/A' },
              quantity: item.quantity || 0,
            };
          }
          return item;
        }) || [];
      }

      if (requestObj.category === 'prepared_meals') {
        requestObj.requestedMeals = requestObj.requestedMeals?.map((item) => {
          if (!item.meal) {
            console.warn(`Meal not found for requestedMeal in request ${requestObj._id}`);
            return {
              meal: { mealName: 'N/A', mealType: 'N/A', mealDescription: 'N/A' },
              quantity: item.quantity || 0,
            };
          }
          return item;
        }) || [];
      }

      return requestObj;
    });

    res.status(200).json(cleanedRequests);
  } catch (error) {
    console.error('Error in getRequestsByDonationId:', error.message, error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// ✅ Reject request
async function rejectRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;

    const request = await RequestNeed.findById(requestId).populate('recipient');
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        message: `Request cannot be rejected in its current state (${request.status})`,
      });
    }

    request.status = 'rejected';
    request.rejectionReason = reason || 'No reason provided';
    await request.save();

    const recipient = request.recipient;
    if (recipient && recipient.email) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: { rejectUnauthorized: false },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient.email,
        subject: `Your Request "${request.title}" Has Been Rejected`,
        text: `Dear ${recipient.name || 'Recipient'},

We regret to inform you that your request titled "${request.title}" has been rejected.

Details:
- Request Title: ${request.title}
- Rejection Reason: ${reason || 'No reason provided'}

If you have any questions, please contact our support team.

Best regards,
Your Platform Team`,
        html: `
          <div style="font-family: Arial, sans-serif; color: black;">
            <h2 style="color: #dc3545;">Your Request Has Been Rejected</h2>
            <p>Dear ${recipient.name || 'Recipient'},</p>
            <p>We regret to inform you that your request titled "<strong>${request.title}</strong>" has been rejected.</p>
            <h3>Details:</h3>
            <ul>
              <li><strong>Request Title:</strong> ${request.title}</li>
              <li><strong>Rejection Reason:</strong> ${reason || 'No reason provided'}</li>
            </ul>
            <p>If you have any questions, please contact our support team.</p>
            <p style="margin-top: 20px;">Best regards,<br>Your Platform Team</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${recipient.email}`);
    }

    res.status(200).json({
      message: 'Request rejected successfully',
      request,
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({
      message: 'Failed to reject request',
      error: error.message,
    });
  }
}

module.exports = {
  addDonationToRequest,
  getAllRequests,
  getRequestById,
  getRequestsByRecipientId,
  getRequestsByStatus,
  createRequest,
  updateRequest,
  deleteRequest,
  createRequestNeedForExistingDonation,
  getRequestWithDonations,
  getRequestsByDonationId,
  UpdateAddDonationToRequest,
  rejectRequest,
  getAllRequestsbackoffice,
};