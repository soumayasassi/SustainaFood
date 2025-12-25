import React, { useEffect, useState } from 'react';
import '../assets/styles/Alert.css';

const Alert = ({ type = 'success', message, onClose, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 500); // Delay to allow animation
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return visible ? (
    <div className={`alert alert-${type} show`}>
      <span className="alert-icon"></span>
      <div className="alert-text">{message}</div>
      <span className="alert-close" onClick={() => setVisible(false)}>×</span>
    </div>
  ) : null;
};

export default Alert;
