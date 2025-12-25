const express = require('express');
const router = express.Router();
const contactController = require('../controllers/ContactSubmissionController');

router.post('/contact', contactController.submitContactForm);
router.get('/contact/submissions', contactController.getAllSubmissions);
// routes/contactRoutes.js
router.get("/contact/submissions/:id", contactController.getSubmissionById);
router.put("/contact/submissions/:id/respond", contactController.updateSubmissionStatus);

module.exports = router;