import axios from "axios";
export const createrequests = async (requestData) => {
  return await axios.post('http://localhost:3000/request/', requestData, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
export const createRequestNeedForExistingDonation = async (donationId, requestData) => {
  console.log('Sending request data:', requestData);

  try {
    const response = await axios.post(
      `http://localhost:3000/request/requestdonation/${donationId}`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in createRequestNeedForExistingDonation:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};
export const addDonationToRequest = async (requestId, donationData) => {
  console.log('Sending donation data:', requestId);
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('User not authenticated - No token found');
  }

  console.log('Sending donation data:', donationData);
  console.log('Token:', token);

  try {
    const response = await axios.post(
      `http://localhost:3000/request/addDonationToRequest/${requestId}/donations`,
      donationData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in addDonationToRequest:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const getrequests = async () => {
  return axios.get(`http://localhost:3000/request/`);
};

export const getrequestsback = async () => {
  return axios.get(`http://localhost:3000/request/requests`);
};
export const getRequestsByRecipientId = async (id) => {
  const token = localStorage.getItem('token');
  return axios.get(`http://localhost:3000/request/recipient/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};
export const getRequestById = async (id) => {
  try {
    return await axios.get(`http://localhost:3000/request/${id}`);
  } catch (error) {
    console.error("Error fetching request:", error.response?.data || error.message);
    throw error;
  }
};
export const deleteRequest = async (id) => {
  try{
  return await axios.delete(`http://localhost:3000/request/${id}`);
} catch (error) {
    console.error("Error deleting request:", error.response?.data || error.message);
    throw error;
  }
};
export const updateRequest = async (id, RequestData) => {
  console.log(RequestData);
  try{
  return await axios.put(`http://localhost:3000/request/${id}`, RequestData, {
    headers: {
      "Content-Type": "application/json",
    },
  });
} catch (error) {
    console.error("Error updating request:", error.response?.data || error.message);
    throw error;
  }
};

export const getRequestsByDonationId = async (donationId) => {
  const token = localStorage.getItem('token');
  return await axios.get(`http://localhost:3000/request/donation/${donationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
export const updateRequestStatus = async (requestId, status) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('User not authenticated - No token found');
  }

  try {
    const response = await axios.put(
      `http://localhost:3000/request-needs/request/${requestId}/status`,
      { status },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return response;
  } catch (error) {
    console.error('Error updating request status:', error.response?.data || error.message);
    throw error;
  }
};