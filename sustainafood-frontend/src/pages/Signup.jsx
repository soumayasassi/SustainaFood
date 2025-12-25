import { useState , useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import "../assets/styles/log.css";
import logo from "../assets/images/LogoCh.png";
import loginImg from "../assets/images/signupCh.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { signupUser } from "../api/userService";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styled from "styled-components";

const All = styled.div`
  background-color: #fff5f7; /* Rose pâle */
  border: none;
  color: #333;
  padding: 5px 15px;
  margin: 8px 0;
  width: 100%;
  border-radius: 5px;
`;

const StyledWrapper = styled.div`
  .plusButton {
    --plus_sideLength: 2.5rem;
    --plus_topRightTriangleSideLength: 0.9rem;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #ff6f91; /* Rose */
    width: var(--plus_sideLength);
    height: var(--plus_sideLength);
    background-color: #ff6f91; /* Rose */
    overflow: hidden;
  }
  .plusButton::before {
    position: absolute;
    content: "";
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-width: 0 var(--plus_topRightTriangleSideLength) var(--plus_topRightTriangleSideLength) 0;
    border-style: solid;
    border-color: transparent #fff transparent transparent;
    transition-timing-function: ease-in-out;
    transition-duration: 0.2s;
  }
  .plusButton:hover {
    cursor: pointer;
    background-color: #e65b7f; /* Rose plus foncé */
  }
  .plusButton:hover::before {
    --plus_topRightTriangleSideLength: calc(var(--plus_sideLength) * 2);
  }
  .plusButton:focus-visible::before {
    --plus_topRightTriangleSideLength: calc(var(--plus_sideLength) * 2);
  }
  .plusButton > .plusIcon {
    fill: #fff;
    width: calc(var(--plus_sideLength) * 0.5);
    height: calc(var(--plus_sideLength) * 0.5);
    z-index: 1;
    transition-timing-function: ease-in-out;
    transition-duration: 0.2s;
  }
  .plusButton:hover > .plusIcon {
    fill: #333;
    transform: rotate(180deg);
  }
  .plusButton:focus-visible > .plusIcon {
    fill: #333;
    transform: rotate(180deg);
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const ImagePreview = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-left: 12px;
  border: 2px solid #ff6f91; /* Rose */
`;

const ErrorMessage = styled.p`
  color: #e65b7f; /* Rose foncé */
  font-size: 12px;
  margin: 5px 0 0 0;
`;

const Signup = () => {
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const navigate = useNavigate();
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);

  // Input fields state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("ong");
  const [error, setError] = useState("");
  const [id_fiscale, setId_fiscale] = useState("");
  const [num_cin, setNum_cin] = useState("");
  const [sexe, setSexe] = useState("male");
  const [age, setAge] = useState("");
  const [taxReference, setTaxReference] = useState("");
  const [vehiculeType, setVehiculeType] = useState("car");
  const [type, setType] = useState("charitable");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaValue, setCaptchaValue] = useState(null);

  const isOng = role === "ong";
  const isStudent = role === "student" ;
  const isTransporter = role === "transporter";
  const isDonor = role === "supermarket" || role === "restaurant";
  const isPersonnel = role === "personaldonor";
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Sign Up";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  // State for errors
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    role: "",
    id_fiscale: "",
    num_cin: "",
    sexe: "",
    age: "",
    taxReference: "",
    vehiculeType: "",
    type: "",
    licenseNumber: "",
  });

  // Handle file selection for profile photo
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (e.g., JPG, PNG).");
        return;
      }
      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB.");
        return;
      }
      setFileName(file.name);
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePanel = () => {
    setIsRightPanelActive(!isRightPanelActive);
  };

  const validateFields = () => {
    const newErrors = {};

    if (!name.match(/^[a-zA-Z\s]+$/)) {
      newErrors.name = "Invalid name format";
    }

    if (!email.match(/^\S+@\S+\.\S+$/)) {
      newErrors.email = "Invalid email format";
    }

    if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W)[A-Za-z\d\W]+$/)) {
      newErrors.password =
        "Password must include at least one uppercase, one lowercase, one number, and one special character";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!phone.match(/^\d{8,15}$/)) {
      newErrors.phone = "Invalid phone number format";
    }

    if (isStudent || isPersonnel && !num_cin.match(/^\d{8}$/)) {
      newErrors.num_cin = "Invalid CIN format (must be 8 digits)";
    }

    if (isOng && !id_fiscale.match(/^TN\d{8}$/)) {
      newErrors.id_fiscale = "Invalid NGO fiscal ID format (must be like TN12345678)";
    }

    if (isDonor && !taxReference.match(/^VAT-\d{8}$/)) {
      newErrors.taxReference = "Invalid Tax Reference format (must be like VAT-12345678)";
    }

    if (isTransporter && !licenseNumber.match(/^\d{8}$/)) {
      newErrors.licenseNumber = "Invalid license number format (must be 8 digits)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateFields()) {
      return;
    }

    if (!captchaValue) {
      setError("Veuillez valider le reCAPTCHA.");
      return;
    }

    // Create a FormData object and append all fields
    const data = new FormData();
    data.append("email", email);
    data.append("password", password);
    data.append("confirmPassword", confirmPassword);
    data.append("phone", phone);
    data.append("name", name);
    data.append("address", address);
    data.append("role", role);
    if (isOng) {
      data.append("id_fiscale", id_fiscale);
      data.append("type", type);
    }
    if (isStudent || isPersonnel) {
      data.append("sexe", sexe);
      data.append("age", age);
      data.append("num_cin", num_cin);
    }
    if (isTransporter) {
      data.append("vehiculeType", vehiculeType);
      data.append("licenseNumber", licenseNumber);
    }
    if (isDonor) {
      data.append("taxReference", taxReference);
    }
    if (profilePhotoFile) {
      data.append("photo", profilePhotoFile);
    }

    try {
      const response = await signupUser(data);
      console.log("Inscription réussie");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur d'inscription.");
    }
  };

  return (
    <div className="aa">
      <div className={`signup-container ${isRightPanelActive ? "right-panel-active" : ""}`} id="container">
        <div className="signup-form-container signup-sign-up-container">
          <form className="signup-form" onSubmit={handleSignup}>
            <h1 className="signup-h1">Sign Up</h1>

            {/* Input Fields */}
            <input
              className="signup-input"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}

            <input
              className="signup-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}

              
            <input className="signup-input" type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {errors.password && <p className="error-message">{errors.password}</p>}
            <span style={{ marginBottom: "10px" }} className="auth-eye-icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>

            <input className="signup-input" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
            <span style={{ marginBottom: "10px" }} className="auth-eye-icon" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
            <select
              className="signup-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="ong">ONG</option>
              <option value="restaurant">Restaurant</option>
              <option value="supermarket">Supermarket</option>
              <option value="student">Student</option>
              <option value="transporter">Transporter</option>
              <option value="personaldonor">Personnel Donor</option>
            </select>

            {/* Profile Photo Upload Section */}
            <All>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <HiddenFileInput id="file" type="file" accept="image/*" onChange={handleFileChange} />
                <div>
                  <span>Profile photo</span>
                </div>
                {imagePreview && <ImagePreview src={imagePreview} alt="Profile" />}
                {fileName && <span>📂 {fileName}</span>}
              </div>
              <StyledWrapper>
                <div
                  tabIndex={0}
                  className="plusButton"
                  style={{ marginLeft: "auto", marginTop: "-25px" }}
                  onClick={() => document.getElementById("file").click()}
                >
                  <svg className="plusIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                    <g mask="url(#mask0_21_345)">
                      <path d="M13.75 23.75V16.25H6.25V13.75H13.75V6.25H16.25V13.75H23.75V16.25H16.25V23.75H13.75Z" />
                    </g>
                  </svg>
                </div>
              </StyledWrapper>
            </All>

            {isStudent || isPersonnel && (
              <>
                <select
                  className="signup-input"
                  value={sexe}
                  onChange={(e) => setSexe(e.target.value)}
                  required
                >
                  <option value="male">Men</option>
                  <option value="female">Women</option>
                </select>
                <input
                  className="signup-input"
                  type="number"
                  placeholder="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
                {errors.age && <ErrorMessage>{errors.age}</ErrorMessage>}
                <input
                  className="signup-input"
                  type="text"
                  placeholder="CIN number"
                  value={num_cin}
                  onChange={(e) => setNum_cin(e.target.value)}
                  required
                />
                {errors.num_cin && <ErrorMessage>{errors.num_cin}</ErrorMessage>}
              </>
            )}
            {isOng && (
              <>
                <input
                  className="signup-input"
                  type="text"
                  placeholder="Fiscale ID"
                  value={id_fiscale}
                  onChange={(e) => setId_fiscale(e.target.value)}
                  required
                />
                {errors.id_fiscale && <ErrorMessage>{errors.id_fiscale}</ErrorMessage>}
                <select
                  className="signup-input"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                >
                  <option value="advocacy">Advocacy</option>
                  <option value="operational">Operational</option>
                  <option value="charitable">Charitable</option>
                  <option value="development">Development</option>
                  <option value="environmental">Environmental</option>
                  <option value="human_rights">Human Rights</option>
                  <option value="relief">Relief</option>
                  <option value="research">Research</option>
                  <option value="philanthropic">Philanthropic</option>
                  <option value="social_welfare">Social Welfare</option>
                  <option value="cultural">Cultural</option>
                  <option value="faith_based">Faith Based</option>
                </select>
              </>
            )}
            {isTransporter && (
              <>
                <select
                  className="signup-input"
                  value={vehiculeType}
                  onChange={(e) => setVehiculeType(e.target.value)}
                  required
                >
                  <option value="car">Car</option>
                  <option value="motorbike">Motorbike</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                  <option value="scooter">Scooter</option>
                </select>
                <input
                  className="signup-input"
                  type="text"
                  placeholder="License Number"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  required
                />
                {errors.licenseNumber && <ErrorMessage>{errors.licenseNumber}</ErrorMessage>}
              </>
            )}
            {isDonor && (
              <>
                <input
                  className="signup-input"
                  type="text"
                  placeholder="Tax Reference"
                  value={taxReference}
                  onChange={(e) => setTaxReference(e.target.value)}
                  required
                />
                {errors.taxReference && <ErrorMessage>{errors.taxReference}</ErrorMessage>}
              </>
            )}
            <input
              className="signup-input"
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
            {errors.address && <ErrorMessage>{errors.address}</ErrorMessage>}
            <input
              className="signup-input"
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}

            {/* Google reCAPTCHA */}
            <ReCAPTCHA
              sitekey="6LeXoN8qAAAAAHnZcOwetBZ9TfyOl8K_wg7j97hq"
              onChange={(value) => setCaptchaValue(value)}
            />

            {/* Display Errors */}
            {error && <ErrorMessage>{error}</ErrorMessage>}

            <button type="submit" className="signup-button">Sign Up</button>

            <div>
              <span style={{ fontSize: "14px", marginLeft: "-230px" }}>
                Already have an account? <a href="/login">Sign In</a>
              </span>
            </div>
          </form>
        </div>

        <div className="signup-form-container signup-sign-in-container">
          <form className="signup-form" action="#">
            <img src={logo} alt="Logo" className="signup-logo" />
            <p className="signup-p">
              Be a part of a movement to make the world a better place by redistributing surplus food to those who need it.
            </p>
          </form>
        </div>

        <div className="signup-overlay-container">
          <div className="signup-overlay">
            <div className="signup-overlay-panel signup-overlay-left">
              <img src={loginImg} alt="Logo" className="signup-logo" />
              <button className="signbtn" onClick={togglePanel}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
            </div>
            <div className="signup-overlay-panel signup-overlay-right">
              <h1 className="signup-h1">Join Us Today!</h1>
              <p className="signup-p">Sign up to help us reduce food waste and support your community!</p>
              <button className="signbtn" onClick={togglePanel}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;