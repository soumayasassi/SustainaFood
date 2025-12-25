// src/api/donationTransactionService.js
import axios from 'axios';
export const API_BASE = 'http://localhost:3000/donationTransaction';

// Fetch all donation transactions
export const getAllDonationTransactions = async () => {
    try {
        const response = await axios.get(`${API_BASE}/`);
        console.log("Full API Response (getAllDonationTransactions):", JSON.stringify(response, null, 2));
        console.log("Response Data:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching all donation transactions:', {
            message: error.message,
            response: error.response ? error.response.data : null,
            status: error.response ? error.response.status : null,
        });
        throw error;
    }
};

// Fetch donation transactions by RequestNeed ID
export const getDonationTransactionsByRequestNeedId = async (requestNeedId) => {
    try {
        const response = await axios.get(`${API_BASE}/requestNeed/${requestNeedId}`);
        console.log(`Full API Response (getDonationTransactionsByRequestNeedId ${requestNeedId}):`, response);
        return response.data;
    } catch (error) {
        console.error(`Error fetching donation transactions for RequestNeed ID ${requestNeedId}:`, error.message);
        throw error;
    }
};

// Fetch donation transactions by Donation ID
export const getDonationTransactionsByDonationId = async (donationId) => {
    try {
        const response = await axios.get(`${API_BASE}/donation/${donationId}`);
        console.log(`Full API Response (getDonationTransactionsByDonationId ${donationId}):`, response);
        return response.data;
    } catch (error) {
        console.error(`Error fetching donation transactions for Donation ID ${donationId}:`, error.message);
        throw error;
    }
};

// Fetch donation transactions by Status
export const getDonationTransactionsByStatus = async (status) => {
    try {
        const response = await axios.get(`${API_BASE}/status/${status}`);
        console.log(`Full API Response (getDonationTransactionsByStatus ${status}):`, response);
        return response.data;
    } catch (error) {
        console.error(`Error fetching donation transactions with status ${status}:`, error.message);
        throw error;
    }
};

// Create a new donation transaction
export const createDonationTransaction = async (transactionData) => {
    try {
        const response = await axios.post(`${API_BASE}/`, transactionData);
        console.log("Full API Response (createDonationTransaction):", response);
        return response.data;
    } catch (error) {
        console.error('Error creating donation transaction:', error.message);
        throw error;
    }
};

// Update a donation transaction by ID
export const updateDonationTransaction = async (id, transactionData) => {
    try {
        const response = await axios.put(`${API_BASE}/${id}`, transactionData);
        console.log(`Full API Response (updateDonationTransaction ${id}):`, response);
        return response.data;
    } catch (error) {
        console.error(`Error updating donation transaction with ID ${id}:`, error.message);
        throw error;
    }
};

