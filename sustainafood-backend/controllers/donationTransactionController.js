// donationTransactionController.js
const DonationTransaction = require('../models/DonationTransaction');
const RequestNeed = require('../models/RequestNeed');
const Donation = require('../models/Donation');
const Product = require('../models/Product');
const Meal = require('../models/Meals');
const User = require('../models/User');
const Delivery = require('../models/Delivery');
const nodemailer = require('nodemailer');
const path = require('path');
const { createNotification } = require('./notificationController');
const mongoose = require("mongoose");

// Function to send email notifications
async function sendEmail(to, subject, text, html, attachments = []) {
  try {
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
      to,
      subject,
      text,
      html,
      attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

async function getAllDonationTransactions(req, res) {
  try {
    const transactions = await DonationTransaction.find()
      .populate('requestNeed')
      .populate('donation')
      .populate('allocatedProducts.product')
      .populate('allocatedMeals.meal');
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

async function getDonationTransactionById(req, res) {
  try {
    const { id } = req.params;
    const transaction = await DonationTransaction.findById(id)
      .populate('requestNeed')
      .populate('donation')
      .populate('allocatedProducts.product')
      .populate('allocatedMeals.meal')
      .populate('donor')
      .populate('recipient');

    if (!transaction) {
      return res.status(404).json({ message: 'Donation transaction not found' });
    }

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

async function getDonationTransactionsByRequestNeedId(req, res) {
  try {
    const { requestNeedId } = req.params;
    const transactions = await DonationTransaction.find({ requestNeed: requestNeedId })
      .populate({
        path: 'donation',
        populate: [
          { path: 'donor' },
          { path: 'meals.meal', model: 'Meals' },
        ],
      })
      .populate('requestNeed')
      .populate('allocatedProducts.product')
      .populate('allocatedMeals.meal');

    if (!transactions.length) {
      return res.status(404).json({ message: 'No transactions found for this request need' });
    }

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

async function getDonationTransactionsByDonationId(req, res) {
  try {
    const { donationId } = req.params;
    const transactions = await DonationTransaction.find({ donation: donationId })
      .populate({
        path: 'donation',
        populate: [
          { path: 'donor' },
          { path: 'meals.meal', model: 'Meals' },
          { path: 'products.product', model: 'Product' },
        ],
      })
      .populate({
        path: 'requestNeed',
        populate: [
          { path: 'recipient' },
          { path: 'requestedProducts.product', model: 'Product' },
          { path: 'requestedMeals.meal', model: 'Meals' },
        ],
      })
      .populate('allocatedProducts.product')
      .populate('allocatedMeals.meal');

    if (!transactions.length) {
      return res.status(404).json({ message: 'No transactions found for this donation' });
    }

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

async function getDonationTransactionsByStatus(req, res) {
  try {
    const { status } = req.params;
    const transactions = await DonationTransaction.find({ status })
      .populate('requestNeed')
      .populate('donation')
      .populate('allocatedProducts.product')
      .populate('allocatedMeals.meal');

    if (!transactions.length) {
      return res.status(404).json({ message: 'No transactions found with this status' });
    }

    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}

async function createDonationTransaction(req, res) {
  try {
    const { requestNeed, donation, allocatedProducts, allocatedMeals, status } = req.body;

    if (!requestNeed || !donation || (!allocatedProducts && !allocatedMeals) || !status) {
      return res.status(400).json({ message: 'RequestNeed, donation, at least one of allocatedProducts or allocatedMeals, and status are required' });
    }

    if (allocatedProducts && (!Array.isArray(allocatedProducts) || !allocatedProducts.length)) {
      return res.status(400).json({ message: 'allocatedProducts must be a non-empty array if provided' });
    }

    if (allocatedMeals && (!Array.isArray(allocatedMeals) || !allocatedMeals.length)) {
      return res.status(400).json({ message: 'allocatedMeals must be a non-empty array if provided' });
    }

    const newTransaction = new DonationTransaction({
      requestNeed,
      donation,
      allocatedProducts: allocatedProducts || [],
      allocatedMeals: allocatedMeals || [],
      status,
    });

    await newTransaction.save();
    res.status(201).json({ message: 'Donation transaction created successfully', newTransaction });
  } catch (error) {
    res.status(400).json({ message: 'Failed to create donation transaction', error });
  }
}

async function updateDonationTransaction(req, res) {
  try {
    const { id } = req.params;
    const { requestNeed, donation, allocatedProducts, allocatedMeals, status } = req.body;

    const updatedTransaction = await DonationTransaction.findByIdAndUpdate(
      id,
      { requestNeed, donation, allocatedProducts, allocatedMeals, status },
      { new: true }
    )
      .populate('requestNeed')
      .populate('donation')
      .populate('allocatedProducts.product')
      .populate('allocatedMeals.meal');

    if (!updatedTransaction) {
      return res.status(404).json({ message: 'Donation transaction not found' });
    }

    res.status(200).json({ message: 'Donation transaction updated successfully', updatedTransaction });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update donation transaction', error });
  }
}

async function deleteDonationTransaction(req, res) {
  try {
    const { id } = req.params;
    const deletedTransaction = await DonationTransaction.findByIdAndDelete(id);

    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Donation transaction not found' });
    }

    res.status(200).json({ message: 'Donation transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete donation transaction', error });
  }
}

async function acceptDonationTransaction(req, res) {
    try {
      const { transactionId } = req.params;
  
      // Validate transactionId
      if (!mongoose.Types.ObjectId.isValid(transactionId)) {
        return res.status(400).json({ message: 'Invalid transaction ID' });
      }
  
      // Fetch transaction with populated references
      const transaction = await DonationTransaction.findById(transactionId)
        .populate('requestNeed')
        .populate('donation')
        .populate('allocatedProducts.product')
        .populate('allocatedMeals.meal');
  
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      if (transaction.status !== 'pending') {
        return res.status(400).json({ message: `Transaction cannot be accepted in its current state (${transaction.status})` });
      }
  
      const donation = transaction.donation;
      const requestNeed = transaction.requestNeed;
  
      // Update donation quantities
      if (donation.category === 'packaged_products') {
        for (const allocatedProduct of transaction.allocatedProducts) {
          const donationProduct = donation.products.find(p => p.product.toString() === allocatedProduct.product._id.toString());
          if (donationProduct) {
            donationProduct.quantity -= allocatedProduct.quantity;
            if (donationProduct.quantity < 0) donationProduct.quantity = 0;
          }
        }
  
        const remainingProducts = donation.products.reduce((sum, p) => sum + p.quantity, 0);
        donation.status = remainingProducts === 0 ? 'fulfilled' : 'partially_fulfilled';
      }
  
      if (donation.category === 'prepared_meals') {
        let totalAllocatedMeals = 0;
        for (const allocatedMeal of transaction.allocatedMeals) {
          const donationMeal = donation.meals.find(m => m.meal.toString() === allocatedMeal.meal._id.toString());
          if (donationMeal) {
            donationMeal.quantity -= allocatedMeal.quantity;
            if (donationMeal.quantity < 0) donationMeal.quantity = 0;
            totalAllocatedMeals += allocatedMeal.quantity;
          }
        }
  
        donation.remainingMeals = (donation.remainingMeals || donation.numberOfMeals) - totalAllocatedMeals;
        if (donation.remainingMeals < 0) donation.remainingMeals = 0;
        donation.status = donation.remainingMeals === 0 ? 'fulfilled' : 'partially_fulfilled';
  
        requestNeed.numberOfMeals -= totalAllocatedMeals;
        if (requestNeed.numberOfMeals < 0) requestNeed.numberOfMeals = 0;
        requestNeed.status = requestNeed.numberOfMeals === 0 ? 'fulfilled' : 'partially_fulfilled';
      }
  
      // Save updated donation and requestNeed
      await donation.save();
      await requestNeed.save();
  
      // Update transaction status
      transaction.status = 'approved';
      transaction.responseDate = new Date();
      await transaction.save();
  
      // Find available transporter
      const availableTransporters = await User.find({
        role: 'transporter',
        isAvailable: true,
        isActive: true,
        isBlocked: false,
      }).select('_id name email location');
  
      let selectedTransporter = null;
      if (availableTransporters.length === 0) {
        console.warn('No available transporters found. Delivery will be created without a transporter.');
      } else {
        // Basic selection: First available transporter
        selectedTransporter = availableTransporters[0];
  
        // Optional: Select nearest transporter using geospatial query
        if (donation.location && donation.location.type === 'Point') {
          try {
            const nearestTransporter = await User.find({
              role: 'transporter',
              isAvailable: true,
              isActive: true,
              isBlocked: false,
              location: {
                $near: {
                  $geometry: donation.location,
                  $maxDistance: 10000, // 10km in meters
                },
              },
            })
              .select('_id name email location')
              .limit(1);
  
            selectedTransporter = nearestTransporter[0] || availableTransporters[0];
          } catch (geoError) {
            console.error('Geospatial query failed:', geoError.message);
            // Fallback to first available transporter
          }
        }
      }
  
      // Create delivery
      const delivery = new Delivery({
        donationTransaction: transaction._id,
        transporter: selectedTransporter ? selectedTransporter._id : null,
        pickupAddress: donation.address,
        deliveryAddress: requestNeed.address,
        status: 'pending',
      });
      await delivery.save();
  
      // Notify recipient
      const recipient = await User.findById(transaction.recipient).select('_id name email');
      await createNotification({
        body: {
          sender: transaction.donor,
          receiver: transaction.recipient,
          message: `A delivery has been created for your request "${requestNeed.title}". Status: Pending.`,
        },
      }, { status: () => ({ json: () => {} }) });
  
      // Notify donor
      await createNotification({
        body: {
          sender: transaction.recipient,
          receiver: transaction.donor,
          message: `A delivery has been created for your donation "${donation.title}". Status: Pending.`,
        },
      }, { status: () => ({ json: () => {} }) });
  
      // Notify transporter (if assigned)
      if (selectedTransporter) {
        await createNotification({
          body: {
            sender: transaction.donor,
            receiver: selectedTransporter._id,
            message: `You have been assigned to a delivery for the donation "${donation.title}". Pickup address: ${donation.address}. Status: Pending.`,
          },
        }, { status: () => ({ json: () => {} }) });
  
        // Send email to transporter
        if (selectedTransporter.email) {
          const transporterEmail = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
            tls: { rejectUnauthorized: false },
          });
  
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: selectedTransporter.email,
            subject: `New Delivery Assigned: ${donation.title}`,
            text: `Dear ${selectedTransporter.name || 'Transporter'},
  
  You have been assigned to a delivery for the donation "${donation.title}".
  
  Details:
  - Donation Title: ${donation.title}
  - Pickup Address: ${donation.address}
  - Delivery Address: ${requestNeed.address}
  - Delivery Status: Pending
  
  Thank you for using our platform!
  
  Best regards,
  The Platform Team`,
            html: `
              <div style="font-family: Arial, sans-serif; color: black;">
                <h2 style="color: #228b22;">New Delivery Assigned</h2>
                <p>Dear ${selectedTransporter.name || 'Transporter'},</p>
                <p>You have been assigned to a delivery for the donation "<strong>${donation.title}</strong>".</p>
                <h3>Details:</h3>
                <ul>
                  <li><strong>Donation Title:</strong> ${donation.title}</li>
                  <li><strong>Pickup Address:</strong> ${donation.address}</li>
                  <li><strong>Delivery Address:</strong> ${requestNeed.address}</li>
                  <li><strong>Delivery Status:</strong> Pending</li>
                </ul>
                <p>Thank you for using our platform!</p>
                <p style="margin-top: 20px;">Best regards,<br>The Platform Team</p>
              </div>
            `,
          };
  
          await transporterEmail.sendMail(mailOptions);
          console.log(`Email sent to ${selectedTransporter.email}`);
        }
      }
  
      // Send email to recipient
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
          subject: `Your Request "${requestNeed.title}" Has Been Accepted and Delivery Is Scheduled`,
          text: `Dear ${recipient.name || 'User'},
  
  Your request titled "${requestNeed.title}" has been accepted and a delivery is scheduled.
  
  Details:
  - Donation Title: ${donation.title}
  - Request Status: ${requestNeed.status}
  - Delivery Status: Pending
  ${selectedTransporter ? `- Assigned Transporter: ${selectedTransporter.name}` : '- Transporter: Pending Assignment'}
  
  Thank you for using our platform!
  
  Best regards,
  The Platform Team`,
          html: `
            <div style="font-family: Arial, sans-serif; color: black;">
              <h2 style="color: #228b22;">Your Request Has Been Accepted</h2>
              <p>Dear ${recipient.name || 'User'},</p>
              <p>Your request titled "<strong>${requestNeed.title}</strong>" has been accepted and a delivery is scheduled.</p>
              <h3>Details:</h3>
              <ul>
                <li><strong>Donation Title:</strong> ${donation.title}</li>
                <li><strong>Request Status:</strong> ${requestNeed.status}</li>
                <li><strong>Delivery Status:</strong> Pending</li>
                ${selectedTransporter ? `<li><strong>Assigned Transporter:</strong> ${selectedTransporter.name}</li>` : '<li><strong>Transporter:</strong> Pending Assignment</li>'}
              </ul>
              <p>Thank you for using our platform!</p>
              <p style="margin-top: 20px;">Best regards,<br>The Platform Team</p>
            </div>
          `,
        };
  
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${recipient.email}`);
      }
  
      res.status(200).json({
        message: 'Donation accepted and delivery created successfully',
        transaction,
        delivery,
        transporter: selectedTransporter ? { _id: selectedTransporter._id, name: selectedTransporter.name } : null,
      });
    } catch (error) {
      console.error('Error accepting donation transaction:', error);
      res.status(500).json({ message: 'Failed to accept donation', error: error.message });
    }
  }



 
async function createAndAcceptDonationTransaction(req, res) {
    try {
      const { donationId, requestNeedId, allocatedProducts = [], allocatedMeals = [] } = req.body;
      const user = req.user;
  
      // Validate inputs
      if (!donationId || !requestNeedId) {
        return res.status(400).json({ message: 'donationId and requestNeedId are required' });
      }
      if (!mongoose.Types.ObjectId.isValid(donationId) || !mongoose.Types.ObjectId.isValid(requestNeedId)) {
        return res.status(400).json({ message: 'Invalid donationId or requestNeedId' });
      }
  
      // Fetch transaction with populated references
      const transaction = await DonationTransaction.findOne({
        donation: donationId,
        requestNeed: requestNeedId,
        status: 'pending',
      })
        .populate({
          path: 'donation',
          populate: [
            { path: 'donor' },
            { path: 'meals.meal', model: 'Meals' },
            { path: 'products.product', model: 'Product' },
          ],
        })
        .populate({
          path: 'requestNeed',
          populate: [
            { path: 'recipient' },
            { path: 'requestedProducts.product', model: 'Product' },
            { path: 'requestedMeals.meal', model: 'Meals' },
          ],
        })
        .populate('allocatedProducts.product')
        .populate('allocatedMeals.meal');
  
      if (!transaction) {
        return res.status(404).json({ message: 'Pending transaction not found for this donation and request' });
      }
  
      const donation = transaction.donation;
      const requestNeed = transaction.requestNeed;
  
      // Validate category match
      if (donation.category !== requestNeed.category) {
        return res.status(400).json({
          message: `Donation and request categories do not match (donation: ${donation.category}, request: ${requestNeed.category})`,
        });
      }
  
      // Validate allocations based on category
      if (donation.category === 'packaged_products' && allocatedMeals.length > 0) {
        return res.status(400).json({
          message: 'allocatedMeals must be empty for packaged_products donations',
        });
      }
      if (donation.category === 'prepared_meals' && allocatedProducts.length > 0) {
        return res.status(400).json({
          message: 'allocatedProducts must be empty for prepared_meals donations',
        });
      }
  
      let isFullyFulfilled = false;
      let finalAllocatedProducts = [];
      let finalAllocatedMeals = [];
  
      // Set allocations based on category
      if (donation.category === 'packaged_products') {
        finalAllocatedProducts = allocatedProducts.length ? allocatedProducts : transaction.allocatedProducts;
        finalAllocatedMeals = []; // Ignore allocatedMeals
      } else if (donation.category === 'prepared_meals') {
        finalAllocatedMeals = allocatedMeals.length ? allocatedMeals : transaction.allocatedMeals;
        finalAllocatedProducts = []; // Ignore allocatedProducts
      }
  
      // Handle prepared meals
      if (donation.category === 'prepared_meals') {
        if (!finalAllocatedMeals.length) {
          return res.status(400).json({ message: 'No meals allocated for this request' });
        }
  
        let totalAllocated = 0;
        for (const allocated of finalAllocatedMeals) {
          const donationMeal = donation.meals.find((m) =>
            m.meal && allocated.meal && m.meal._id.toString() === allocated.meal._id.toString()
          );
          if (!donationMeal) {
            console.error('Meal not found in donation:', {
              allocatedMeal: allocated,
              donationMeals: donation.meals,
            });
            return res.status(400).json({
              message: `Meal ${allocated.meal?._id || allocated.meal} not found in donation`,
            });
          }
          if (allocated.quantity > donationMeal.quantity) {
            return res.status(400).json({
              message: `Requested quantity (${allocated.quantity}) exceeds available quantity (${donationMeal.quantity}) for meal ${allocated.meal._id}`,
            });
          }
          donationMeal.quantity -= allocated.quantity;
          totalAllocated += allocated.quantity;
        }
  
        donation.meals = donation.meals.filter((m) => m.quantity > 0);
  
        donation.remainingMeals = (donation.remainingMeals || donation.numberOfMeals) - totalAllocated;
        if (donation.remainingMeals < 0) donation.remainingMeals = 0;
        isFullyFulfilled = donation.remainingMeals === 0;
        donation.status = isFullyFulfilled ? 'fulfilled' : 'partially_fulfilled';
  
        requestNeed.numberOfMeals = (requestNeed.numberOfMeals || 0) - totalAllocated;
        if (requestNeed.numberOfMeals < 0) requestNeed.numberOfMeals = 0;
        requestNeed.status = requestNeed.numberOfMeals === 0 ? 'fulfilled' : 'partially_fulfilled';
  
        // Ensure donation.numberOfMeals is not negative
        donation.numberOfMeals = (donation.numberOfMeals || 0) - totalAllocated;
        if (donation.numberOfMeals < 0) donation.numberOfMeals = 0;
      }
  
      // Handle packaged products
      if (donation.category === 'packaged_products') {
        if (!finalAllocatedProducts.length) {
          return res.status(400).json({ message: 'No products allocated for this request' });
        }
  
        for (const allocated of finalAllocatedProducts) {
          const donationProduct = donation.products.find((p) =>
            p.product && allocated.product && p.product._id.toString() === allocated.product._id.toString()
          );
          if (!donationProduct) {
            console.error('Product not found in donation:', {
              allocatedProduct: allocated,
              donationProducts: donation.products,
            });
            return res.status(400).json({
              message: `Product ${allocated.product?._id || allocated.product} not found in donation`,
            });
          }
          if (allocated.quantity > donationProduct.quantity) {
            return res.status(400).json({
              message: `Requested quantity (${allocated.quantity}) exceeds available quantity (${donationProduct.quantity}) for product ${allocated.product._id}`,
            });
          }
          donationProduct.quantity -= allocated.quantity;
  
          const requestProduct = requestNeed.requestedProducts.find((rp) =>
            rp.product && allocated.product && rp.product._id.toString() === allocated.product._id.toString()
          );
          if (requestProduct) {
            requestProduct.quantity -= allocated.quantity;
            if (requestProduct.quantity < 0) requestProduct.quantity = 0;
          }
        }
  
        donation.products = donation.products.filter((p) => p.quantity > 0);
        const remainingProducts = donation.products.reduce((sum, p) => sum + p.quantity, 0);
        isFullyFulfilled = remainingProducts === 0;
        donation.status = isFullyFulfilled ? 'fulfilled' : 'partially_fulfilled';
  
        // Ensure numberOfMeals is not modified for packaged_products
        donation.numberOfMeals = donation.numberOfMeals || 0;
        requestNeed.numberOfMeals = requestNeed.numberOfMeals || 0;
        const remainingRequestProducts = requestNeed.requestedProducts.reduce(
          (sum, rp) => sum + rp.quantity,
          0
        );
        requestNeed.status = remainingRequestProducts === 0 ? 'fulfilled' : 'partially_fulfilled';
      }
  
      // Log donation state before saving
      console.log('Donation before save:', {
        numberOfMeals: donation.numberOfMeals,
        remainingMeals: donation.remainingMeals,
        category: donation.category,
        products: donation.products,
        meals: donation.meals,
      });
  
      // Save updates
      await donation.save();
      await requestNeed.save();
  
      // Update transaction
      transaction.status = 'approved';
      transaction.responseDate = new Date();
      transaction.allocatedProducts = finalAllocatedProducts;
      transaction.allocatedMeals = finalAllocatedMeals;
      await transaction.save();
  
      // Find available transporter
      const availableTransporters = await User.find({
        role: 'transporter',
        isAvailable: true,
        isActive: true,
        isBlocked: false,
      }).select('_id name email location');
  
      let selectedTransporter = null;
      if (availableTransporters.length === 0) {
        console.warn('No available transporters found. Delivery will be created without a transporter.');
      } else {
        // Basic selection: First available transporter
        selectedTransporter = availableTransporters[0];
  
        // Optional: Select nearest transporter using geospatial query
        if (donation.location && donation.location.type === 'Point') {
          try {
            const nearestTransporter = await User.find({
              role: 'transporter',
              isAvailable: true,
              isActive: true,
              isBlocked: false,
              location: {
                $near: {
                  $geometry: donation.location,
                  $maxDistance: 10000, // 10km in meters
                },
              },
            })
              .select('_id name email location')
              .limit(1);
  
            selectedTransporter = nearestTransporter[0] || availableTransporters[0];
          } catch (geoError) {
            console.error('Geospatial query failed:', geoError.message);
            // Fallback to first available transporter
          }
        }
      }
  
      // Create delivery
      const delivery = new Delivery({
        donationTransaction: transaction._id,
        transporter: selectedTransporter ? selectedTransporter._id : null,
        pickupCoordinates: donation.location,
        deliveryCoordinates: requestNeed.location,
        pickupAddress: donation.address,
        deliveryAddress: requestNeed.address,
        status: null,
      });
      await delivery.save();
  
      // Notify recipient
      const recipient = await User.findById(requestNeed.recipient).select('_id name email');
      await createNotification({
        body: {
          sender: transaction.donor,
          receiver: transaction.recipient,
          message: `A delivery has been created for your request "${requestNeed.title}". Status: Pending.`,
        },
      }, { status: () => ({ json: () => {} }) });
  
      // Notify donor
      await createNotification({
        body: {
          sender: transaction.recipient,
          receiver: transaction.donor,
          message: `A delivery has been created for your donation "${donation.title}". Status: Pending.`,
        },
      }, { status: () => ({ json: () => {} }) });
  
      // Notify transporter (if assigned)
      if (selectedTransporter) {
        await createNotification({
          body: {
            sender: transaction.donor,
            receiver: selectedTransporter._id,
            message: `You have been assigned to a delivery for the donation "${donation.title}". Pickup address: ${donation.address}. Status: Pending.`,
          },
        }, { status: () => ({ json: () => {} }) });
      }
  
      // Send email to donor
      if (donation.donor && donation.donor.email) {
        let allocatedItemsText = '';
        if (donation.category === 'prepared_meals') {
          allocatedItemsText = finalAllocatedMeals
            .map((am) => {
              const meal = donation.meals.find((m) =>
                m.meal && am.meal && m.meal._id.toString() === am.meal._id.toString()
              )?.meal;
              return `${meal?.mealName || 'Unknown Meal'} (Quantity: ${am.quantity})`;
            })
            .join(', ');
        } else if (donation.category === 'packaged_products') {
          allocatedItemsText = finalAllocatedProducts
            .map((ap) => {
              const product = donation.products.find((p) =>
                p.product && ap.product && p.product._id.toString() === ap.product._id.toString()
              )?.product;
              return `${product?.name || 'Unknown Product'} (Quantity: ${ap.quantity})`;
            })
            .join(', ');
        }
  
        const subject = `Your Donation "${donation.title}" Has Been Accepted`;
        const text = `Dear ${donation.donor.name || 'Donor'},
  
  Your donation titled "${donation.title}" has been accepted.
  
  Donation Details:
  - Title: ${donation.title}
  - Request: ${requestNeed.title}
  - Allocated Items: ${allocatedItemsText}
  - Accepted On: ${new Date().toLocaleDateString()}
  - Status: ${donation.status}
  - Delivery Status: Pending
  ${selectedTransporter ? `- Assigned Transporter: ${selectedTransporter.name}` : '- Transporter: Pending Assignment'}
  
  Thank you for your generosity!
  
  Best regards,
  The Platform Team`;
  
        const html = `
          <div style="font-family: Arial, sans-serif; color: black;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="cid:logo" alt="Platform Logo" style="max-width: 150px; height: auto;" />
            </div>
            <h2 style="color: #228b22;">Your Donation Has Been Accepted</h2>
            <p>Dear ${donation.donor.name || 'Donor'},</p>
            <p>Your donation titled "<strong>${donation.title}</strong>" has been accepted.</p>
            <h3>Donation Details:</h3>
            <ul>
              <li><strong>Title:</strong> ${donation.title}</li>
              <li><strong>Request:</strong> ${requestNeed.title}</li>
              <li><strong>Allocated Items:</strong> ${allocatedItemsText}</li>
              <li><strong>Accepted On:</strong> ${new Date().toLocaleDateString()}</li>
              <li><strong>Status:</strong> ${donation.status}</li>
              <li><strong>Delivery Status:</strong> Pending</li>
              ${selectedTransporter ? `<li><strong>Assigned Transporter:</strong> ${selectedTransporter.name}</li>` : '<li><strong>Transporter:</strong> Pending Assignment</li>'}
            </ul>
            <p>Thank you for your generosity!</p>
            <p style="margin-top: 20px;">Best regards,<br>The Platform Team</p>
          </div>
        `;
  
        const attachments = [
          {
            filename: 'logo.png',
            path: path.join(__dirname, '../Uploads/logo.png'),
            cid: 'logo',
          },
        ];
  
        await sendEmail(donation.donor.email, subject, text, html, attachments);
        console.log(`Email sent to ${donation.donor.email}`);
      }
  
      // Send email to recipient
      if (recipient && recipient.email) {
        const subject = `Your Request "${requestNeed.title}" Has Been Fulfilled`;
        const text = `Dear ${recipient.name || 'User'},
  
  Your request titled "${requestNeed.title}" has been fulfilled.
  
  Details:
  - Donation Title: ${donation.title}
  - Request Status: ${requestNeed.status}
  - Delivery Status: Pending
  ${selectedTransporter ? `- Assigned Transporter: ${selectedTransporter.name}` : '- Transporter: Pending Assignment'}
  
  Thank you for using our platform!
  
  Best regards,
  The Platform Team`;
  
        const html = `
          <div style="font-family: Arial, sans-serif; color: black;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="cid:logo" alt="Platform Logo" style="max-width: 150px; height: auto;" />
            </div>
            <h2 style="color: #228b22;">Your Request Has Been Fulfilled</h2>
            <p>Dear ${recipient.name || 'User'},</p>
            <p>Your request titled "<strong>${requestNeed.title}</strong>" has been fulfilled.</p>
            <h3>Details:</h3>
            <ul>
              <li><strong>Donation Title:</strong> ${donation.title}</li>
              <li><strong>Request Status:</strong> ${requestNeed.status}</li>
              <li><strong>Delivery Status:</strong> Pending</li>
              ${selectedTransporter ? `<li><strong>Assigned Transporter:</strong> ${selectedTransporter.name}</li>` : '<li><strong>Transporter:</strong> Pending Assignment</li>'}
            </ul>
            <p>Thank you for using our platform!</p>
            <p style="margin-top: 20px;">Best regards,<br>The Platform Team</p>
          </div>
        `;
  
        const attachments = [
          {
            filename: 'logo.png',
            path: path.join(__dirname, '../Uploads/logo.png'),
            cid: 'logo',
          },
        ];
  
        await sendEmail(recipient.email, subject, text, html, attachments);
        console.log(`Email sent to ${recipient.email}`);
      }
  
      // Send email to transporter (if assigned)
      if (selectedTransporter && selectedTransporter.email) {
        const subject = `New Delivery Assigned: ${donation.title}`;
        const text = `Dear ${selectedTransporter.name || 'Transporter'},
  
  You have been assigned to a delivery for the donation "${donation.title}".
  
  Details:
  - Donation Title: ${donation.title}
  - Pickup Address: ${donation.address}
  - Delivery Address: ${requestNeed.address}
  - Delivery Status: Pending
  
  Thank you for using our platform!
  
  Best regards,
  The Platform Team`;
  
        const html = `
          <div style="font-family: Arial, sans-serif; color: black;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="cid:logo" alt="Platform Logo" style="max-width: 150px; height: auto;" />
            </div>
            <h2 style="color: #228b22;">New Delivery Assigned</h2>
            <p>Dear ${selectedTransporter.name || 'Transporter'},</p>
            <p>You have been assigned to a delivery for the donation "<strong>${donation.title}</strong>".</p>
            <h3>Details:</h3>
            <ul>
              <li><strong>Donation Title:</strong> ${donation.title}</li>
              <li><strong>Pickup Address:</strong> ${donation.address}</li>
              <li><strong>Delivery Address:</strong> ${requestNeed.address}</li>
              <li><strong>Delivery Status:</strong> Pending</li>
            </ul>
            <p>Thank you for using our platform!</p>
            <p style="margin-top: 20px;">Best regards,<br>The Platform Team</p>
          </div>
        `;
  
        const attachments = [
          {
            filename: 'logo.png',
            path: path.join(__dirname, '../Uploads/logo.png'),
            cid: 'logo',
          },
        ];
  
        await sendEmail(selectedTransporter.email, subject, text, html, attachments);
        console.log(`Email sent to ${selectedTransporter.email}`);
      }
  
      res.status(200).json({
        message: 'Transaction accepted successfully',
        donation,
        request: requestNeed,
        transaction,
        delivery,
        transporter: selectedTransporter ? { _id: selectedTransporter._id, name: selectedTransporter.name } : null,
      });
    } catch (error) {
      console.error('Error accepting transaction:', error);
      res.status(500).json({
        message: 'Failed to accept transaction',
        error: error.message,
      });
    }
  }
  

  async function createAndAcceptDonationTransactionBiderc(req, res) {
    try {
      const { donationId, requestNeedId, allocatedProducts = [], allocatedMeals = [] } = req.body;
      const user = req.user;
  
      // Validate inputs
      if (!donationId || !requestNeedId) {
        return res.status(400).json({ message: 'donationId and requestNeedId are required' });
      }
      if (!mongoose.Types.ObjectId.isValid(donationId) || !mongoose.Types.ObjectId.isValid(requestNeedId)) {
        return res.status(400).json({ message: 'Invalid donationId or requestNeedId' });
      }
  
      // Fetch transaction with populated references
      const transaction = await DonationTransaction.findOne({
        donation: donationId,
        requestNeed: requestNeedId,
        status: 'pending',
      })
        .populate({
          path: 'donation',
          populate: [
            { path: 'donor' },
            { path: 'meals.meal', model: 'Meals' },
            { path: 'products.product', model: 'Product' },
          ],
        })
        .populate({
          path: 'requestNeed',
          populate: [
            { path: 'recipient' },
            { path: 'requestedProducts.product', model: 'Product' },
            { path: 'requestedMeals.meal', model: 'Meals' },
          ],
        })
        .populate('allocatedProducts.product')
        .populate('allocatedMeals.meal');
  
      if (!transaction) {
        return res.status(404).json({ message: 'Pending transaction not found for this donation and request' });
      }
  
      const donation = transaction.donation;
      const requestNeed = transaction.requestNeed;
  
      // Validate category match
      if (donation.category !== requestNeed.category) {
        return res.status(400).json({
          message: `Donation and request categories do not match (donation: ${donation.category}, request: ${requestNeed.category})`,
        });
      }
  
      // Validate allocations based on category
      if (donation.category === 'packaged_products' && allocatedMeals.length > 0) {
        return res.status(400).json({
          message: 'allocatedMeals must be empty for packaged_products donations',
        });
      }
      if (donation.category === 'prepared_meals' && allocatedProducts.length > 0) {
        return res.status(400).json({
          message: 'allocatedProducts must be empty for prepared_meals donations',
        });
      }
  
      let isFullyFulfilled = false;
      let finalAllocatedProducts = [];
      let finalAllocatedMeals = [];
  
      // Set allocations based on category
      if (donation.category === 'packaged_products') {
        finalAllocatedProducts = allocatedProducts.length ? allocatedProducts : transaction.allocatedProducts;
        finalAllocatedMeals = []; // Ignore allocatedMeals
      } else if (donation.category === 'prepared_meals') {
        finalAllocatedMeals = allocatedMeals.length ? allocatedMeals : transaction.allocatedMeals;
        finalAllocatedProducts = []; // Ignore allocatedProducts
      }
  
      // Handle prepared meals
      if (donation.category === 'prepared_meals') {
        if (!finalAllocatedMeals.length) {
          return res.status(400).json({ message: 'No meals allocated for this request' });
        }
  
        let totalAllocated = 0;
        for (const allocated of finalAllocatedMeals) {
          const donationMeal = donation.meals.find((m) =>
            m.meal && allocated.meal && m.meal._id.toString() === allocated.meal._id.toString()
          );
          if (!donationMeal) {
            console.error('Meal not found in donation:', {
              allocatedMeal: allocated,
              donationMeals: donation.meals,
            });
            return res.status(400).json({
              message: `Meal ${allocated.meal?._id || allocated.meal} not found in donation`,
            });
          }
          if (allocated.quantity > donationMeal.quantity) {
            return res.status(400).json({
              message: `Requested quantity (${allocated.quantity}) exceeds available quantity (${donationMeal.quantity}) for meal ${allocated.meal._id}`,
            });
          }
          donationMeal.quantity -= allocated.quantity;
          totalAllocated += allocated.quantity;
        }
  
        donation.meals = donation.meals.filter((m) => m.quantity > 0);
  
        donation.remainingMeals = (donation.remainingMeals || donation.numberOfMeals) - totalAllocated;
        if (donation.remainingMeals < 0) donation.remainingMeals = 0;
        isFullyFulfilled = donation.remainingMeals === 0;
        donation.status = isFullyFulfilled ? 'fulfilled' : 'approved';
  
        requestNeed.numberOfMeals = (requestNeed.numberOfMeals || 0) - totalAllocated;
        if (requestNeed.numberOfMeals < 0) requestNeed.numberOfMeals = 0;
        requestNeed.status = requestNeed.numberOfMeals === 0 ? 'fulfilled' : 'partially_fulfilled';
  
        // Ensure donation.numberOfMeals is not negative
        donation.numberOfMeals = (donation.numberOfMeals || 0) - totalAllocated;
        if (donation.numberOfMeals < 0) donation.numberOfMeals = 0;
      }
  
      // Handle packaged products
      if (donation.category === 'packaged_products') {
        if (!finalAllocatedProducts.length) {
          return res.status(400).json({ message: 'No products allocated for this request' });
        }
  
        for (const allocated of finalAllocatedProducts) {
          const donationProduct = donation.products.find((p) =>
            p.product && allocated.product && p.product._id.toString() === allocated.product._id.toString()
          );
          if (!donationProduct) {
            console.error('Product not found in donation:', {
              allocatedProduct: allocated,
              donationProducts: donation.products,
            });
            return res.status(400).json({
              message: `Product ${allocated.product?._id || allocated.product} not found in donation`,
            });
          }
          if (allocated.quantity > donationProduct.quantity) {
            return res.status(400).json({
              message: `Requested quantity (${allocated.quantity}) exceeds available quantity (${donationProduct.quantity}) for product ${allocated.product._id}`,
            });
          }
          donationProduct.quantity -= allocated.quantity;
  
          const requestProduct = requestNeed.requestedProducts.find((rp) =>
            rp.product && allocated.product && rp.product._id.toString() === allocated.product._id.toString()
          );
          if (requestProduct) {
            requestProduct.quantity -= allocated.quantity;
            if (requestProduct.quantity < 0) requestProduct.quantity = 0;
          }
        }
  
        donation.products = donation.products.filter((p) => p.quantity > 0);
        const remainingProducts = donation.products.reduce((sum, p) => sum + p.quantity, 0);
        isFullyFulfilled = remainingProducts === 0;
        donation.status = isFullyFulfilled ? 'fulfilled' : 'approved';
  
        // Ensure numberOfMeals is not modified for packaged_products
        donation.numberOfMeals = donation.numberOfMeals || 0;
        requestNeed.numberOfMeals = requestNeed.numberOfMeals || 0;
        const remainingRequestProducts = requestNeed.requestedProducts.reduce(
          (sum, rp) => sum + rp.quantity,
          0
        );
        requestNeed.status = remainingRequestProducts === 0 ? 'fulfilled' : 'partially_fulfilled';
      }
  
      // Log donation state before saving
      console.log('Donation before save:', {
        numberOfMeals: donation.numberOfMeals,
        remainingMeals: donation.remainingMeals,
        category: donation.category,
        products: donation.products,
        meals: donation.meals,
      });
  
      // Save updates
      await donation.save();
      await requestNeed.save();
  
      // Update transaction
      transaction.status = 'approved';
      transaction.responseDate = new Date();
      transaction.allocatedProducts = finalAllocatedProducts;
      transaction.allocatedMeals = finalAllocatedMeals;
      await transaction.save();
  
      // Find available transporter
      const availableTransporters = await User.find({
        role: 'transporter',
        isAvailable: true,
        isActive: true,
        isBlocked: false,
      }).select('_id name email location');
  
      let selectedTransporter = null;
      if (availableTransporters.length === 0) {
        console.warn('No available transporters found. Delivery will be created without a transporter.');
      } else {
        // Basic selection: First available transporter
        selectedTransporter = availableTransporters[0];
  
        // Optional: Select nearest transporter using geospatial query
        if (donation.location && donation.location.type === 'Point') {
          try {
            const nearestTransporter = await User.find({
              role: 'transporter',
              isAvailable: true,
              isActive: true,
              isBlocked: false,
              location: {
                $near: {
                  $geometry: donation.location,
                  $maxDistance: 10000, // 10km in meters
                },
              },
            })
              .select('_id name email location')
              .limit(1);
  
            selectedTransporter = nearestTransporter[0] || availableTransporters[0];
          } catch (geoError) {
            console.error('Geospatial query failed:', geoError.message);
            // Fallback to first available transporter
          }
        }
      }
  
      // Create delivery
      const delivery = new Delivery({
        donationTransaction: transaction._id,
        transporter: selectedTransporter ? selectedTransporter._id : null,
        pickupAddress: donation.address,
        deliveryAddress: requestNeed.address,
        pickupCoordinates: donation.location,
        deliveryCoordinates: requestNeed.location,
        status: null,
      });
      await delivery.save();
  
      // Notify recipient
      const recipient = await User.findById(requestNeed.recipient).select('_id name email');
      await createNotification({
        body: {
          sender: transaction.donor,
          receiver: transaction.recipient,
          message: `A delivery has been created for your request "${requestNeed.title}". Status: Pending.`,
        },
      }, { status: () => ({ json: () => {} }) });
  
      // Notify donor
      await createNotification({
        body: {
          sender: transaction.recipient,
          receiver: transaction.donor,
          message: `A delivery has been created for your donation "${donation.title}". Status: Pending.`,
        },
      }, { status: () => ({ json: () => {} }) });
  
      // Notify transporter (if assigned)
      if (selectedTransporter) {
        await createNotification({
          body: {
            sender: transaction.donor,
            receiver: selectedTransporter._id,
            message: `You have been assigned to a delivery for the donation "${donation.title}". Pickup address: ${donation.address}. Status: Pending.`,
          },
        }, { status: () => ({ json: () => {} }) });
      }
  
      // Send email to donor
      if (donation.donor && donation.donor.email) {
        let allocatedItemsText = '';
        if (donation.category === 'prepared_meals') {
          allocatedItemsText = finalAllocatedMeals
            .map((am) => {
              const meal = donation.meals.find((m) =>
                m.meal && am.meal && m.meal._id.toString() === am.meal._id.toString()
              )?.meal;
              return `${meal?.mealName || 'Unknown Meal'} (Quantity: ${am.quantity})`;
            })
            .join(', ');
        } else if (donation.category === 'packaged_products') {
          allocatedItemsText = finalAllocatedProducts
            .map((ap) => {
              const product = donation.products.find((p) =>
                p.product && ap.product && p.product._id.toString() === ap.product._id.toString()
              )?.product;
              return `${product?.name || 'Unknown Product'} (Quantity: ${ap.quantity})`;
            })
            .join(', ');
        }
  
        const subject = `Your Donation "${donation.title}" Has Been Accepted`;
        const text = `Dear ${donation.donor.name || 'Donor'},
  
  Your donation titled "${donation.title}" has been accepted.
  
  Donation Details:
  - Title: ${donation.title}
  - Request: ${requestNeed.title}
  - Allocated Items: ${allocatedItemsText}
  - Accepted On: ${new Date().toLocaleDateString()}
  - Status: ${donation.status}
  - Delivery Status: Pending
  ${selectedTransporter ? `- Assigned Transporter: ${selectedTransporter.name}` : '- Transporter: Pending Assignment'}
  
  Thank you for your generosity!
  
  Best regards,
  The Platform Team`;
  
        const html = `
          <div style="font-family: Arial, sans-serif; color: black;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="cid:logo" alt="Platform Logo" style="max-width: 150px; height: auto;" />
            </div>
            <h2 style="color: #228b22;">Your Donation Has Been Accepted</h2>
            <p>Dear ${donation.donor.name || 'Donor'},</p>
            <p>Your donation titled "<strong>${donation.title}</strong>" has been accepted.</p>
            <h3>Donation Details:</h3>
            <ul>
              <li><strong>Title:</strong> ${donation.title}</li>
              <li><strong>Request:</strong> ${requestNeed.title}</li>
              <li><strong>Allocated Items:</strong> ${allocatedItemsText}</li>
              <li><strong>Accepted On:</strong> ${new Date().toLocaleDateString()}</li>
              <li><strong>Status:</strong> ${donation.status}</li>
              <li><strong>Delivery Status:</strong> Pending</li>
              ${selectedTransporter ? `<li><strong>Assigned Transporter:</strong> ${selectedTransporter.name}</li>` : '<li><strong>Transporter:</strong> Pending Assignment</li>'}
            </ul>
            <p>Thank you for your generosity!</p>
            <p style="margin-top: 20px;">Best regards,<br>The Platform Team</p>
          </div>
        `;
  
        const attachments = [
          {
            filename: 'logo.png',
            path: path.join(__dirname, '../Uploads/logo.png'),
            cid: 'logo',
          },
        ];
  
        await sendEmail(donation.donor.email, subject, text, html, attachments);
        console.log(`Email sent to ${donation.donor.email}`);
      }
  
      // Send email to recipient
      if (recipient && recipient.email) {
        const subject = `Your Request "${requestNeed.title}" Has Been Fulfilled`;
        const text = `Dear ${recipient.name || 'User'},
  
  Your request titled "${requestNeed.title}" has been fulfilled.
  
  Details:
  - Donation Title: ${donation.title}
  - Request Status: ${requestNeed.status}
  - Delivery Status: Pending
  ${selectedTransporter ? `- Assigned Transporter: ${selectedTransporter.name}` : '- Transporter: Pending Assignment'}
  
  Thank you for using our platform!
  
  Best regards,
  The Platform Team`;
  
        const html = `
          <div style="font-family: Arial, sans-serif; color: black;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="cid:logo" alt="Platform Logo" style="max-width: 150px; height: auto;" />
            </div>
            <h2 style="color: #228b22;">Your Request Has Been Fulfilled</h2>
            <p>Dear ${recipient.name || 'User'},</p>
            <p>Your request titled "<strong>${requestNeed.title}</strong>" has been fulfilled.</p>
            <h3>Details:</h3>
            <ul>
              <li><strong>Donation Title:</strong> ${donation.title}</li>
              <li><strong>Request Status:</strong> ${requestNeed.status}</li>
              <li><strong>Delivery Status:</strong> Pending</li>
              ${selectedTransporter ? `<li><strong>Assigned Transporter:</strong> ${selectedTransporter.name}</li>` : '<li><strong>Transporter:</strong> Pending Assignment</li>'}
            </ul>
            <p>Thank you for using our platform!</p>
            <p style="margin-top: 20px;">Best regards,<br>The Platform Team</p>
          </div>
        `;
  
        const attachments = [
          {
            filename: 'logo.png',
            path: path.join(__dirname, '../Uploads/logo.png'),
            cid: 'logo',
          },
        ];
  
        await sendEmail(recipient.email, subject, text, html, attachments);
        console.log(`Email sent to ${recipient.email}`);
      }
  
      // Send email to transporter (if assigned)
      if (selectedTransporter && selectedTransporter.email) {
        const subject = `New Delivery Assigned: ${donation.title}`;
        const text = `Dear ${selectedTransporter.name || 'Transporter'},
  
  You have been assigned to a delivery for the donation "${donation.title}".
  
  Details:
  - Donation Title: ${donation.title}
  - Pickup Address: ${donation.address}
  - Delivery Address: ${requestNeed.address}
  - Delivery Status: Pending
  
  Thank you for using our platform!
  
  Best regards,
  The Platform Team`;
  
        const html = `
          <div style="font-family: Arial, sans-serif; color: black;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="cid:logo" alt="Platform Logo" style="max-width: 150px; height: auto;" />
            </div>
            <h2 style="color: #228b22;">New Delivery Assigned</h2>
            <p>Dear ${selectedTransporter.name || 'Transporter'},</p>
            <p>You have been assigned to a delivery for the donation "<strong>${donation.title}</strong>".</p>
            <h3>Details:</h3>
            <ul>
              <li><strong>Donation Title:</strong> ${donation.title}</li>
              <li><strong>Pickup Address:</strong> ${donation.address}</li>
              <li><strong>Delivery Address:</strong> ${requestNeed.address}</li>
              <li><strong>Delivery Status:</strong> Pending</li>
            </ul>
            <p>Thank you for using our platform!</p>
            <p style="margin-top: 20px;">Best regards,<br>The Platform Team</p>
          </div>
        `;
  
        const attachments = [
          {
            filename: 'logo.png',
            path: path.join(__dirname, '../Uploads/logo.png'),
            cid: 'logo',
          },
        ];
  
        await sendEmail(selectedTransporter.email, subject, text, html, attachments);
        console.log(`Email sent to ${selectedTransporter.email}`);
      }
  
      res.status(200).json({
        message: 'Transaction accepted successfully',
        donation,
        request: requestNeed,
        transaction,
        delivery,
        transporter: selectedTransporter ? { _id: selectedTransporter._id, name: selectedTransporter.name } : null,
      });
    } catch (error) {
      console.error('Error accepting transaction:', error);
      res.status(500).json({
        message: 'Failed to accept transaction',
        error: error.message,
      });
    }
  }
  
  
async function rejectDonationTransaction(req, res) {
    try {
      const { transactionId } = req.params;
      const { rejectionReason } = req.body;
  
      if (!transactionId) {
        return res.status(400).json({ message: 'Transaction ID is required' });
      }
      if (!rejectionReason) {
        return res.status(400).json({ message: 'Rejection reason is required' });
      }
  
      const transaction = await DonationTransaction.findById(transactionId)
        .populate({
          path: 'donation',
          populate: [
            { path: 'donor' },
            { path: 'meals.meal', model: 'Meals' },
            { path: 'products.product', model: 'Product' },
          ],
        })
        .populate({
          path: 'requestNeed',
          populate: [
            { path: 'recipient' },
            { path: 'requestedProducts.product', model: 'Product' },
          ],
        })
        .populate('recipient')
        .populate('donor')
        .populate('allocatedProducts.product')
        .populate('allocatedMeals.meal');
  
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
  
      if (transaction.status !== 'pending') {
        return res.status(400).json({
          message: `Transaction cannot be rejected in its current state (${transaction.status})`,
        });
      }
  
      transaction.status = 'rejected';
      transaction.responseDate = new Date();
      transaction.rejectionReason = rejectionReason;
      await transaction.save();
  
      const donation = transaction.donation;
      if (donation) {
        donation.linkedRequests = donation.linkedRequests.filter(
          (reqId) => reqId.toString() !== transaction.requestNeed._id.toString()
        );
        const otherTransactions = await DonationTransaction.find({
          donation: donation._id,
          status: { $in: ['pending', 'approved'] },
        });
        donation.status = otherTransactions.length > 0 ? 'approved' : 'pending';
        await donation.save();
      }
  
      const requestNeed = transaction.requestNeed;
      if (requestNeed) {
        requestNeed.linkedDonation = requestNeed.linkedDonation.filter(
          (donId) => donId.toString() !== transaction.donation._id.toString()
        );
        const otherTransactions = await DonationTransaction.find({
          requestNeed: requestNeed._id,
          status: { $in: ['pending', 'approved'] },
        });
        requestNeed.status = otherTransactions.length > 0 ? 'partially_fulfilled' : 'pending';
        await requestNeed.save();
      }
  
      const recipient = transaction.recipient || (requestNeed && requestNeed.recipient);
      if (recipient && recipient.email) {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER || 'your-email@gmail.com',
              pass: process.env.EMAIL_PASS || 'your-email-password',
            },
            tls: {
              rejectUnauthorized: false,
            },
          });
  
          const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: recipient.email,
            subject: `Votre demande "${requestNeed.title}" a été rejetée`,
            text: `Cher ${recipient.name || 'Utilisateur'},
  
  Nous avons le regret de vous informer qu'une transaction pour votre demande intitulée "${requestNeed.title}" a été rejetée.
  
  Détails :
  - Titre du don : ${donation.title}
  - Raison du rejet : ${rejectionReason}
  
  Si vous avez des questions, veuillez contacter notre équipe de support.
  
  Cordialement,
  L'équipe de la plateforme`,
            html: `
              <div style="font-family: Arial, sans-serif; color: black;">
                <h2 style="color: #dc3545;">Votre transaction a été rejetée</h2>
                <p>Cher ${recipient.name || 'Utilisateur'},</p>
                <p>Nous avons le regret de vous informer qu'une transaction pour votre demande intitulée "<strong>${requestNeed.title}</strong>" a été rejetée.</p>
                <h3>Détails :</h3>
                <ul>
                  <li><strong>Titre du don :</strong> ${donation.title}</li>
                  <li><strong>Raison du rejet :</strong> ${rejectionReason}</li>
                </ul>
                <p>Si vous avez des questions, veuillez contacter notre équipe de support.</p>
                <p style="margin-top: 20px;">Cordialement,<br>L'équipe de la plateforme</p>
              </div>
            `,
          };
  
          await transporter.sendMail(mailOptions);
          console.log(`Email envoyé à ${recipient.email}`);
        } catch (emailError) {
          console.error(`Échec de l'envoi de l'email à ${recipient.email}:`, emailError.message);
        }
      }
  
      const donor = transaction.donor || (donation && donation.donor);
      if (donor && donor.email) {
        try {
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER || 'your-email@gmail.com',
              pass: process.env.EMAIL_PASS || 'your-email-password',
            },
            tls: {
              rejectUnauthorized: false,
            },
          });
  
          const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: donor.email,
            subject: `Votre don "${donation.title}" a été rejeté`,
            text: `Cher ${donor.name || 'Donateur'},
  
  Nous avons le regret de vous informer qu'une transaction pour votre don intitulé "${donation.title}" a été rejetée.
  
  Détails :
  - Titre de la demande : ${requestNeed.title}
  - Raison du rejet : ${rejectionReason}
  
  Si vous avez des questions, veuillez contacter notre équipe de support.
  
  Cordialement,
  L'équipe de la plateforme`,
            html: `
              <div style="font-family: Arial, sans-serif; color: black;">
                <h2 style="color: #dc3545;">Votre transaction de don a été rejetée</h2>
                <p>Cher ${donor.name || 'Donateur'},</p>
                <p>Nous avons le regret de vous informer qu'une transaction pour votre don intitulé "<strong>${donation.title}</strong>" a été rejetée.</p>
                <h3>Détails :</h3>
                <ul>
                  <li><strong>Titre de la demande :</strong> ${requestNeed.title}</li>
                  <li><strong>Raison du rejet :</strong> ${rejectionReason}</li>
                </ul>
                <p>Si vous avez des questions, veuillez contacter notre équipe de support.</p>
                <p style="margin-top: 20px;">Cordialement,<br>L'équipe de la plateforme</p>
              </div>
            `,
          };
  
          await transporter.sendMail(mailOptions);
          console.log(`Email envoyé à ${donor.email}`);
        } catch (emailError) {
          console.error(`Échec de l'envoi de l'email à ${donor.email}:`, emailError.message);
        }
      }
  
      res.status(200).json({
        message: 'Transaction rejetée avec succès',
        transaction,
      });
    } catch (error) {
      console.error('Erreur lors du rejet de la transaction:', error);
      res.status(500).json({
        message: 'Échec du rejet de la transaction',
        error: error.message,
      });
    }
  }
  
