import axios from 'axios';

const API_URL = 'http://localhost:3000/api/feedback';

// Create new feedback
export const createFeedback = async (recipientId, rating, comment, reviewerId, token) => {
  const response = await axios.post(
    API_URL,
    { reviewer: reviewerId, recipient: recipientId, rating, comment },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Get feedback for a user
export const getFeedbackByUserId = async (userId) => {
  const response = await axios.get(`${API_URL}/${userId}`);
  return response.data;
};