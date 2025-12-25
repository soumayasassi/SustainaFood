"use client"

import { useState, useContext, useEffect } from "react"
import { AuthContext } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import ReCAPTCHA from "react-google-recaptcha"
import { getUserById, updateUserwithemail } from "../api/userService"
import { useAuth } from "../contexts/AuthContext"
import { FaCamera } from "react-icons/fa"
import "../assets/styles/ContinueInfo.css"

const ContinueInfo = () => {
  const { user, token } = useAuth();
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [formData, setFormData] = useState({
    phone: "",
    name: "",
    address: "",
    role: "ong", // Default to ONG
  });
  const [captchaValue, setCaptchaValue] = useState(null);
  const [errors, setErrors] = useState({});

  const validateName = (name) => /^[a-zA-Z\s]+$/.test(name);
  const validatePhone = (phone) => /^\d{8,15}$/.test(phone);
  const validateCIN = (cin) => /^\d{8}$/.test(cin);
  const validateFiscalID = (id) => /^TN\d{8}$/.test(id);
  const validateTaxReference = (ref) => /^VAT-\d{8}$/.test(ref);
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Continue Info";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate field immediately
    const newErrors = { ...errors };
    switch (name) {
      case "name":
        if (value && !validateName(value)) {
          newErrors[name] = "Invalid name format";
        } else {
          delete newErrors[name];
        }
        break;
      case "phone":
        if (value && !validatePhone(value)) {
          newErrors[name] = "Invalid phone number format";
        } else {
          delete newErrors[name];
        }
        break;
      case "num_cin":
        if (value && !validateCIN(value)) {
          newErrors[name] = "CIN must be exactly 8 digits";
        } else {
          delete newErrors[name];
        }
        break;
      case "id_fiscale":
        if (value && !validateFiscalID(value)) {
          newErrors[name] = "Invalid fiscal ID format (must be TN followed by 8 digits)";
        } else {
          delete newErrors[name];
        }
        break;
      case "taxReference":
        if (value && !validateTaxReference(value)) {
          newErrors[name] = "Invalid Tax Reference format (must be like VAT-12345678)";
        } else {
          delete newErrors[name];
        }
        break;
    }
    setErrors(newErrors);
  };

  const handleRoleChange = (e) => {
    const { value } = e.target;

    // Define role-specific fields
    let roleSpecificFields = {};
    switch (value) {
      case "student":
        roleSpecificFields = { sexe: "male", age: "", num_cin: "" };
        break;
      case "ong":
        roleSpecificFields = { id_fiscale: "", type: "charitable" };
        break;
      case "transporter":
        roleSpecificFields = { vehiculeType: "car" };
        break;
      case "restaurant":
      case "supermarket":
        roleSpecificFields = { taxReference: "" };
        break;
      default:
        roleSpecificFields = {};
    }

    // Remove irrelevant fields when role changes
    const { vehiculeType, ...rest } = formData; // Remove vehiculeType for non-transporter roles

    // Update formData with the new role and role-specific fields
    setFormData({
      ...rest,
      role: value,
      ...roleSpecificFields,
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!captchaValue) {
      setError("Please complete the reCAPTCHA.");
      return;
    }

    if (!formData.phone || !formData.role || !formData.address || !formData.name) {
      setError("Please fill in all required fields.");
      return;
    }

    if (Object.keys(errors).length > 0) {
      setError("Please fix the errors in the form.");
      return;
    }

    const email = localStorage.getItem("email from google");
    const id = localStorage.getItem("user_id");

    if (!id || !email) {
      setError("Error: User not found.");
      return;
    }

    const data = new FormData();

    // Append common fields
    data.append("phone", formData.phone);
    data.append("name", formData.name);
    data.append("address", formData.address);
    data.append("role", formData.role);

    // Append role-specific fields
    switch (formData.role) {
      case "student":
        data.append("sexe", formData.sexe);
        data.append("age", formData.age);
        data.append("num_cin", formData.num_cin);
        break;
      case "ong":
        data.append("id_fiscale", formData.id_fiscale);
        data.append("type", formData.type);
        break;
      case "transporter":
        data.append("vehiculeType", formData.vehiculeType);
        break;
      case "restaurant":
      case "supermarket":
        data.append("taxReference", formData.taxReference);
        break;
    }

    data.append("email", email);

    if (profilePhotoFile) {
      data.append("photo", profilePhotoFile);
    }

    try {
      const response = await updateUserwithemail(id, data);
      const userResponse = await getUserById(id);
      const user = userResponse.data;

      if (!user) {
        setError("Error: User data not retrieved.");
        return;
      }

      login(user, token);

      const authData = JSON.parse(localStorage.getItem("authData") || "{}");
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("authData", JSON.stringify({ ...authData, email: user.email }));

      navigate(user.role === "admin" ? "/dashboard" : "/profile");
    } catch (err) {
      console.error("Error during registration:", err);
      setError(err.response?.data?.error || "Registration error.");
    }
  };

  return (
    <div className="continueinfo-container">
      <div className="continueinfo-card">
        <h2 className="continueinfo-title">Complete Your Profile</h2>
        <p className="continueinfo-description">Please provide additional information to complete your registration.</p>
        <form onSubmit={handleSubmit} className="continueinfo-form">
          {/* Common Fields */}
          <div className="continueinfo-form-group">
            <label htmlFor="name" className="continueinfo-label">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`continueinfo-input ${errors.name ? "continueinfo-input-error" : ""}`}
            />
            {errors.name && <p className="continueinfo-error-message">{errors.name}</p>}
          </div>

          <div className="continueinfo-form-group">
            <label htmlFor="role" className="continueinfo-label">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleRoleChange}
              className="continueinfo-select"
            >
              <option value="ong">ONG</option>
              <option value="restaurant">Restaurant</option>
              <option value="supermarket">Supermarket</option>
              <option value="student">Student</option>
              <option value="transporter">Transporter</option>
            </select>
          </div>

          <div className="continueinfo-form-group">
            <label htmlFor="phone" className="continueinfo-label">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className={`continueinfo-input ${errors.phone ? "continueinfo-input-error" : ""}`}
            />
            {errors.phone && <p className="continueinfo-error-message">{errors.phone}</p>}
          </div>

          <div className="continueinfo-form-group">
            <label htmlFor="address" className="continueinfo-label">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="continueinfo-input"
            />
          </div>

          {/* Role-Specific Fields */}
          {formData.role === "student" && (
            <>
              <div className="continueinfo-form-group">
                <label htmlFor="sexe" className="continueinfo-label">
                  Gender
                </label>
                <select
                  id="sexe"
                  name="sexe"
                  value={formData.sexe}
                  onChange={handleChange}
                  className="continueinfo-select"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="continueinfo-form-group">
                <label htmlFor="age" className="continueinfo-label">
                  Age
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  className="continueinfo-input"
                />
              </div>
              <div className="continueinfo-form-group">
                <label htmlFor="num_cin" className="continueinfo-label">
                  CIN Number
                </label>
                <input
                  type="text"
                  id="num_cin"
                  name="num_cin"
                  value={formData.num_cin}
                  onChange={handleChange}
                  required
                  className={`continueinfo-input ${errors.num_cin ? "continueinfo-input-error" : ""}`}
                />
                {errors.num_cin && <p className="continueinfo-error-message">{errors.num_cin}</p>}
              </div>
            </>
          )}

          {formData.role === "ong" && (
            <>
              <div className="continueinfo-form-group">
                <label htmlFor="id_fiscale" className="continueinfo-label">
                  Fiscal ID
                </label>
                <input
                  type="text"
                  id="id_fiscale"
                  name="id_fiscale"
                  value={formData.id_fiscale}
                  onChange={handleChange}
                  required
                  className={`continueinfo-input ${errors.id_fiscale ? "continueinfo-input-error" : ""}`}
                />
                {errors.id_fiscale && <p className="continueinfo-error-message">{errors.id_fiscale}</p>}
              </div>
              <div className="continueinfo-form-group">
                <label htmlFor="type" className="continueinfo-label">
                  ONG Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="continueinfo-select"
                >
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
              </div>
            </>
          )}

          {formData.role === "transporter" && (
            <div className="continueinfo-form-group">
              <label htmlFor="vehiculeType" className="continueinfo-label">
                Vehicle Type
              </label>
              <select
                id="vehiculeType"
                name="vehiculeType"
                value={formData.vehiculeType}
                onChange={handleChange}
                className="continueinfo-select"
              >
                <option value="car">Car</option>
                <option value="motorbike">Motorbike</option>
                <option value="bicycle">Bicycle</option>
                <option value="van">Van</option>
                <option value="truck">Truck</option>
                <option value="scooter">Scooter</option>
              </select>
            </div>
          )}

          {(formData.role === "restaurant" || formData.role === "supermarket") && (
            <div className="continueinfo-form-group">
              <label htmlFor="taxReference" className="continueinfo-label">
                Tax Reference
              </label>
              <input
                type="text"
                id="taxReference"
                name="taxReference"
                value={formData.taxReference}
                onChange={handleChange}
                required
                className={`continueinfo-input ${errors.taxReference ? "continueinfo-input-error" : ""}`}
              />
              {errors.taxReference && <p className="continueinfo-error-message">{errors.taxReference}</p>}
            </div>
          )}

          {/* Profile Photo Upload */}
          <div className="continueinfo-form-group">
            <label htmlFor="file" className="continueinfo-label">
              Profile Photo
            </label>
            <div className="continueinfo-file-input">
              <button
                type="button"
                className="continueinfo-file-button"
                onClick={() => document.getElementById("file").click()}
              >
                <FaCamera className="continueinfo-camera-icon" />
                <span>Upload photo</span>
              </button>
              <input id="file" type="file" onChange={handleFileChange} className="continueinfo-hidden-input" />
              {imagePreview && (
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Profile Preview"
                  className="continueinfo-image-preview"
                />
              )}
              {fileName && <span className="continueinfo-file-name">{fileName}</span>}
            </div>
          </div>

          {/* reCAPTCHA */}
          <div className="continueinfo-recaptcha">
            <ReCAPTCHA
              sitekey="6LeXoN8qAAAAAHnZcOwetBZ9TfyOl8K_wg7j97hq"
              onChange={(value) => setCaptchaValue(value)}
            />
          </div>

          {/* Error Message */}
          {error && <p className="continueinfo-error">{error}</p>}

          {/* Submit Button */}
          <button type="submit" className="continueinfo-submit-button">
            Complete Registration
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContinueInfo;