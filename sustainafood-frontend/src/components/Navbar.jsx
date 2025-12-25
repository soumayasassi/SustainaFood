import { useState, useEffect, useRef } from "react"; // Added useRef
import { Link, useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaBell, FaSignInAlt, FaUserPlus, FaEnvelope } from "react-icons/fa";
import logo from "../assets/images/logooo.png";
import imgmouna from "../assets/images/imgmouna.png";
import { useAuth } from "../contexts/AuthContext";
import { getUserById } from "../api/userService";
import { getNotificationsByReceiver, markNotificationAsRead } from "../api/notificationService";
import "../assets/styles/Navbar.css";

const Navbar = () => {
  const { user: authUser, token, logout } = useAuth();
  const [user, setUser] = useState(authUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Ref to track the messaging dropdown element
  const messagingDropdownRef = useRef(null);

  const profilePhotoUrl = user?.photo ? `http://localhost:3000/${user.photo}` : imgmouna;

  useEffect(() => {
    const fetchUser = async () => {
      if (!authUser || (!authUser._id && !authUser.id)) return;
      const userId = authUser._id || authUser.id;
      try {
        const response = await getUserById(userId);
        setUser(response.data);
      } catch (error) {
        console.error("Backend Error:", error);
      }
    };

    if (authUser) fetchUser();
  }, [authUser]);

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

  useEffect(() => {
    const fetchConversations = async () => {
      if (!authUser) return;
      try {
        const response = await fetch(`http://localhost:3000/messages/conversations`, {
          headers: { "X-User-Id": authUser?._id || authUser?.id },
        });
        if (!response.ok) throw new Error("Error fetching conversations");
        const data = await response.json();
        setConversations(data);
        setFilteredConversations(data);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      }
    };

    fetchConversations();
  }, [authUser]);

  // Handle clicks outside the messaging dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownOpen === "messaging" &&
        messagingDropdownRef.current &&
        !messagingDropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = conversations.filter((conv) => {
      const recipient = conv.participants.find((p) => p._id !== (authUser?._id || authUser?.id));
      return recipient?.name.toLowerCase().includes(query);
    });
    setFilteredConversations(filtered);
  };

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

  const handleLogout = () => {
    logout();
    navigate("/login");
    localStorage.clear();
  };

  const isDonner = user?.role === "restaurant" || user?.role === "supermarket" || user?.role === "personaldonor";
  const isRecipient = user?.role === "ong" || user?.role === "student";
  const isAdmin = user?.role === "admin";
  const isTransporter = user?.role === "transporter";

  // Calculate total unread messages
  const totalUnreadMessages = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);

  return (
    <nav className="navbarfront">
      <div className="logo-container">
        <img src={logo || "/placeholder.svg"} alt="SustainaFood Logo" className="logo" />
        <h1 className="title">SustainaFood</h1>
      </div>

      <div
        className={`menu-toggle ${mobileMenuOpen ? "open" : ""}`}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>

      <ul className={`nav-links ${mobileMenuOpen ? "open" : ""}`}>
        <Link to="/" className="nav-link">
          Home
        </Link>
        <Link to="/about" className="nav-link">
          About
        </Link>
        <Link to="/contact" className="nav-link">
          Contact
        </Link>

        {authUser ? (
          <>
            {!isTransporter && (
              <div
                className="dropdown"
                onMouseEnter={() => setDropdownOpen("donations")}
                onMouseLeave={() => setDropdownOpen(null)}
              >
                <span className="dropdown-toggle">Donations</span>
                {dropdownOpen === "donations" && (
                  <div className="dropdown-content">
                    <Link to="/ListOfDonations">List of Donations</Link>
                    <Link to="/ListOfRequests">List of Requests</Link>
                    {isRecipient && <Link to="/myrequest">My Requests</Link>}
                    {isDonner && <Link to="/mydonations">My Donations</Link>}
                    {isDonner && <Link to="/addDonation">Add Donation</Link>}
                    {isRecipient && <Link to="/addDonation">Add Request</Link>}
                    {isDonner && <Link to="/DonationRecommendations">Donation Recommendations</Link>}
                    {isDonner && <Link to={`/donor/${user?._id || user?.id}/requests`}>My Donation Transactions</Link>}
                    {isRecipient && <Link to={`/recipient/${user?._id || user?.id}/transactions`}>My Requests Transactions</Link>}
                  </div>
                )}
              </div>
            )}
            <div
              className="dropdown"
              onMouseEnter={() => setDropdownOpen("transporter")}
              onMouseLeave={() => setDropdownOpen(null)}
            >
              <span className="dropdown-toggle">Transporter</span>
              {dropdownOpen === "transporter" && (
                <div className="dropdown-content">
                  {isTransporter && <Link to={`/transporter/${user?._id || user?.id}/dashboard`}>Transporter Dashboard</Link>}
                  {isTransporter && <Link to={`/deliveries/${user?._id || user?.id}`}>Assigned Deliveries</Link>}
                  {isTransporter && <Link to="#">Route Optimization</Link>}
                  {!isTransporter && <Link to="/Deliveries">Deliveries</Link>}
                </div>
              )}
            </div>
            {!isTransporter && (
              <div
                className="dropdown"
                onMouseEnter={() => setDropdownOpen("analytics")}
                onMouseLeave={() => setDropdownOpen(null)}
              >
                <span className="dropdown-toggle">Analytics & Reporting</span>
                {dropdownOpen === "analytics" && (
                  <div className="dropdown-content">
                    {isRecipient && <Link to="/analytics">Request Statistics</Link>}
                    {isDonner && <Link to="/analytics">Donation Statistics</Link>}
                    <Link to="/PersonalStatus">Personal Stats</Link>
                    <Link to="/Preduction">Prediction</Link>
                  </div>
                )}
              </div>
            )}
            <div className="messenger-dropdown">
      <span
        className="messenger-dropdown-toggle"
        onClick={() => setDropdownOpen(dropdownOpen === "messaging" ? null : "messaging")}
      >
        <FaEnvelope />
        {totalUnreadMessages > 0 && <span className="messenger-notification-count">{totalUnreadMessages}</span>}
      </span>
      {dropdownOpen === "messaging" && (
        <div
          className="messenger-notification-dropdown"
          ref={messagingDropdownRef}
          onClick={(e) => e.stopPropagation()} // Prevent click events inside the dropdown from bubbling up
        >
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={handleSearch}
            className="messenger-messaging-search"
          />
          <div className="messenger-messaging-conversations">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => {
                const recipient = conversation.participants.find((p) => p._id !== (authUser?._id || authUser?.id))
                const recipientPhotoUrl = recipient?.photo ? `http://localhost:3000/${recipient.photo}` : imgmouna
                return (
                  <div
                    key={conversation.chatId}
                    className="messenger-conversation-item"
                    //onClick={() => navigate(`/chat/${recipient._id}`)}
                    onClick={() => navigate(`/messaging`)}

                  >
                    <img
                      src={recipientPhotoUrl || "/placeholder.svg"}
                      alt={`Profile photo of ${recipient.name}`}
                      className="messenger-conversation-photo"
                    />
                    <div className="messenger-conversation-info">
                      <h3>{recipient.name}</h3>
                      <p>{conversation.lastMessage?.content || "No messages yet."}</p>
                      <span className="messenger-conversation-time">
                        {conversation.lastMessage
                          ? new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="messenger-unread-count">{conversation.unreadCount}</span>
                      )}
                    </div>
                  </div>
                )
              })
            ) : (
              <p>No conversations found.</p>
            )}
          </div>
        </div>
      )}
    </div>
            <div className="social-icons">
              <div
                className="notification-bell"
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
              >
                <FaBell />
                {notifications.filter((notif) => !notif.isRead).length > 0 && (
                  <span className="notification-count">
                    {notifications.filter((notif) => !notif.isRead).length}
                  </span>
                )}
              </div>
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
            {!isAdmin && (
              <div className="profile-menu" onClick={() => setMenuOpen(!menuOpen)}>
                <img src={profilePhotoUrl || "/placeholder.svg"} alt="Profile" className="profile-img" />
                <div className={`dropdown-menu ${menuOpen ? "active" : ""}`}>
                  <div className="profile-info">
                    <img src={profilePhotoUrl || "/placeholder.svg"} alt="Profile" className="dropdown-img" />
                    <div>
                      <p className="user-name">{user?.name || "Loading..."}</p>
                      <p className="user-email">{user?.email || "Loading..."}</p>
                    </div>
                  </div>
                  <hr />
                  <button onClick={() => navigate("/profile")} className="menu-item">
                    Profile and Visibility
                  </button>
                  <button onClick={() => navigate("/account-settings")} className="menu-item">
                    Account Settings
                  </button>
                  <button onClick={() => navigate("/edit-profile")} className="menu-item">
                    Edit Profile
                  </button>
                  <hr />
                  <button onClick={handleLogout} className="menu-item logout">
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="auth-button signin">
              <FaSignInAlt /> Sign In
            </Link>
            <Link to="/signup" className="auth-button signup">
              <FaUserPlus /> Sign Up
            </Link>
          </div>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;