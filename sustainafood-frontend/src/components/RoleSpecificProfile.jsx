import React from 'react';
import DonorProfile from './DonorProfile';
import RecipientProfile from './RecipientProfile';
import TransporterProfile from './TransporterProfile';

const RoleSpecificProfile = ({ user }) => {
  if (!user || !user.role) {
    console.log("User or user.role is missing:", user); // Debug log
    return <div>User data not available.</div>;
  }

  console.log("User role in RoleSpecificProfile:", user.role); // Debug log

  switch(user.role) {
    case 'restaurant':
    case 'supermarket':
    case 'personaldonor':
      return <DonorProfile user={user} />;
    case 'ong':
    case 'student':
      return <RecipientProfile user={user} />;
    case 'transporter':
      return <TransporterProfile user={user} />;
    default:
      return <div>Profile not available for this role: {user.role}</div>;
  }
};

export default RoleSpecificProfile;