// Delete a donation transaction by ID
export const deleteDonationTransaction = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE}/${id}`);
        console.log(`Full API Response (deleteDonationTransaction ${id}):`, response);
        return response.data;
    } catch (error) {
        console.error(`Error deleting donation transaction with ID ${id}:`, error.message);
        throw error;
    }
};

// Accept a donation transaction
export const acceptDonationTransaction = async (transactionId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        
        const response = await axios.put(
            `${API_BASE}/${transactionId}/accept`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`Full API Response (acceptDonationTransaction ${transactionId}):`, response);
        return response.data;
    } catch (error) {
        console.error(`Error accepting donation transaction with ID ${transactionId}:`, {
            message: error.message,
            response: error.response ? error.response.data : null,
            status: error.response ? error.response.status : null,
        });
        throw error;
    }
};

// Reject a donation transaction
export const rejectDonationTransaction = async (transactionId, reason) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        
        const response = await axios.put(
            `${API_BASE}/${transactionId}/reject`,
            { rejectionReason: reason },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`Full API Response (rejectDonationTransaction ${transactionId}):`, response);
        return response.data;
    } catch (error) {
        console.error(`Error rejecting donation transaction with ID ${transactionId}:`, {
            message: error.message,
            response: error.response ? error.response.data : null,
            status: error.response ? error.response.status : null,
        });
        throw error;
    }
};

// Fetch transactions by Donation ID
async function getTransactionByRequestId(req, res) {
  try {
    const { requestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const transaction = await DonationTransaction.findOne({ requestNeed: requestId })
      .populate({
        path: 'requestNeed',
        populate: [
          { path: 'recipient' },
          { path: 'requestedProducts.product' },
          { path: 'requestedMeals.meal' },
        ],
      })
      .populate('donation')
      .populate('allocatedProducts.product')
      .populate('allocatedMeals.meal');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found for this request' });
    }

    res.status(200).json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ message: 'Failed to fetch transaction', error: error.message });
  }
}
// Create and accept a donation transaction
export const createAndAcceptDonationTransaction = async (donationId, requestNeedId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        
        const response = await axios.post(
            `${API_BASE}/create-and-accept`,
            { donationId, requestNeedId },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`Full API Response (createAndAcceptDonationTransaction):`, response);
        return response.data;
    } catch (error) {
        console.error(`Error creating and accepting donation transaction:`, {
            message: error.message,
            response: error.response ? error.response.data : null,
            status: error.response ? error.response.status : null,
        });
        throw error;
    }
};
export const createAndAcceptDonationTransactionBiderc = async (donationId, requestNeedId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        
        const response = await axios.post(
            `${API_BASE}/create-et-accept`,
            { donationId, requestNeedId },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`Full API Response (createAndAcceptDonationTransactionBiderc):`, response);
        return response.data;
    } catch (error) {
        console.error(`Error creating and accepting donation transaction:`, {
            message: error.message,
            response: error.response ? error.response.data : null,
            status: error.response ? error.response.status : null,
        });
        throw error;
    }
};
// Fetch a donation transaction by ID

export const getDonationTransactionById = async (id) => {
    try {
        const response = await axios.get(`${API_BASE}/${id}`, {
            params: {
                populate: 'requestNeed donation allocatedProducts.product allocatedMeals.meal donor recipient'
            }
        });
        console.log(`Full API Response (getDonationTransactionById ${id}):`, response);
        return response.data;
    } catch (error) {
        console.error(`Error fetching donation transaction with ID ${id}:`, error.message);
        throw error;
    }
};

// Fetch transactions by recipient ID
export const getTransactionsByRecipientId = async (recipientId) => {
    try {
        const response = await axios.get(`${API_BASE}/recipient/${recipientId}`);
        console.log(`Full API Response (getTransactionsByRecipientId ${recipientId}):`, response);
        return response.data;
    } catch (error) {
        console.error(`Error fetching transactions for recipient ID ${recipientId}:`, error.message);
        throw error;
    }
};
// Reject a donation directly
export const rejectDonation = async (donationId, rejectionReason) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        
        const response = await axios.put(
            `${API_BASE}/donation/${donationId}/reject`,
            { rejectionReason: rejectionReason },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`Full API Response (rejectDonation ${donationId}):`, response);
        return response.data;
    } catch (error) {
        console.error(`Error rejecting donation with ID ${donationId}:`, {
            message: error.message,
            response: error.response ? error.response.data : null,
            status: error.response ? error.response.status : null,
        });
        throw error;
    }
};
export const rejectRequest = async (requestId, reason) => {
    const token = localStorage.getItem('token');
    return await axios.put(
      `${API_URL}/reject-request/${requestId}`,
      { reason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };
  
// New function for fetching transactions by donor ID
export const getDonationTransactionsByDonorId = async (donorId) => {
    try {
        const response = await axios.get(`${API_BASE}/donor/${donorId}`);
        console.log(`Full API Response (getDonationTransactionsByDonorId ${donorId}):`, response);
        return response.data;
    } catch (error) {
        console.error(`Error fetching donation transactions for Donor ID ${donorId}:`, error.message);
        throw error;
    }
};
export default {
    getDonationTransactionsByDonorId,
    getAllDonationTransactions,
    getDonationTransactionById,
    getDonationTransactionsByRequestNeedId,
    getDonationTransactionsByDonationId,
    getDonationTransactionsByStatus,
    createDonationTransaction,
    updateDonationTransaction,
    deleteDonationTransaction,
    acceptDonationTransaction,
    rejectDonationTransaction,
    createAndAcceptDonationTransaction,
    getTransactionsByRecipientId,
    rejectDonation,
    rejectRequest
};