async function checkRequestFulfillment(requestId) {
  const request = await RequestNeed.findById(requestId)
    .populate('requestedProducts')
    .populate('requestedMeals');
  const transactions = await DonationTransaction.find({ 
    requestNeed: requestId, 
    status: 'approved' 
  })
    .populate('allocatedProducts.product')
    .populate('allocatedMeals.meal');

  let isFullyFulfilled = false;

  if (request.category === 'packaged_products') {
    const requestedMap = new Map(request.requestedProducts.map(p => [p._id.toString(), p.totalQuantity]));
    const allocatedMap = new Map();

    transactions.forEach(t => {
      t.allocatedProducts.forEach(ap => {
        const productId = ap.product._id.toString();
        allocatedMap.set(productId, (allocatedMap.get(productId) || 0) + ap.quantity);
      });
    });

    isFullyFulfilled = [...requestedMap].every(([productId, requestedQty]) => 
      (allocatedMap.get(productId) || 0) >= requestedQty
    );
  } else if (request.category === 'prepared_meals') {
    const totalRequestedMeals = request.numberOfMeals;
    let totalAllocatedMeals = 0;

    transactions.forEach(t => {
      t.allocatedMeals.forEach(am => {
        totalAllocatedMeals += am.quantity;
      });
    });

    request.numberOfMeals = totalRequestedMeals - totalAllocatedMeals;
    if (request.numberOfMeals < 0) request.numberOfMeals = 0;

    isFullyFulfilled = request.numberOfMeals === 0;
  }

  request.status = isFullyFulfilled ? 'fulfilled' : 'partially_fulfilled';
  await request.save();
  console.log('checkRequestFulfillment updated request:', request);
}

