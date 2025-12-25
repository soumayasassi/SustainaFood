import axios from "axios";

export const addDonation = async (donationrData) => {
  return await axios.post('http://localhost:3000/donation/', donationrData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
export const getDonations = async () => {
  return axios.get(`http://localhost:3000/donation/`);
};
export const getDonationById = async (id) => {
  try {
    return await axios.get(`http://localhost:3000/donation/${id}`);
  } catch (error) {
    console.error("Error fetching donation:", error);
    throw error;
  }
};
export const getDonationByRequestId = async (requestId) => {
  try {
    const response = await axios.get(`http://localhost:3000/donation/donations/${requestId}`);
    return response.data; // Return the actual data from the response
  } catch (error) {
    console.error('Error fetching donation:', error.response?.data || error.message);
    throw error; // Re-throw the error for the caller to handle
  }
};

export const getDonationByUserId = async (id) => {
  return axios.get(`http://localhost:3000/donation/user/${id}`);
};
export const getDonationsByUserId = async (id) => {

  return axios.get(`http://localhost:3000/donation/user/${id}`);
}
export const getRequestDonationsByUserId = async (id) => {

  return axios.get(`http://localhost:3000/donation/donor/${id}`);
}
export const deleteDonation = async (id) => {
  return axios.delete(`http://localhost:3000/donation/${id}`);
};
// donationService.js
export const updateDonation = async (id, donationData) => {
  try {
    return await axios.put(`http://localhost:3000/donation/${id}`, donationData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error updating donation:", error.response?.data || error.message);
    throw error;
  }
};