import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { updateTransporterAvailability, updateTransporterLocation, getUserById } from '../api/userService';
import { getFeedbackByUserId, createFeedback } from '../api/feedbackService';
import { useAuth } from '../contexts/AuthContext';
import LocationPicker from '../components/LocationPicker';
import StarRating from '../components/StarRating';
import pdp from '../assets/images/pdp.png';
import '../assets/styles/TransporterProfile.css';

const TransporterProfile = () => {
  const { id } = useParams(); // Get ID from URL
  const { user: authUser, token } = useAuth();
  const user = authUser; // Logged-in user from AuthContext (localStorage)
  const [profileUser, setProfileUser] = useState(null); // User whose profile is being viewed
  const [isAvailable, setIsAvailable] = useState(true);
  const [location, setLocation] = useState({ type: 'Point', coordinates: [0, 0] });
  const [address, setAddress] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedback, setNewFeedback] = useState({ rating: 0, comment: '' });
  const [feedbackError, setFeedbackError] = useState('');

  const isOwnProfile = !id || (user && (user._id === id || user.id === id)); // No ID or ID matches logged-in user
  const userIdToFetch = id || user?._id || user?.id; // Use URL ID if present, otherwise logged-in user's ID

  // Fetch user data and feedback
  useEffect(() => {
    const fetchData = async () => {
      if (!userIdToFetch) {
        setError('User ID is missing');
        return;
      }

      try {
        // Fetch user data
        const userResponse = await getUserById(userIdToFetch);
        const fetchedUser = userResponse.data;
        setProfileUser(fetchedUser);
        setIsAvailable(fetchedUser.isAvailable !== undefined ? fetchedUser.isAvailable : true);
        if (fetchedUser.location) {
          setLocation(fetchedUser.location);
          setAddress(fetchedUser.address || `Lat: ${fetchedUser.location.coordinates[1].toFixed(6)}, Lon: ${fetchedUser.location.coordinates[0].toFixed(6)}`);
        }

        // Fetch feedback for the user
        const feedbackResponse = await getFeedbackByUserId(userIdToFetch);
        setFeedbacks(feedbackResponse);
      } catch (err) {
        setError(err.message || 'Failed to load profile or feedback');
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [userIdToFetch]);

  // Handle location selection from LocationPicker
  const handleLocationSelect = async (selectedLocation, selectedAddress) => {
    if (!userIdToFetch) {
      setError('User ID is missing');
      return;
    }

    try {
      setLocation(selectedLocation);
      setAddress(selectedAddress);
      setIsMapOpen(false);
      setError(null);

      // Update location in backend
      await updateTransporterLocation(userIdToFetch, {
        location: selectedLocation,
        address: selectedAddress,
      });
    } catch (err) {
      setError(err.message || 'Failed to update location');
      console.error('Location update error:', err);
    }
  };

  // Handle availability toggle
  const handleAvailabilityToggle = async () => {
    if (!userIdToFetch) {
      setError('User ID is missing');
      return;
    }

    try {
      setLoading(true);
      const newAvailability = !isAvailable;
      await updateTransporterAvailability(userIdToFetch, newAvailability);
      setIsAvailable(newAvailability);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to update availability');
      console.error('Availability update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (newFeedback.rating < 1 || newFeedback.rating > 5) {
      setFeedbackError('Please select a rating between 1 and 5 stars');
      return;
    }
    if (!newFeedback.comment.trim()) {
      setFeedbackError('Please enter a comment');
      return;
    }

    try {
      const reviewerId = user._id || user.id;
      const feedback = await createFeedback(userIdToFetch, newFeedback.rating, newFeedback.comment, reviewerId, token);
      setFeedbacks([feedback, ...feedbacks]);
      setNewFeedback({ rating: 0, comment: '' });
      setFeedbackError('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFeedbackError('Failed to submit feedback. Please try again.');
    }
  };

  if (!user) {
    return <p className="error-message">Please log in to access this page.</p>;
  }

  if (!profileUser) {
    return <p className="loading-message">Loading...</p>;
  }

  if (profileUser.role !== 'transporter') {
    return <p className="error-message">Access denied. This page is for transporters only.</p>;
  }

  return (
    <div className="transporter-profile">
      <h3>{isOwnProfile ? 'Transporter Dashboard' : `${profileUser.name}'s Profile`}</h3>
      {error && <p className="error-message">{error}</p>}
      {loading && <p className="loading-message">Updating...</p>}

      <div className="transporter-card">
        <h4>Availability Status</h4>
        <p><strong>Status:</strong> {isAvailable ? 'Available' : 'Unavailable'}</p>
        {isOwnProfile && (
          <button
            className={`availability-btn ${isAvailable ? 'available' : 'unavailable'}`}
            onClick={handleAvailabilityToggle}
            disabled={loading}
          >
            {isAvailable ? 'Set Unavailable' : 'Set Available'}
          </button>
        )}
      </div>

      <div className="transporter-card">
        <h4>Current Location</h4>
        <div>
          <label>📍 Location</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onClick={() => isOwnProfile && setIsMapOpen(true)} // Only clickable if it's the user's own profile
            placeholder="📍 Select Location"
            readOnly
          />
          {isMapOpen && isOwnProfile && (
            <LocationPicker
              isOpen={isMapOpen}
              onClose={() => setIsMapOpen(false)}
              onLocationChange={setLocation}
              onAddressChange={setAddress}
              onSelect={handleLocationSelect}
              initialAddress={address}
            />
          )}
        </div>
        {location.coordinates[0] !== 0 && location.coordinates[1] !== 0 ? (
          <>
            <p><strong>Latitude:</strong> {location.coordinates[1].toFixed(6)}</p>
            <p><strong>Longitude:</strong> {location.coordinates[0].toFixed(6)}</p>
            <div className="map-placeholder">
              <p>Map display coming soon...</p>
            </div>
          </>
        ) : (
          <p>Select a location...</p>
        )}
      </div>

      
    </div>
  );
};

export default TransporterProfile;