async function rejectDonation(req, res) {
  try {
    const { donationId } = req.params;
    const { rejectionReason } = req.body;

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: 'Don non trouvé' });
    }

    const donor = await User.findById(donation.donor);
    if (!donor) return res.status(404).json({ message: 'Donateur non trouvé' });

    if (donation.status !== 'pending') {
      return res.status(400).json({ 
        message: `Le don ne peut pas être rejeté dans son état actuel (${donation.status})`
      });
    }

    donation.status = 'rejected';
    donation.rejectionReason = rejectionReason || 'Aucune raison fournie';
    await donation.save();

    if (donor.email) {
      const subject = `Votre don "${donation.title}" a été rejeté`;
      const text = `Cher ${donor.name || 'Donateur'},

Nous avons le regret de vous informer que votre don intitulé "${donation.title}" a été rejeté.

Détails du don :
- Titre : ${donation.title}
- Raison du rejet : ${rejectionReason || 'Aucune raison fournie'}
- Rejeté le : ${new Date().toLocaleDateString()}

Si vous avez des questions, veuillez contacter notre équipe de support.

Cordialement,
L'équipe de la plateforme`;

      const html = `
        <div style="font-family: Arial, sans-serif; color: black;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="cid:logo" alt="Logo de la plateforme" style="max-width: 150px; height: auto;" />
          </div>
          <h2 style="color: #dc3545;">Votre don a été rejeté</h2>
          <p>Cher ${donor.name || 'Donateur'},</p>
          <p>Nous avons le regret de vous informer que votre don intitulé "<strong>${donation.title}</strong>" a été rejeté.</p>
          <h3>Détails du don :</h3>
          <ul>
            <li><strong>Titre :</strong> ${donation.title}</li>
            <li><strong>Raison du rejet :</strong> ${rejectionReason || 'Aucune raison fournie'}</li>
            <li><strong>Rejeté le :</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>Si vous avez des questions, veuillez contacter notre équipe de support.</p>
          <p style="margin-top: 20px;">Cordialement,<br>L'équipe de la plateforme</p>
        </div>
      `;

      const attachments = [
        {
          filename: 'logo.png',
          path: path.join(__dirname, '../uploads/logo.png'),
          cid: 'logo',
        },
      ];

      await sendEmail(donor.email, subject, text, html, attachments);
    } else {
      console.warn(`Email du donateur non trouvé pour l'ID du donateur : ${donation.donor}`);
    }

    res.status(200).json({ 
      message: 'Don rejeté avec succès', 
      donation 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Échec du rejet du don', 
      error: error.message 
    });
  }
}

