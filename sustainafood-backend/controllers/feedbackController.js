// controllers/feedbackController.js
const Feedback = require('../models/Feedback');
const Delivery = require('../models/Delivery');
const User = require('../models/User');

exports.createFeedback = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { rating, comment } = req.body;
    const reviewerId = req.user.id; // Assuming authMiddleware adds user to req

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const delivery = await Delivery.findById(deliveryId).populate('transporter');
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (delivery.status !== 'delivered') {
      return res.status(400).json({ message: 'Feedback can only be provided for delivered deliveries' });
    }

    const transporter = delivery.transporter;
    if (!transporter) {
      return res.status(400).json({ message: 'No transporter assigned to this delivery' });
    }

    const feedback = new Feedback({
      delivery: deliveryId,
      transporter: transporter._id,
      reviewer: reviewerId,
      rating,
      comment,
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback created successfully', feedback });
  } catch (error) {
    res.status(500).json({ message: 'Error creating feedback', error: error.message });
  }
};

exports.getTransporterFeedbacks = async (req, res) => {
  try {
    const { transporterId } = req.params;

    const feedbacks = await Feedback.find({ transporter: transporterId })
      .populate('reviewer', 'name email')
      .populate('delivery', 'pickupAddress deliveryAddress');

    res.status(200).json({ data: feedbacks });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transporter feedbacks', error: error.message });
  }
};

