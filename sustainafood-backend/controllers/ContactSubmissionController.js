const ContactSubmission = require('../models/ContactSubmission');

exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, comment } = req.body;

    if (!name || !email || !comment) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newSubmission = new ContactSubmission({
      name,
      email,
      comment,
    });

    await newSubmission.save();
    res.status(201).json({ message: 'Form submitted successfully', submissionId: newSubmission._id });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting form', error: error.message });
  }
};

exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await ContactSubmission.find().sort({ submittedAt: -1 });
    res.status(200).json({ data: submissions });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
};

// controllers/ContactSubmissionController.js
exports.updateSubmissionStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      if (!["pending", "responded"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
  
      const submission = await ContactSubmission.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
  
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
  
      res.status(200).json({ message: "Status updated successfully", submission });
    } catch (error) {
      res.status(500).json({ message: "Error updating status", error: error.message });
    }
  };

  // controllers/ContactSubmissionController.js
exports.getSubmissionById = async (req, res) => {
    try {
      const { id } = req.params;
      const submission = await ContactSubmission.findById(id);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      res.status(200).json(submission);
    } catch (error) {
      res.status(500).json({ message: "Error fetching submission", error: error.message });
    }
  };