async function getDonationTransactionsByDonorId(req, res) {
  try {
    const { donorId } = req.params;

    const donations = await Donation.find({ donor: donorId }).select('_id');

    if (!donations.length) {
      return res.status(404).json({ message: 'Aucun don trouvé pour ce donateur' });
    }

    const donationIds = donations.map(d => d._id);

    const transactions = await DonationTransaction.find({ donation: { $in: donationIds } })
      .populate({
        path: 'donation',
        populate: [
          { path: 'donor', select: 'name photo' },
          { path: 'meals.meal', model: 'Meals' },
          { path: 'products.product', model: 'Product' },
        ],
      })
      .populate({
        path: 'requestNeed',
        populate: [
          { path: 'recipient' },
          { path: 'requestedProducts.product', model: 'Product' },
          { path: 'requestedMeals.meal', model: 'Meals' },
        ],
      })
      .populate('allocatedProducts.product')
      .populate('allocatedMeals.meal');

    if (!transactions.length) {
      return res.status(404).json({ message: 'Aucune transaction trouvée pour ce donateur' });
    }

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions par donateur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
}

async function getTransactionsByRecipientId(req, res) {
  try {
    const { recipientId } = req.params;
    const transactions = await DonationTransaction.find({ recipient: recipientId })
      .populate({
        path: 'requestNeed',
        populate: [
          { path: 'recipient', select: 'name photo' },
          { path: 'requestedProducts.product', model: 'Product' },
          { path: 'requestedMeals.meal', model: 'Meals' },
        ],
      })
      .populate({
        path: 'donation',
        populate: [
          { path: 'donor', select: 'name photo' },
          { path: 'meals.meal', model: 'Meals' },
          { path: 'products.product', model: 'Product' },
        ],
      })
      .populate('allocatedProducts.product')
      .populate('allocatedMeals.meal')
      .populate('donor');

    if (!transactions.length) {
      return res.status(404).json({ message: 'Aucune transaction trouvée pour ce bénéficiaire' });
    }

    res.status(200).json(transactions);
  } catch (error) {
    console.error('Erreur lors de la récupération des transactions par bénéficiaire:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
}

module.exports = {
  getAllDonationTransactions,
  getDonationTransactionById,
  getDonationTransactionsByRequestNeedId,
  getDonationTransactionsByDonationId,
  getDonationTransactionsByDonorId,
  getDonationTransactionsByStatus,
  createDonationTransaction,
  updateDonationTransaction,
  deleteDonationTransaction,
  getTransactionsByRecipientId,
  acceptDonationTransaction,
  rejectDonationTransaction,
  createAndAcceptDonationTransaction,
  rejectDonation,
  createAndAcceptDonationTransactionBiderc,
};