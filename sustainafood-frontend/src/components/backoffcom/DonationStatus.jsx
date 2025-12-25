import "/src/assets/styles/backoffcss/donationStatus.css";
import { FaApple, FaFacebook, FaPaypal, FaGithub } from "react-icons/fa";
import { SiFigma } from "react-icons/si";

import { FaStore, FaCarrot, FaHandsHelping, FaUtensils, FaTruck } from "react-icons/fa";

const donations = [
  { name: "Monoprix", category: "Supermarket Donations", progress: 54, icon: <FaStore size={16} color="red" /> },
  { name: "Supermarket", category: "Fresh Produce", progress: 86, icon: <FaCarrot size={16} color="orange" /> },
  { name: "Ha Food", category: "Charity Support", progress: 90, icon: <FaHandsHelping size={16} color="green" /> },
  { name: "Pasta Cosi", category: "Restaurant Donations", progress: 37, icon: <FaUtensils size={16} color="brown" /> },
  { name: "First Delivery", category: "Transport & Logistics", progress: 29, icon: <FaTruck size={16} color="blue" /> },
];


const DonationStatus = () => {
  return (
    <div className="donation-status">
      <h3>Donation Status</h3>
      {donations.map((donation, index) => (
        <div key={index} className="donation-item">
          <div className="donation-info">
            {donation.icon}
            <div>
              <p className="donation-name">{donation.name}</p>
              <p className="donation-category">{donation.category}</p>
            </div>
          </div>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${donation.progress}%`, backgroundColor: donation.icon.props.color }}></div>
          </div>
          <p className="progress-text">{donation.progress}%</p>
        </div>
      ))}
    </div>
  );
};


export default DonationStatus;
