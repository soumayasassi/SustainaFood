const express = require('express');
const router = express.Router();
const donationTransactionController = require('../controllers/donationTransactionController');

// ✅ Get all donation transactions
router.get('/', donationTransactionController.getAllDonationTransactions);

// ✅ Get donation transaction by ID
router.get('/:id', donationTransactionController.getDonationTransactionById);

// ✅ Get donation transactions by RequestNeed ID
router.get('/requestNeed/:requestNeedId', donationTransactionController.getDonationTransactionsByRequestNeedId);

// ✅ Get donation transactions by Donation ID
router.get('/donation/:donationId', donationTransactionController.getDonationTransactionsByDonationId);

// ✅ Get donation transactions by Status
router.get('/status/:status', donationTransactionController.getDonationTransactionsByStatus);

// ✅ Create a new donation transaction
router.post('/', donationTransactionController.createDonationTransaction);

// ✅ Update a donation transaction by ID
router.put('/:id', donationTransactionController.updateDonationTransaction);

// ✅ Delete a donation transaction by ID
router.delete('/:id', donationTransactionController.deleteDonationTransaction);

router.get('/recipient/:recipientId', donationTransactionController.getTransactionsByRecipientId);
router.put('/:transactionId/accept', donationTransactionController.acceptDonationTransaction);
router.put('/:transactionId/reject', donationTransactionController.rejectDonationTransaction);
// New endpoint to create and accept a transaction from a donation
router.post('/create-and-accept', donationTransactionController.createAndAcceptDonationTransaction);
router.post('/create-et-accept', donationTransactionController.createAndAcceptDonationTransactionBiderc);
router.put('/donation/:donationId/reject', donationTransactionController.rejectDonation);
// ✅ Get donations by Donor ID
router.get('/donor/:donorId', donationTransactionController.getDonationTransactionsByDonorId);
module.exports = router;