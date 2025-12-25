const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const mongoose = require('mongoose');
const axios = require('axios');

// POST - Create new feedback
router.post('/', async (req, res) => {
  try {
    const { reviewer, recipient, rating, comment } = req.body;
    const authUserId = req.user?._id || req.user?.id; // From auth middleware



    if (!recipient || !rating || !comment || !reviewer) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Compute satisfaction score by calling Flask endpoint
    let satisfactionScore;
    try {
      const response = await axios.post('http://localhost:5000/compute_satisfaction', {
        rating,
        comment,
      });
      satisfactionScore = response.data.satisfactionScore;
    } catch (error) {
      console.error('Error computing satisfaction score:', error.message);
      // Fallback to rating-based score
      satisfactionScore = Math.round(((rating - 1) / 4) * 100);
    }

    const feedback = new Feedback({
      reviewer,
      recipient,
      rating,
      comment,
      satisfactionScore,
    });

    await feedback.save();
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET - Get all feedback for a user
router.get('/:userId', async (req, res) => {
  try {
    const feedback = await Feedback.find({ recipient: req.params.userId })
      .populate('reviewer', 'name photo')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT - Update feedback
router.put('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (feedback.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this feedback' });
    }

    feedback.rating = req.body.rating || feedback.rating;
    feedback.comment = req.body.comment || feedback.comment;

    // Recompute satisfaction score if rating or comment is updated
    if (req.body.rating || req.body.comment) {
      try {
        const response = await axios.post('http://localhost:5000/compute_satisfaction', {
          rating: feedback.rating,
          comment: feedback.comment,
        });
        feedback.satisfactionScore = response.data.satisfactionScore;
      } catch (error) {
        console.error('Error computing satisfaction score:', error.message);
        // Fallback to rating-based score
        feedback.satisfactionScore = Math.round(((feedback.rating - 1) / 4) * 100);
      }
    }

    await feedback.save();
    res.json(feedback);
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE - Delete feedback
router.delete('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (feedback.reviewer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this feedback' });
    }

    await feedback.deleteOne();
    res.json({ message: 'Feedback deleted' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;