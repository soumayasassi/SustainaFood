import React from 'react';
import { useAlert } from '../contexts/AlertContext';
import Alert from '../components/Alert'; // Votre composant Alert existant

const AlertDisplay = () => {
  const { alerts, closeAlert } = useAlert();

  return (
    <div className="alert-container">
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          type={alert.type}
          message={alert.message}
          onClose={() => closeAlert(alert.id)}
          duration={5000} // Durée de 5 secondes
        />
      ))}
    </div>
  );
};

export default AlertDisplay;