import axios from 'axios';

const API_URL='http://localhost:3000/contact';

export const submitContactForm = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/contact`, formData, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('Submission response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error submitting contact form:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to submit form' };
  }
};