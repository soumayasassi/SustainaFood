import {
  FaDollarSign,
  FaUserCheck,
  FaUser,
  FaUsers,
  FaUtensils,
  FaBriefcase,
  FaChartLine,
  FaHandHoldingHeart,
  FaTrash,
  FaBoxOpen,
  FaClock,
  FaTruck,
  FaStar, // Added for Average Rating
} from "react-icons/fa"
import "/src/assets/styles/backoffcss/card.css"

const CardStats = ({ title, value, percentage, icon, color, progress }) => {
  const icons = {
    dollar: <FaDollarSign />,
    userCheck: <FaUserCheck />,
    user: <FaUser />,
    users: <FaUsers />,
    utensils: <FaUtensils />,
    briefcase: <FaBriefcase />,
    chart: <FaChartLine />,
    handHoldingHeart: <FaHandHoldingHeart />,
    trash: <FaTrash />, // For Food Waste Prevented
    clock: <FaClock />, // For Expiring Donations
    box: <FaBoxOpen />, // For Total Products
    truck: <FaTruck />, // For Total Deliveries
    star: <FaStar />, // Added for Average Rating
  }

  // Set progress to a minimum of 30% for visual appeal if not specified
  const displayProgress = progress || 30

  // Set percentage color based on value
  const percentageColor =
    percentage && percentage.startsWith("+")
      ? "#4CAF50" // green for positive
      : percentage && percentage.startsWith("-")
        ? "#F44336" // red for negative
        : "#4CAF50" // default green

  return (
    <div className="card" data-color={color}>
      <div className="card-header">
        <div className="icon">{icons[icon]}</div>
        <div className="card-info">
          <h3>{title}</h3>
          <p className="value">{value}</p>
          {percentage && (
            <p className="percentage" style={{ color: percentageColor }}>
              {percentage}
            </p>
          )}
        </div>
      </div>
      <div className="progress-bar">
        <div
          className="progress"
          style={{
            width: `${displayProgress}%`,
            maxWidth: "100%",
            minWidth: "30%",
          }}
        ></div>
      </div>
    </div>
  )
}

export default CardStats