const express = require('express');
const axios = require('axios');
const router = express.Router();

const FORECAST_API_URL = 'http://localhost:5000'; // Flask API URL

router.get('/api/forecast/donations', async (req, res) => {
  try {
    const days = req.query.days || 30;
    const response = await axios.get(`${FORECAST_API_URL}/forecast/donations?days=${days}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching donation forecast:', error.message);
    res.status(500).json({ error: 'Failed to fetch donation forecast' });
  }
});

router.get('/api/forecast/requests', async (req, res) => {
  try {
    const days = req.query.days || 30;
    const response = await axios.get(`${FORECAST_API_URL}/forecast/requests?days=${days}`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching request forecast:', error.message);
    res.status(500).json({ error: 'Failed to fetch request forecast' });
  }
});

module.exports = router;