"use client"

import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import pdp from "../assets/images/pdp1.png" // Default fallback image
import "../assets/styles/EditProfile.css" // Import the CSS file
import upload from "../assets/images/upload.png"
import Footer from "../components/Footer"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { getUserById, updateUser } from "../api/userService"
import { FaCamera } from "react-icons/fa"
import { useAlert } from "../contexts/AlertContext"

const EditProfile = () => {
  const { showAlert } = useAlert() // Added useAlert

  const [fileName, setFileName] = useState("")
  const [imagePreview, setImagePreview] = useState(null)
  const [studentCardPreview, setStudentCardPreview] = useState(null)
  const [errors, setErrors] = useState({})
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Edit Profile";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  const navigate = useNavigate()
  const { user: authUser } = useAuth()
  const [authUserId, setAuthUserId] = useState(null)
  const role = authUser?.role
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    photo: "",
    address: "",
    // For student
    sexe: "",
    num_cin: "",
    age: "",
    image_carte_etudiant: null,
    // For ONG
    id_fiscale: "",
    type: "",
    // For restaurant/supermarket
    taxReference: "",
    // For transporter
    vehiculeType: "",
  })

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (typeof authUser.id === "string") {
        setAuthUserId(authUser.id)
        if (authUser && authUser.id) {
          try {
            const response = await getUserById(authUser.id)
            const userData = response.data
            setFormData({
              name: userData.name || "",
              email: userData.email || "",
              phone: userData.phone || "",
              photo: userData.photo || "",
              address: userData.address || "",
              sexe: userData.sexe || "",
              num_cin: userData.num_cin || "",
              age: userData.age || "",
              image_carte_etudiant: userData.image_carte_etudiant || null,
              id_fiscale: userData.id_fiscale || "",
              type: userData.type || "",
              taxReference: userData.taxReference || "",
              vehiculeType: userData.vehiculeType || "",
            })
          } catch (error) {
            console.error("Error fetching user data:", error)
          }
        }
      } else if (typeof authUser.id === "number") {
        setAuthUserId(authUser._id)
        if (authUser && authUser._id) {
          try {
            const response = await getUserById(authUser._id)
            const userData = response.data
            setFormData({
              name: userData.name || "",
              email: userData.email || "",
              phone: userData.phone || "",
              photo: userData.photo || "",
              address: userData.address || "",
              sexe: userData.sexe || "",
              num_cin: userData.num_cin || "",
              age: userData.age || "",
              image_carte_etudiant: userData.image_carte_etudiant || null,
              id_fiscale: userData.id_fiscale || "",
              type: userData.type || "",
              taxReference: userData.taxReference || "",
              vehiculeType: userData.vehiculeType || "",
            })
          } catch (error) {
            console.error("Error fetching user data:", error)
          }
        }
      }
    }
    fetchUserDetails()
  }, [authUser])

  const profilePhotoUrl =
    formData.photo && typeof formData.photo === "string" ? `http://localhost:3000/${formData.photo}` : pdp

  // Validation function for the fields
  const validateFields = () => {
    const newErrors = {}

    // Common required fields
    if (!formData.name) {
      newErrors.name = "Name is required."
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      newErrors.name = "Invalid name format."
    }

    if (!formData.email) {
      newErrors.email = "Email is required."
    } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address (e.g., name@example.com)."
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required."
    } else if (!/^\d{8,15}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format."
    }

    if (!formData.address) {
      newErrors.address = "Address is required."
    }

    // Role-specific fields
    if (role === "student") {
      if (!formData.sexe) {
        newErrors.sexe = "Gender is required."
      }
      if (!formData.age) {
        newErrors.age = "Age is required."
      }
      if (!formData.num_cin) {
        newErrors.num_cin = "CIN number is required."
      } else if (!/^\d{8}$/.test(formData.num_cin)) {
        newErrors.num_cin = "Invalid CIN format (must be 8 digits)."
      }
      if (!formData.image_carte_etudiant) {
        newErrors.image_carte_etudiant = "Student card image is required."
      }
    }

    if (role === "ong") {
      if (!formData.id_fiscale) {
        newErrors.id_fiscale = "Fiscal ID is required."
      } else if (!/^TN\d{8}$/.test(formData.id_fiscale)) {
        newErrors.id_fiscale = "Invalid fiscal ID format (must be TN followed by 8 digits)."
      }
      if (!formData.type) {
        newErrors.type = "ONG type is required."
      }
    }

    if (role === "restaurant" || role === "supermarket") {
      if (!formData.taxReference) {
        newErrors.taxReference = "Tax reference is required."
      } else if (!/^VAT-\d{8}$/.test(formData.taxReference)) {
        newErrors.taxReference = "Invalid tax reference format (must be VAT- followed by 8 digits)."
      }
    }

    if (role === "transporter") {
      if (!formData.vehiculeType) {
        newErrors.vehiculeType = "Vehicle type is required."
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handles changes in form fields
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    const newErrors = { ...errors }
    switch (name) {
      case "name":
        if (!value) {
          newErrors[name] = "Name is required."
        } else if (!/^[a-zA-Z\s]+$/.test(value)) {
          newErrors[name] = "Invalid name format."
        } else {
          delete newErrors[name]
        }
        break
      case "email":
        if (!value) {
          newErrors[name] = "Email is required."
        } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
          newErrors[name] = "Please enter a valid email."
        } else {
          delete newErrors[name]
        }
        break
      case "phone":
        if (!value) {
          newErrors[name] = "Phone number is required."
        } else if (!/^\d{8,15}$/.test(value)) {
          newErrors[name] = "Invalid phone number format."
        } else {
          delete newErrors[name]
        }
        break
      case "address":
        if (!value) {
          newErrors[name] = "Address is required."
        } else {
          delete newErrors[name]
        }
        break
      case "sexe":
        if (!value) {
          newErrors[name] = "Gender is required."
        } else {
          delete newErrors[name]
        }
        break
      case "age":
        if (!value) {
          newErrors[name] = "Age is required."
        } else {
          delete newErrors[name]
        }
        break
      case "num_cin":
        if (!value) {
          newErrors[name] = "CIN number is required."
        } else if (!/^\d{8}$/.test(value)) {
          newErrors[name] = "Invalid CIN format (8 digits)."
        } else {
          delete newErrors[name]
        }
        break
      case "id_fiscale":
        if (!value) {
          newErrors[name] = "Fiscal ID is required."
        } else if (!/^TN\d{8}$/.test(value)) {
          newErrors[name] = "Invalid fiscal ID format (TN + 8 digits)."
        } else {
          delete newErrors[name]
        }
        break
      case "type":
        if (!value) {
          newErrors[name] = "ONG type is required."
        } else {
          delete newErrors[name]
        }
        break
      case "taxReference":
        if (!value) {
          newErrors[name] = "Tax reference is required."
        } else if (!/^VAT-\d{8}$/.test(value)) {
          newErrors[name] = "Invalid format (VAT- + 8 digits)."
        } else {
          delete newErrors[name]
        }
        break
      case "vehiculeType":
        if (!value) {
          newErrors[name] = "Vehicle type is required."
        } else {
          delete newErrors[name]
        }
        break
    }
    setErrors(newErrors)
  }

  // Handles file uploads
  const handleFileChange = (event) => {
    const { name, files } = event.target
    if (files && files.length > 0) {
      const file = files[0]
      setFormData((prev) => ({ ...prev, [name]: file }))

      const reader = new FileReader()
      if (name === "photo") {
        reader.onload = (e) => setImagePreview(e.target.result)
        reader.readAsDataURL(file)
        setFileName(file.name)
      } else if (name === "image_carte_etudiant") {
        reader.onload = (e) => setStudentCardPreview(e.target.result)
        reader.readAsDataURL(file)
        const newErrors = { ...errors }
        delete newErrors.image_carte_etudiant
        setErrors(newErrors)
      }
    }
  }

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateFields()) {
      return
    }

    const data = new FormData()
    data.append("name", formData.name)
    data.append("email", formData.email)
    data.append("phone", formData.phone)
    data.append("address", formData.address)
    data.append("age", formData.age)
    data.append("sexe", formData.sexe)
    data.append("num_cin", formData.num_cin)
    data.append("id_fiscale", formData.id_fiscale)
    data.append("type", formData.type)
    data.append("taxReference", formData.taxReference)
    data.append("vehiculeType", formData.vehiculeType)

    if (formData.photo instanceof File) {
      data.append("photo", formData.photo)
    } else if (formData.photo) {
      data.append("photo", formData.photo)
    }
    if (role === "student" && formData.image_carte_etudiant instanceof File) {
      data.append("image_carte_etudiant", formData.image_carte_etudiant)
    } else if (role === "student" && formData.image_carte_etudiant) {
      data.append("image_carte_etudiant", formData.image_carte_etudiant)
    }

    try {
      await updateUser(authUserId, data)
      showAlert("success", "Profile updated successfully")

      navigate("/profile")
    } catch (error) {
      console.error("Error updating profile:", error)
      showAlert("error", "Failed to update profile")
    }
  }

  return (
    <>
      <Navbar />
      <div className="editprofile-container">
        <div className="editprofile-header">
          <div className="editprofile-profile-image-container">
            <img src={imagePreview || profilePhotoUrl} className="editprofile-profile-image" alt="Profile Preview" />
            <label htmlFor="file-upload-photo" className="editprofile-photo-icon" title="Change Photo">
              <FaCamera style={{ fontSize: "16px", color: "white" }} />
            </label>
            <input
              id="file-upload-photo"
              type="file"
              name="photo"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          <div className="editprofile-user-info">
            <span className="editprofile-font-weight-bold">{formData.name || "User Name"}</span>
            <span className="editprofile-text-black-50">{formData.email || "email@example.com"}</span>
            <h2 className="editprofile-text-right">Profile Settings</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="editprofile-form">
          {/* Common fields */}
          <div className="login-input-block">
            <input
              type="text"
              className={`login-input ${errors.name ? "error" : ""}`}
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label className="login-label">Name</label>
            {errors.name && <div className="error-field">{errors.name}</div>}
          </div>

          <div className="login-input-block">
            <input
              type="email"
              className={`login-input ${errors.email ? "error" : ""}`}
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label className="login-label">Email</label>
            {errors.email && <div className="error-field">{errors.email}</div>}
          </div>

          <div className="login-input-block">
            <input
              type="number"
              className={`login-input ${errors.phone ? "error" : ""}`}
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label className="login-label">Phone Number</label>
            {errors.phone && <div className="error-field">{errors.phone}</div>}
          </div>

          <div className="login-input-block">
            <input
              type="text"
              className={`login-input ${errors.address ? "error" : ""}`}
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <label className="login-label">Address</label>
            {errors.address && <div className="error-field">{errors.address}</div>}
          </div>

          {/* Role-specific fields */}
          {role === "student" && (
            <>
              <div className="login-input-block">
                <select
                  className={`login-input ${errors.sexe ? "error" : ""}`}
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <label className="login-label">Gender</label>
                {errors.sexe && <div className="error-field">{errors.sexe}</div>}
              </div>

              <div className="login-input-block">
                <input
                  type="number"
                  className={`login-input ${errors.age ? "error" : ""}`}
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  placeholder=" "
                />
                <label className="login-label">Age</label>
                {errors.age && <div className="error-field">{errors.age}</div>}
              </div>

              <div className="login-input-block">
                <input
                  type="text"
                  className={`login-input ${errors.num_cin ? "error" : ""}`}
                  name="num_cin"
                  value={formData.num_cin}
                  onChange={handleChange}
                  required
                  placeholder=" "
                />
                <label className="login-label">CIN Number</label>
                {errors.num_cin && <div className="error-field">{errors.num_cin}</div>}
              </div>

              <div className="row3">
                <div className="login-input-block">
                  <label className="login-label">Student Card Image</label>
                  <label htmlFor="file-upload-student" className="custom-file-upload">
                    <img
                      src={upload || "/placeholder.svg"}
                      alt="upload"
                      style={{ width: "20px", height: "10px", color: "gray" }}
                    />
                    Choose Student Card Image
                  </label>
                  <input
                    id="file-upload-student"
                    type="file"
                    name="image_carte_etudiant"
                    onChange={handleFileChange}
                    required
                  />
                  {formData.image_carte_etudiant && typeof formData.image_carte_etudiant === "object" && (
                    <div className="file-name">
                      <p>{formData.image_carte_etudiant.name}</p>
                    </div>
                  )}
                  {(studentCardPreview ||
                    (typeof formData.image_carte_etudiant === "string" && formData.image_carte_etudiant)) && (
                    <div className="student-card-preview">
                      <img
                        src={studentCardPreview || `http://localhost:3000/${formData.image_carte_etudiant}`}
                        alt="Student Card Preview"
                      />
                    </div>
                  )}
                  {errors.image_carte_etudiant && <div className="error-field">{errors.image_carte_etudiant}</div>}
                </div>
              </div>
            </>
          )}

          {role === "ong" && (
            <>
              <div className="login-input-block">
                <input
                  type="text"
                  className={`login-input ${errors.id_fiscale ? "error" : ""}`}
                  name="id_fiscale"
                  value={formData.id_fiscale}
                  onChange={handleChange}
                  required
                  placeholder=" "
                />
                <label className="login-label">Fiscal ID</label>
                {errors.id_fiscale && <div className="error-field">{errors.id_fiscale}</div>}
              </div>

              <div className="login-input-block">
                <select
                  className={`login-input ${errors.type ? "error" : ""}`}
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select ONG Type</option>
                  <option value="advocacy">Advocacy</option>
                  <option value="operational">Operational</option>
                  <option value="charitable">Charitable</option>
                  <option value="development">Development</option>
                  <option value="environmental">Environmental</option>
                  <option value="human-rights">Human Rights</option>
                  <option value="relief">Relief</option>
                  <option value="research">Research</option>
                  <option value="philanthropic">Philanthropic</option>
                  <option value="social_welfare">Social Welfare</option>
                  <option value="cultural">Cultural</option>
                  <option value="faith_based">Faith Based</option>
                </select>
                <label className="login-label">ONG Type</label>
                {errors.type && <div className="error-field">{errors.type}</div>}
              </div>
            </>
          )}

          {(role === "restaurant" || role === "supermarket") && (
            <div className="login-input-block">
              <input
                type="text"
                className={`login-input ${errors.taxReference ? "error" : ""}`}
                name="taxReference"
                value={formData.taxReference}
                onChange={handleChange}
                required
                placeholder=" "
              />
              <label className="login-label">Tax Reference</label>
              {errors.taxReference && <div className="error-field">{errors.taxReference}</div>}
            </div>
          )}

          {role === "transporter" && (
            <div className="login-input-block">
              <select
                className={`login-input ${errors.vehiculeType ? "error" : ""}`}
                name="vehiculeType"
                value={formData.vehiculeType}
                onChange={handleChange}
                required
              >
                <option value="">Select Vehicle Type</option>
                <option value="car">Car</option>
                <option value="motorbike">Motorbike</option>
                <option value="bicycle">Bicycle</option>
                <option value="van">Van</option>
                <option value="truck">Truck</option>
                <option value="scooter">Scooter</option>
              </select>
              <label className="login-label">Vehicle Type</label>
              {errors.vehiculeType && <div className="error-field">{errors.vehiculeType}</div>}
            </div>
          )}

          <button className="btn login-button" type="submit">
            Save Profile
          </button>
        </form>
      </div>
      <Footer />
    </>
  )
}

export default EditProfile
