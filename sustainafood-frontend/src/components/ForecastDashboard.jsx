import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ForecastDashboard = () => {
  const [donationForecast, setDonationForecast] = useState([]);
  const [requestForecast, setRequestForecast] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3000/api/api/forecast/donations?days=7')
      .then(response => setDonationForecast(response.data))
      .catch(error => console.error('Error fetching donation forecast:', error));

    axios.get('http://localhost:3000/api/api/forecast/requests?days=7')
      .then(response => setRequestForecast(response.data))
      .catch(error => console.error('Error fetching request forecast:', error));
  }, []);

  return (
    <div>
      <h2>Prévision des Dons</h2>
      <ul>
        {donationForecast.map((entry, index) => (
          <li key={index}>
            {entry.ds}: Dons Prévu: {entry.yhat.toFixed(2)} (Plage: {entry.yhat_lower.toFixed(2)} - {entry.yhat_upper.toFixed(2)})
          </li>
        ))}
      </ul>

      <h2>Prévision des Demandes</h2>
      <ul>
        {requestForecast.map((entry, index) => (
          <li key={index}>
            {entry.ds}: Demandes Prévu: {entry.yhat.toFixed(2)} (Plage: {entry.yhat_lower.toFixed(2)} - {entry.yhat_upper.toFixed(2)})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ForecastDashboard;