import axios from 'axios';

const API_URL = 'http://localhost:3000/deliveries';

// Retrieve JWT token from localStorage (adjust based on your auth storage method)
const getToken = () => localStorage.getItem('token') || '';

export const getTransporterDeliveries = async (transporterId) => {
  try {
    const response = await axios.get(`${API_URL}/transporter/${transporterId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch transporter deliveries' };
  }
};

export const updateDeliveryStatus = async (deliveryId, status) => {
  try {
    const response = await axios.put(
      `${API_URL}/${deliveryId}/status`,
      { status }, // Backend expects { status }
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update delivery status' };
  }
};

export const getTransporterFeedbacks = async (transporterId) => {
  // Note: This endpoint is not defined in the provided backend routes.
  // Placeholder implementation; replace with actual endpoint when available.
  try {
    const response = await axios.get(`${API_URL}/feedbacks/transporter/${transporterId}`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch transporter feedbacks' };
  }
};

export const createDelivery = async (donationTransactionId) => {
  try {
    const response = await axios.post(
      `${API_URL}`,
      { donationTransaction: donationTransactionId },
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create delivery' };
  }
};

export const assignTransporterToDelivery = async (deliveryId, transporterId) => {
  try {
    const response = await axios.put(
      `${API_URL}/${deliveryId}/assign`,
      { transporterId },
      {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to assign transporter' };
  }
};

export const getPendingDeliveries = async () => {
  try {
    const response = await axios.get(`${API_URL}/pending`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch pending deliveries' };
  }
};


export const getDeliveriesByTransporter = async (transporterId, status = '') => {
  try {
    const url = status
      ? `${API_URL}/transporter/${transporterId}?status=${status}`
      : `${API_URL}/transporter/${transporterId}`;
    const response = await axios.get(url, {
      headers: {
      },
    });
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch deliveries by transporter' };
  }
};

// New API call for accepting or refusing a delivery
export const acceptOrRefuseDelivery = async (deliveryId, action, transporterId) => {
  return await axios.post(`${API_URL}/${deliveryId}/accept-or-refuse`, {
    action,
    transporterId, // Send transporterId in the request body
  }, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`, // Ensure token is sent for authentication
    },
  });
};
// New API call for starting a delivery journey
export const startJourney = async (deliveryId, transporterId) => {
  try {
    const response = await axios.post(
      `${API_URL}/${deliveryId}/start-journey`,
      { transporterId }, // Send transporterId in the request body
      {
        headers: {
          Authorization: `Bearer ${getToken()}`, // Keep this for consistency, though not used without middleware
        },
      }
    );
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to start journey' };
  }
};
export const getDeliveriesByDonorId = async (donorId, status = '') => {
  try {
    const url = status
      ? `${API_URL}/donor/${donorId}?status=${status}`
      : `${API_URL}/donor/${donorId}`;
    const response = await axios.get(url, {
      headers: {
      },
    });
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch deliveries by donor' };
  }
};

// New API call for fetching deliveries by recipient ID
export const getDeliveriesByRecipientId = async (recipientId, status = '') => {
  try {
    const url = status
      ? `${API_URL}/recipient/${recipientId}?status=${status}`
      : `${API_URL}/recipient/${recipientId}`;
    const response = await axios.get(url, {
      headers: {
      },
    });
    return response;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch deliveries by recipient' };
  }
};