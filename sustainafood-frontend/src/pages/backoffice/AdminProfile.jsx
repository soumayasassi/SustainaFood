"use client"

import { useEffect, useState } from "react"
import Sidebar from "../../components/backoffcom/Sidebar"
import Navbar from "../../components/backoffcom/Navbar"
import "../../assets/styles/backoffcss/adminProfile.css" // Import the new CSS file
import { FaCamera, FaEdit, FaTimes, FaSave } from "react-icons/fa"
import { useAuth } from "../../contexts/AuthContext"
import { getUserById, updateUser } from "../../api/userService"

const AdminProfile = () => {
  const { user: authUser, token } = useAuth()
  const [admin, setAdmin] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    photo: "",
  })
  const [profilePhotoFile, setProfilePhotoFile] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editedData, setEditedData] = useState({ ...admin })
  const [errors, setErrors] = useState({})
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Admin Profile";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    if (!token) {
      console.error("No token found. User is not authenticated.")
      return
    }
        const userId = authUser._id || authUser.id;
    const fetchUserData = async () => {
      try {
        if (!authUser || !authUser.id ) {
          console.error("⛔ authUser id is undefined!")
          return
        }
        const response = await getUserById(userId)
        const userData = response.data
        setAdmin({
          name: userData.name || "",
          email: userData.email || "",
          address: userData.address || "",
          phone: userData.phone || "",
          photo: userData.photo ? `http://localhost:3000/${userData.photo}` : "/src/assets/admin.jpg",
        })
      } catch (error) {
        console.error("❌ Backend Error:", error)
      }
    }
    fetchUserData()
  }, [authUser, token])

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setAdmin((prev) => ({
        ...prev,
        photo: URL.createObjectURL(file),
      }))
      setProfilePhotoFile(file)
    }
  }

  const handleSaveImage = async (e) => {
    e.preventDefault()
    try {
      if (!authUser || !authUser.id) {
        console.error("⛔ authUser id is undefined!")
        alert("User authentication error. Please log in again.")
        return
      }
      if (!profilePhotoFile) {
        alert("Please select an image to upload.")
        return
      }
      const formData = new FormData()
      formData.append("photo", profilePhotoFile)
      console.log("Uploading file:", formData.get("photo"))
      const response = await updateUser(authUser.id, formData)
      if (response.status === 200) {
        const updatedUser = response.data
        setAdmin((prev) => ({
          ...prev,
          photo: updatedUser.photo ? `http://localhost:3000/${updatedUser.photo}` : prev.photo,
        }))
        setProfilePhotoFile(null)
        alert("Profile image updated successfully!")
      } else {
        alert("Failed to update profile image. Status: " + response.status)
      }
    } catch (error) {
      console.error("❌ Error updating profile image:", error)
      alert("An error occurred while updating the profile image.")
    }
  }

  const openEditModal = () => {
    setEditedData({ ...admin })
    setErrors({})
    setIsEditModalOpen(true)
  }
  const closeModal = () => {
    setIsEditModalOpen(false)
    setErrors({})
  }

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidPhone = (phone) => {
    const phoneRegex = /^\+?[\d\s-]{7,}$/
    return phoneRegex.test(phone)
  }

  const validateFields = (data) => {
    const newErrors = {}

    if (!data.name) {
      newErrors.name = "Name is required."
    } else if (data.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters."
    }

    if (!data.email) {
      newErrors.email = "Email is required."
    } else if (!isValidEmail(data.email)) {
      newErrors.email = "A valid email is required."
    }

    if (!data.address) {
      newErrors.address = "Address is required."
    }

    if (!data.phone) {
      newErrors.phone = "Phone number is required."
    } else if (!isValidPhone(data.phone)) {
      newErrors.phone = "Invalid phone number format (e.g., +1234567890)."
    }

    return newErrors
  }

  const handleSaveChanges = async () => {
    const validationErrors = validateFields(editedData)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    try {
      if (!authUser || !authUser.id) {
        console.error("⛔ authUser id is undefined!")
        alert("User authentication error. Please log in again.")
        return
      }
      const updatedData = {
        name: editedData.name,
        email: editedData.email,
        address: editedData.address,
        phone: editedData.phone,
      }
      const response = await updateUser(authUser.id, updatedData)
      if (response.status === 200) {
        setAdmin((prev) => ({
          ...prev,
          name: editedData.name,
          email: editedData.email,
          address: editedData.address,
          phone: editedData.phone,
        }))
        alert("Profile updated successfully!")
      } else {
        alert("Failed to update profile. Status: " + response.status)
      }
    } catch (error) {
      console.error("❌ Error updating profile:", error)
      alert("An error occurred while updating the profile.")
    } finally {
      closeModal()
    }
  }

  return (
    <div className="profAttachment-admin-dashboard">
      <Sidebar />
      <div className="profAttachment-profile-container">
        <Navbar />
        <div className="profAttachment-profile-header">
          <h2>My Profile</h2>
          <div className="profAttachment-profile-line"></div>
        </div>
        <div className="profAttachment-profile-card">
          <form onSubmit={handleSaveImage} className="profAttachment-profile-pic-container">
            <div className="profAttachment-profile-pic">
              <img src={admin.photo || "/placeholder.svg"} alt="Profile" />
              <label className="profAttachment-upload-icon">
                <FaCamera />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input" />
              </label>
            </div>
            <button type="submit" className="profAttachment-save-image-btn">
              <FaSave className="profAttachment-save-icon" /> Save Image
            </button>
          </form>
          <div>
            <h2>Name: {admin.name}</h2>
            <p>Email: {admin.email}</p>
            <p>Address: {admin.address}</p>
            <p>Phone Number: {admin.phone}</p>
          </div>
        </div>
        <div className="profAttachment-info-section">
          <div className="profAttachment-section-header">
            <h3>Personal Information</h3>
            <button className="profAttachment-edit-btn" onClick={openEditModal}>
              <FaEdit /> Edit
            </button>
          </div>
          <div className="profAttachment-profile-line"></div>
          <div className="profAttachment-info-grid">
            <div>
              <p className="profAttachment-label">Name</p>
              <p>{admin.name}</p>
            </div>
            <div>
              <p className="profAttachment-label">Email Address</p>
              <p>{admin.email}</p>
            </div>
            <div>
              <p className="profAttachment-label">Address</p>
              <p>{admin.address}</p>
            </div>
            <div>
              <p className="profAttachment-label">Phone Number</p>
              <p>{admin.phone}</p>
            </div>
          </div>
        </div>
        {isEditModalOpen && (
          <div className="profAttachment-modal-overlay">
            <div className="profAttachment-modal-content">
              <div className="profAttachment-modal-header">
                <h3>Edit Personal Information</h3>
                <button className="profAttachment-close-btn" onClick={closeModal}>
                  <FaTimes />
                </button>
              </div>
              <div className="profAttachment-modal-body">
                <label>Name</label>
                <input
                  type="text"
                  value={editedData.name}
                  onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                />
                {errors.name && <p className="profAttachment-error">{errors.name}</p>}
                <label>Email Address</label>
                <input
                  type="email"
                  value={editedData.email}
                  onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                />
                {errors.email && <p className="profAttachment-error">{errors.email}</p>}
                <label>Address</label>
                <input
                  type="text"
                  value={editedData.address}
                  onChange={(e) => setEditedData({ ...editedData, address: e.target.value })}
                />
                {errors.address && <p className="profAttachment-error">{errors.address}</p>}
                <label>Phone Number</label>
                <input
                  type="text"
                  value={editedData.phone}
                  onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                />
                {errors.phone && <p className="profAttachment-error">{errors.phone}</p>}
              </div>
              <div className="profAttachment-modal-footer">
                <button className="profAttachment-save-btn" onClick={handleSaveChanges}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminProfile
