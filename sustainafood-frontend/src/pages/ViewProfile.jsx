import { useEffect, useState } from 'react';
import '../assets/styles/Profile.css';
import pdp from '../assets/images/pdp.png';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import edit from '../assets/images/edit.png';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getUserById, getUserGamificationData } from "../api/userService";
import { useAuth } from "../contexts/AuthContext";
import RoleSpecificProfile from '../components/RoleSpecificProfile';
import { FaEdit, FaPlus } from "react-icons/fa";
import StarRating from '../components/StarRating';
import { createFeedback, getFeedbackByUserId } from '../api/feedbackService';

const ViewProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user: authUser, token, clearWelcomeMessage } = useAuth();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [newFeedback, setNewFeedback] = useState({
    rating: 0,
    comment: '',
  });
  const [feedbackError, setFeedbackError] = useState("");
  const [gamificationData, setGamificationData] = useState({ rank: null, score: 0 });
  const [gamificationError, setGamificationError] = useState("");

  const isOwnProfile = authUser && (authUser._id === id || authUser.id === id);

  useEffect(() => {
    document.title = `SustainaFood - ${isOwnProfile ? 'My Profile' : 'Profile'}`;
    return () => {
      document.title = 'SustainaFood';
    };
  }, [isOwnProfile]);

  useEffect(() => {
    const fetchUserAndFeedback = async () => {
      if (!id) {
        setError("No user ID provided");
        return;
      }

      try {
        const userResponse = await getUserById(id);
        setUser(userResponse.data);
        setDescription(userResponse.data.description || "");
        if (isOwnProfile && userResponse.data.welcomeMessage) {
          setWelcomeMessage(userResponse.data.welcomeMessage);
        }

        const feedbackResponse = await getFeedbackByUserId(id);
        setFeedbacks(feedbackResponse);

        try {
          const gamificationResponse = await getUserGamificationData(id);
          setGamificationData({
            rank: gamificationResponse.rank,
            score: gamificationResponse.score,
          });
          setGamificationError("");
        } catch (gamificationErr) {
          console.error("Error fetching gamification data:", gamificationErr);
          setGamificationError(
            gamificationErr.response?.data?.error || "Failed to load gamification data."
          );
          setGamificationData({ rank: null, score: 0 });
        }
      } catch (error) {
        console.error("Error fetching user or feedback:", error);
        setError("Failed to load user profile or feedback");
      }
    };

    fetchUserAndFeedback();
  }, [id, isOwnProfile]);

  useEffect(() => {
    if (welcomeMessage) {
      const timer = setTimeout(() => {
        setWelcomeMessage("");
        if (isOwnProfile) {
          clearWelcomeMessage();
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [welcomeMessage, clearWelcomeMessage, isOwnProfile]);

  const handleSave = async () => {
    try {
      // Assuming onUpdateDescription is defined elsewhere
      await onUpdateDescription(id, description);
      setUser(prevUser => ({ ...prevUser, description }));
      setIsEditing(false);
      setDescriptionError("");
    } catch (error) {
      console.error("Error updating description:", error);
      setDescriptionError("Failed to update description. Please try again.");
    }
  };

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
      const reviewerId = authUser._id || authUser.id;
      const feedback = await createFeedback(
        id,
        newFeedback.rating,
        newFeedback.comment,
        reviewerId,
        token
      );
      setFeedbacks([feedback, ...feedbacks]);
      setNewFeedback({ rating: 0, comment: '' });
      setFeedbackError('');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFeedbackError(error.message || 'Failed to submit feedback. Please try again.');
    }
  };

  if (error) {
    return (
      <>
        <Navbar />
        <div className="pff-container-profile">
          <p className="pff-error-message">{error}</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="pff-container-profile">
          <p>Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  const profilePhotoUrl = user?.photo ? `http://localhost:3000/${user.photo}` : pdp;

  const getTrophySvg = (rank) => {
    if (rank === 1) {
      return (
        <svg className="pff-winner-icon pff-winner-trophy" viewBox="0 0 1024 1024" width="160" height="160">
          <path d="M469.333333 682.666667h85.333334v128h-85.333334zM435.2 810.666667h153.6c4.693333 0 8.533333 3.84 8.533333 8.533333v34.133333h-170.666666v-34.133333c0-4.693333 3.84-8.533333 8.533333-8.533333z" fill="#ea9518"></path>
          <path d="M384 853.333333h256a42.666667 42.666667 0 0 1 42.666667 42.666667v42.666667H341.333333v-42.666667a42.666667 42.666667 0 0 1 42.666667-42.666667z" fill="#6e4a32"></path>
          <path d="M213.333333 256v85.333333a42.666667 42.666667 0 0 0 85.333334 0V256H213.333333zM170.666667 213.333333h170.666666v128a85.333333 85.333333 0 1 1-170.666666 0V213.333333zM725.333333 256v85.333333a42.666667 42.666667 0 0 0 85.333334 0V256h-85.333334z m-42.666666-42.666667h170.666666v128a85.333333 85.333333 0 1 1-170.666666 0V213.333333z" fill="#f4ea2a"></path>
          <path d="M298.666667 85.333333h426.666666a42.666667 42.666667 0 0 1 42.666667 42.666667v341.333333a256 256 0 1 1-512 0V128a42.666667 42.666667 0 0 1 42.666667-42.666667z" fill="#f2be45"></path>
          <path d="M512 469.333333l-100.309333 52.736 19.157333-111.701333-81.152-79.104 112.128-16.298667L512 213.333333l50.176 101.632 112.128 16.298667-81.152 79.104 19.157333 111.701333z" fill="#FFF2A0"></path>
        </svg>
      );
    } else if (rank === 2) {
      return (
        <svg className="pff-winner-icon pff-winner-trophy" viewBox="0 0 1024 1024" width="160" height="160">
          <path d="M469.333333 682.666667h85.333334v128h-85.333334zM435.2 810.666667h153.6c4.693333 0 8.533333 3.84 8.533333 8.533333v34.133333h-170.666666v-34.133333c0-4.693333 3.84-8.533333 8.533333-8.533333z" fill="#A9A9A9"></path>
          <path d="M384 853.333333h256a42.666667 42.666667 0 0 1 42.666667 42.666667v42.666667H341.333333v-42.666667a42.666667 42.666667 0 0 1 42.666667-42.666667z" fill="#6e4a32"></path>
          <path d="M213.333333 256v85.333333a42.666667 42.666667 0 0 0 85.333334 0V256H213.333333zM170.666667 213.333333h170.666666v128a85.333333 85.333333 0 1 1-170.666666 0V213.333333zM725.333333 256v85.333333a42.666667 42.666667 0 0 0 85.333334 0V256h-85.333334z m-42.666666-42.666667h170.666666v128a85.333333 85.333333 0 1 1-170.666666 0V213.333333z" fill="#D3D3D3"></path>
          <path d="M298.666667 85.333333h426.666666a42.666667 42.666667 0 0 1 42.666667 42.666667v341.333333a256 256 0 1 1-512 0V128a42.666667 42.666667 0 0 1 42.666667-42.666667z" fill="#C0C0C0"></path>
          <path d="M512 469.333333l-100.309333 52.736 19.157333-111.701333-81.152-79.104 112.128-16.298667L512 213.333333l50.176 101.632 112.128 16.298667-81.152 79.104 19.157333 111.701333z" fill="#FFFFFF"></path>
        </svg>
      );
    } else if (rank === 3) {
      return (
        <svg className="pff-winner-icon pff-winner-trophy" viewBox="0 0 1024 1024" width="160" height="160">
          <path d="M469.333333 682.666667h85.333334v128h-85.333334zM435.2 810.666667h153.6c4.693333 0 8.533333 3.84 8.533333 8.533333v34.133333h-170.666666v-34.133333c0-4.693333 3.84-8.533333 8.533333-8.533333z" fill="#B87333"></path>
          <path d="M384 853.333333h256a42.666667 42.666667 0 0 1 42.666667 42.666667v42.666667H341.333333v-42.666667a42.666667 42.666667 0 0 1 42.666667-42.666667z" fill="#6e4a32"></path>
          <path d="M213.333333 256v85.333333a42.666667 42.666667 0 0 0 85.333334 0V256H213.333333zM170.666667 213.333333h170.666666v128a85.333333 85.333333 0 1 1-170.666666 0V213.333333zM725.333333 256v85.333333a42.666667 42.666667 0 0 0 85.333334 0V256h-85.333334z m-42.666666-42.666667h170.666666v128a85.333333 85.333333 0 1 1-170.666666 0V213.333333z" fill="#E4A362"></path>
          <path d="M298.666667 85.333333h426.666666a42.666667 42.666667 0 0 1 42.666667 42.666667v341.333333a256 256 0 1 1-512 0V128a42.666667 42.666667 0 0 1 42.666667-42.666667z" fill="#CD7F32"></path>
          <path d="M512 469.333333l-100.309333 52.736 19.157333-111.701333-81.152-79.104 112.128-16.298667L512 213.333333l50.176 101.632 112.128 16.298667-81.152 79.104 19.157333 111.701333z" fill="#FFF2A0"></path>
        </svg>
      );
    } else {
      return null;
    }
  };

  const getMedalSvg = (rank) => {
    if (rank === 1) {
      return (
        <svg className="pff-winner-icon pff-winner-medals pff-winner-slide-in-top" viewBox="0 0 1024 1024" width="80" height="80">
          <path d="M896 42.666667h-128l-170.666667 213.333333h128z" fill="#FF4C4C"></path>
          <path d="M768 42.666667h-128l-170.666667 213.333333h128z" fill="#3B8CFF"></path>
          <path d="M640 42.666667h-128L341.333333 256h128z" fill="#F1F1F1"></path>
          <path d="M128 42.666667h128l170.666667 213.333333H298.666667z" fill="#FF4C4C"></path>
          <path d="M256 42.666667h128l170.666667 213.333333h-128z" fill="#3B8CFF"></path>
          <path d="M384 42.666667h128l170.666667 213.333333h-128z" fill="#FBFBFB"></path>
          <path d="M298.666667 256h426.666666v213.333333H298.666667z" fill="#E3A815"></path>
          <path d="M512 661.333333m-320 0a320 320 0 1 0 640 0 320 320 0 1 0-640 0Z" fill="#FDDC3A"></path>
          <path d="M512 661.333333m-256 0a256 256 0 1 0 512 0 256 256 0 1 0-512 0Z" fill="#E3A815"></path>
          <path d="M512 661.333333m-213.333333 0a213.333333 213.333333 0 1 0 426.666666 0 213.333333 213.333333 0 1 0-426.666666 0Z" fill="#F5CF41"></path>
          <path d="M277.333333 256h469.333334a21.333333 21.333333 0 0 1 0 42.666667h-469.333334a21.333333 0 0 1 0-42.666667z" fill="#D19A0E"></path>
          <path d="M277.333333 264.533333a12.8 12.8 0 1 0 0 25.6h469.333334a12.8 12.8 0 1 0 0-25.6h-469.333334z m0-17.066666h469.333334a29.866667 29.866667 0 1 1 0 59.733333h-469.333334a29.866667 29.866667 0 1 1 0-59.733333z" fill="#F9D525"></path>
          <path d="M512 746.666667l-100.309333 52.736 19.157333-111.701334-81.152-79.104 112.128-16.298666L512 490.666667l50.176 101.632 112.128 16.298666-81.152 79.104 19.157333 111.701334z" fill="#FFF2A0"></path>
        </svg>
      );
    } else if (rank === 2) {
      return (
        <svg className="pff-winner-icon pff-winner-medals pff-winner-slide-in-top" viewBox="0 0 1024 1024" width="80" height="80">
          <path d="M896 42.666667h-128l-170.666667 213.333333h128z" fill="#FF4C4C"></path>
          <path d="M768 42.666667h-128l-170.666667 213.333333h128z" fill="#3B8CFF"></path>
          <path d="M640 42.666667h-128L341.333333 256h128z" fill="#F1F1F1"></path>
          <path d="M128 42.666667h128l170.666667 213.333333H298.666667z" fill="#FF4C4C"></path>
          <path d="M256 42.666667h128l170.666667 213.333333h-128z" fill="#3B8CFF"></path>
          <path d="M384 42.666667h128l170.666667 213.333333h-128z" fill="#FBFBFB"></path>
          <path d="M298.666667 256h426.666666v213.333333H298.666667z" fill="#C0C0C0"></path>
          <path d="M512 661.333333m-320 0a320 320 0 1 0 640 0 320 320 0 1 0-640 0Z" fill="#D3D3D3"></path>
          <path d="M512 661.333333m-256 0a256 256 0 1 0 512 0 256 256 0 1 0-512 0Z" fill="#C0C0C0"></path>
          <path d="M512 661.333333m-213.333333 0a213.333333 213.333333 0 1 0 426.666666 0 213.333333 213.333333 0 1 0-426.666666 0Z" fill="#D3D3D3"></path>
          <path d="M277.333333 256h469.333334a21.333333 21.333333 0 0 1 0 42.666667h-469.333334a21.333333 0 0 1 0-42.666667z" fill="#A9A9A9"></path>
          <path d="M277.333333 264.533333a12.8 12.8 0 1 0 0 25.6h469.333334a12.8 12.8 0 1 0 0-25.6h-469.333334z m0-17.066666h469.333334a29.866667 29.866667 0 1 1 0 59.733333h-469.333334a29.866667 29.866667 0 1 1 0-59.733333z" fill="#B0B0B0"></path>
          <path d="M512 746.666667l-100.309333 52.736 19.157333-111.701334-81.152-79.104 112.128-16.298666L512 490.666667l50.176 101.632 112.128 16.298666-81.152 79.104 19.157333 111.701334z" fill="#FFFFFF"></path>
        </svg>
      );
    } else if (rank === 3) {
      return (
        <svg className="pff-winner-icon pff-winner-medals pff-winner-slide-in-top" viewBox="0 0 1024 1024" width="80" height="80">
          <path d="M896 42.666667h-128l-170.666667 213.333333h128z" fill="#FF4C4C"></path>
          <path d="M768 42.666667h-128l-170.666667 213.333333h128z" fill="#3B8CFF"></path>
          <path d="M640 42.666667h-128L341.333333 256h128z" fill="#F1F1F1"></path>
          <path d="M128 42.666667h128l170.666667 213.333333H298.666667z" fill="#FF4C4C"></path>
          <path d="M256 42.666667h128l170.666667 213.333333h-128z" fill="#3B8CFF"></path>
          <path d="M384 42.666667h128l170.666667 213.333333h-128z" fill="#FBFBFB"></path>
          <path d="M298.666667 256h426.666666v213.333333H298.666667z" fill="#CD7F32"></path>
          <path d="M512 661.333333m-320 0a320 320 0 1 0 640 0 320 320 0 1 0-640 0Z" fill="#E4A362"></path>
          <path d="M512 661.333333m-256 0a256 256 0 1 0 512 0 256 256 0 1 0-512 0Z" fill="#CD7F32"></path>
          <path d="M512 661.333333m-213.333333 0a213.333333 213.333333 0 1 0 426.666666 0 213.333333 213.333333 0 1 0-426.666666 0Z" fill="#E4A362"></path>
          <path d="M277.333333 256h469.333334a21.333333 21.333333 0 0 1 0 42.666667h-469.333334a21.333333 0 0 1 0-42.666667z" fill="#B87333"></path>
          <path d="M277.333333 264.533333a12.8 12.8 0 1 0 0 25.6h469.333334a12.8 12.8 0 1 0 0-25.6h-469.333334z m0-17.066666h469.333334a29.866667 29.866667 0 1 1 0 59.733333h-469.333334a29.866667 29.866667 0 1 1 0-59.733333z" fill="#C68E55"></path>
          <path d="M512 746.666667l-100.309333 52.736 19.157333-111.701334-81.152-79.104 112.128-16.298666L512 490.666667l50.176 101.632 112.128 16.298666-81.152 79.104 19.157333 111.701334z" fill="#FFF2A0"></path>
        </svg>
      );
    } else {
      return null;
    }
  };

  return (
    <>
      <Navbar />
      <div className="pff-container-profile">
        {welcomeMessage && isOwnProfile && (
          <div className="pff-welcome-message">
            <div className="pff-welcome-message-content">
              <div className="pff-welcome-icon">🎉</div>
              <span>{welcomeMessage}</span>
            </div>
            <div className="pff-confetti-container">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={`pff-confetti pff-confetti-${i % 5}`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${3 + Math.random() * 2}s`,
                  }}
                ></div>
              ))}
            </div>
          </div>
        )}
        <header>
          <div className="pff-profile-header">
            <h1>{isOwnProfile ? "My Profile" : `${user.name}'s Profile`}</h1>
            <div className="pff-date-switcher">
              {isOwnProfile ? (
                <button className='pff-btnProfile'>
                  <Link to="/edit-profile">
                    <img style={{ marginRight: '8px', marginTop: '6px' }} width="18px" src={edit} alt="Edit Profile" />
                  </Link>
                  Edit
                </button>
              ) : (
                <button
                  className='pff-btnProfile'
                  onClick={() => navigate(`/chat/${id}`)}
                  disabled={!authUser}
                  aria-label={`Message ${user.name}`}
                >
                  Message
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="pff-main">
          <div className="pff-left-column">
            <div className="pff-profile-card">
              <div className="pff-card-white">
                <div className="pff-profile-pic">
                  <img src={profilePhotoUrl} alt="Profile" />
                </div>
                <div className="pff-bottom">
                  <div className="pff-content">
                    <div style={{ display: "flex" }}>
                      <div><span className="pff-name">Description</span></div>
                      {isOwnProfile && (
                        <div>
                          <button
                            className='pff-bottom-editdesc pff-name'
                            onClick={() => {
                              setIsEditing(true);
                              setDescriptionError("");
                            }}
                          >
                            {description ? <FaEdit /> : <FaPlus />}
                          </button>
                        </div>
                      )}
                    </div>
                    {isOwnProfile && isEditing ? (
                      <input
                        type="text"
                        className="pff-description-input"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={handleSave}
                        placeholder="Enter your description"
                        autoFocus
                      />
                    ) : (
                      <span className="pff-about-me">{description || "No description yet..."}</span>
                    )}
                    {descriptionError && isOwnProfile && (
                      <p className="pff-error-message">{descriptionError}</p>
                    )}
                  </div>
                  <div className="pff-bottom-bottom">
                    <h1 className='pff-userrole'>
                      {user?.role || 'Loading...'}
                    </h1>
                  </div>
                </div>
              </div>
            </div>

            <div className="pff-detailed-info">
              <h3>Detailed Information</h3>
              <ul>
                <li><strong>Name:</strong> {user?.name || 'Loading...'}</li>
                <li><strong>Email:</strong> {user?.email || 'Not provided'}</li>
                <li><strong>Phone:</strong> {user?.phone || 'Not provided'}</li>
                <li><strong>Address:</strong> {user?.address || 'Not provided'}</li>
              </ul>
            </div>
          </div>

          <div className="pff-center-column">
            <RoleSpecificProfile user={user} />
          </div>

          <div className="pff-right-column">
            <div className="pff-winner-cards">
              <div
                className={`pff-winner-outlinePage ${
                  gamificationData.rank === 1
                    ? "pff-winner-outlinePage-gold"
                    : gamificationData.rank === 2
                    ? "pff-winner-outlinePage-silver"
                    : gamificationData.rank === 3
                    ? "pff-winner-outlinePage-bronze"
                    : "pff-winner-outlinePage-none"
                }`}
              >
                {gamificationData.rank <= 3 && gamificationData.rank > 0 ? getTrophySvg(gamificationData.rank) : null}
                {gamificationError ? (
                  <p className="pff-winner-ranking_number">{gamificationError}</p>
                ) : gamificationData.rank === 0 ? (
                  <p
                    className="pff-no-activity-message"
                    dangerouslySetInnerHTML={{
                      __html:
                        user?.role === "transporter"
                          ? "Join the challenge to see your score!<br />No deliveries completed yet!"
                          : user?.role === "student" || user?.role === "ong"
                          ? "Join the challenge to see your score!<br />No requests posted yet!"
                          : user?.role === "restaurant" || user?.role === "supermarket" || user?.role === "personaldonor"
                          ? "Join the challenge to see your score!<br />No donations made yet!"
                          : "Gamification not applicable",
                    }}
                  />
                ) : (
                  <p className="pff-winner-ranking_number">
                    {gamificationData.rank !== null ? gamificationData.rank : "N/A"}
                    <span className="pff-winner-ranking_word">
                      {gamificationData.rank === 1
                        ? "st"
                        : gamificationData.rank === 2
                        ? "nd"
                        : gamificationData.rank === 3
                        ? "rd"
                        : "th"}
                    </span>
                  </p>
                )}
                <div className="pff-winner-splitLine"></div>
                <svg className="pff-winner-icon pff-winner-userAvatar" viewBox="0 0 1024 1024" width="25" height="25">
                  <path
                    d="M512 0C228.693 0 0 228.693 0 512s228.693 512 512 512 512-228.693 512-512S795.307 0 512 0z m0 69.973c244.053 0 442.027 197.973 442.027 442.027 0 87.04-25.6 168.96-69.973 237.227-73.387-78.507-170.667-133.12-281.6-151.893 69.973-34.133 119.467-105.813 119.467-187.733 0-116.053-93.867-209.92-209.92-209.92s-209.92 93.867-209.92 209.92c0 83.627 47.787 155.307 119.467 187.733-110.933 20.48-208.213 75.093-281.6 153.6-44.373-68.267-69.973-150.187-69.973-238.933 0-244.053 197.973-442.027 442.027-442.027z"
                    fill="#8a8a8a"
                  ></path>
                </svg>
                <p className="pff-winner-userName">{user?.name || 'Loading...'}</p>
              </div>
              <div className="pff-winner-detailPage">
                {getMedalSvg(gamificationData.rank)}
                <div className="pff-winner-gradesBox">
                  <svg className="pff-winner-icon pff-winner-gradesIcon" viewBox="0 0 1024 1024" width="60" height="60">
                    <path d="M382.6 805H242.2c-6.7 0-12.2-5.5-12.2-12.2V434.3c0-6.7 5.5-12.2 12.2-12.2h140.4c6.7 0 12.2 5.5 12.2 12.2v358.6c0 6.6-5.4 12.1-12.2 12.1z" fill="#ea9518"></path>
                    <path d="M591.1 805H450.7c-6.7 0-12.2-5.5-12.2-12.2V254.9c0-6.7 5.5-12.2 12.2-12.2h140.4c6.7 0 12.2 5.5 12.2 12.2v537.9c0 6.7-5.5 12.2-12.2 12.2z" fill="#f2be45"></path>
                    <path d="M804.4 805H663.9c-6.7 0-12.2-5.5-12.2-12.2v-281c0-6.7 5.5-12.2 12.2-12.2h140.4c6.7 0 12.2 5.5 12.2 12.2v281c0.1 6.7-5.4 12.2-12.1 12.2z" fill="#ea9518"></path>
                  </svg>
                  <p className="pff-winner-gradesBoxLabel">
                    {user?.role === "transporter"
                      ? "DELIVERY SCORE"
                      : user?.role === "student" || user?.role === "ong"
                      ? "REQUEST SCORE"
                      : "DONATION SCORE"}
                  </p>
                  <p className="pff-winner-gradesBoxNum">{gamificationData.score || 0}</p>
                </div>
              </div>
            </div>

            <div className="pff-inbox-section">
              <h3>Feedbacks</h3>
              {!isOwnProfile && (
                <div className="pff-feedback-form">
                  <h4>Add Feedback</h4>
                  <form onSubmit={handleFeedbackSubmit}>
                    <div className="pff-form-group">
                      <label>Rating:</label>
                      <StarRating
                        rating={newFeedback.rating}
                        setRating={(rating) => setNewFeedback({ ...newFeedback, rating })}
                        interactive={true}
                      />
                    </div>
                    <div className="pff-form-group">
                      <label>Comment:</label>
                      <textarea
                        value={newFeedback.comment}
                        onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
                        placeholder="Write your feedback here..."
                        rows="3"
                      />
                    </div>
                    {feedbackError && <p className="pff-error-message">{feedbackError}</p>}
                    <button type="submit" className="pff-submit-feedback-btn">Submit Feedback</button>
                  </form>
                </div>
              )}
              <div className="pff-feedback-container">
                {feedbacks.length > 0 ? (
                  <div className="pff-feedback-scroll">
                    {feedbacks.map((feedback) => (
                      <div className="pff-feedback-card" key={feedback._id}>
                        <div className="pff-message">
                          <div className="pff-message-header pff-feedback-tip">
                            <img
                              src={feedback.reviewer?.photo ? `http://localhost:3000/${feedback.reviewer.photo}` : pdp}
                              alt="Avatar"
                            />
                            <div>
                              <strong>{feedback.reviewer?.name || "Anonymous"}</strong>
                              <StarRating rating={feedback.rating} interactive={false} />
                              <p>Satisfaction Score: {feedback.satisfactionScore || 'N/A'}</p>
                              <p>{feedback.comment}</p>
                            </div>
                          </div>
                          <span className="pff-time">{new Date(feedback.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No feedback yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ViewProfile;