import { FaSearch, FaGlobe, FaMoon, FaBell, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getUserById } from "../../api/userService";
import { getNotificationsByReceiver, markNotificationAsRead } from "../../api/notificationService"; // Import des services de notification
import imgmouna from "../../assets/images/imgmouna.png"; // Image par défaut
import "/src/assets/styles/backoffcss/navbar.css";

const Navbar = ({ setSearchQuery }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQueryLocal] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false); // État pour le menu déroulant des notifications
  const { user: authUser, token, logout } = useAuth();
  const [user, setUser] = useState(authUser);
  const [notifications, setNotifications] = useState([]); // État pour stocker les notifications

  // Récupérer les détails de l’admin
  useEffect(() => {
    const fetchAdminDetails = async () => {
      if (authUser && (authUser._id || authUser.id)) {
        try {
          const response = await getUserById(authUser._id || authUser.id);
          setUser(response.data);
        } catch (error) {
          console.error("Error fetching admin details:", error);
        }
      }
    };
    fetchAdminDetails();
  }, [authUser]);

  // Récupérer les notifications pour l’admin
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!authUser || !token) return;
      const userId = authUser._id || authUser.id;
      if (!userId) return;

      try {
        const response = await getNotificationsByReceiver(userId, token);
        setNotifications(response.notifications || []);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, [authUser, token]);

  // Marquer une notification comme lue
  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId, token);
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleSearch = (e) => {
    setSearchQueryLocal(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(searchQuery.trim());
    if (searchQuery.trim()) {
      navigate(`${location.pathname}?search=${searchQuery}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const profilePhotoUrl = user?.photo ? `http://localhost:3000/${user.photo}` : null;

  return (
    <div className="navbar">
      {/* Barre de recherche */}
      <form className="search-container" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearch}
        />
        <button type="submit">
          <FaSearch />
        </button>
      </form>

      {/* Icônes de la navbar */}
      <div className="navbar-actions">
        <FaGlobe className="icon globe" />
        <FaMoon className="icon moon" />

        {/* Notification Bell avec Dropdown */}
        <div className="notification-container">
          <FaBell
            className="icon bell"
            onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
          />
          {notifications.filter((notif) => !notif.isRead).length > 0 && (
            <span className="badge">
              {notifications.filter((notif) => !notif.isRead).length}
            </span>
          )}
          {notificationDropdownOpen && (
            <div className="notification-dropdown">
              {notifications.length > 0 ? (
                notifications.map((notification) => {
                  const senderPhotoUrl = notification.sender?.photo
                    ? `http://localhost:3000/${notification.sender.photo}`
                    : imgmouna;

                  return (
                    <div
                      key={notification._id}
                      className={`notification-item ${notification.isRead ? "read" : "unread"}`}
                      onClick={() => handleMarkAsRead(notification._id)}
                    >
                      <img
                        src={senderPhotoUrl}
                        alt="Sender"
                        className="notification-avatar"
                        onError={(e) => (e.target.src = imgmouna)}
                      />
                      <div className="notification-content">
                        <p>
                          <strong>{notification.sender?.name || "Unknown User"}</strong>{" "}
                          {notification.message}
                        </p>
                        <small>{new Date(notification.createdAt).toLocaleString()}</small>
                      </div>
                      {!notification.isRead && <div className="notification-status"></div>}
                    </div>
                  );
                })
              ) : (
                <div className="notification-item">
                  <p>No notifications</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Dropdown Menu */}
        <div className="profile-menu" onClick={() => setMenuOpen(!menuOpen)}>
          {profilePhotoUrl ? (
            <img src={profilePhotoUrl} alt="Profile" className="profile-img" />
          ) : (
            <FaUserCircle className="icon user" />
          )}
          <div className={`dropdown-menu ${menuOpen ? "active" : ""}`}>
            <div className="profile-info">
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt="Profile" className="dropdown-img" />
              ) : (
                <FaUserCircle className="dropdown-img" />
              )}
              <div>
                <p className="user-name">{user?.name || "Loading..."}</p>
                <p className="user-email">{user?.email || "Loading..."}</p>
              </div>
            </div>
            <hr />
            <button className="menu-item" onClick={() => navigate("/admin-profile")}>
              Your account
            </button>
            <hr />
            <button onClick={handleLogout} className="menu-item logout">
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;