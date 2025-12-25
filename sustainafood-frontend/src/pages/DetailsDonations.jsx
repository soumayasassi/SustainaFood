import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import '../assets/styles/DetailsDonations.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getDonationById, deleteDonation, updateDonation } from '../api/donationService';
import { deleteProduct } from '../api/productService';
import { createRequestNeedForExistingDonation } from '../api/requestNeedsService';
import { FaEdit, FaTrash, FaSave, FaTimes, FaEye } from "react-icons/fa";
import styled from 'styled-components';
import logo from "../assets/images/LogoCh.png";
import { useAlert } from '../contexts/AlertContext';
import { createnotification } from '../api/notificationService';
import LocationPicker from "../components/LocationPicker";

// Styled Components for Buttons
const Button = styled.button`
  display: inline-block;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 8px;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  ${({ variant }) => variant === 'add' && `
    background: #228b22;
    &:hover { background: #1e7a1e; transform: translateY(-2px); }
  `}
  ${({ variant }) => variant === 'cancel' && `
    background: #dc3545;
    &:hover { background: #b02a37; transform: translateY(-2px); }
  `}
  ${({ variant }) => variant === 'submit' && `
    background: #28a745;
    &:hover { background: #218838; transform: translateY(-2px); }
  `}
  ${({ variant }) => variant === 'donate' && `
    background: #228b22;
    &:hover { background: #1e7a1e; transform: translateY(-2px); }
  `}
  ${({ variant }) => variant === 'back' && `
    background: #6c757d;
    &:hover { background: #5a6268; transform: translateY(-2px); }
  `}

  &:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

// Styled Component for Donation/Request Form
const DonationForm = styled.div`
  h4 {
    color: #228b22;
    font-size: 25px;
    margin-bottom: 20px;
    font-weight: 600;
  }

  div {
    margin-bottom: 15px;
  }

  label {
    display: block;
    font-weight: 500;
    color: #495057;
    margin-bottom: 6px;
    font-size: 14px;
  }

  input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ced4da;
    border-radius: 6px;
    font-size: 16px;
    background: #f8f9fa;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;

    &:focus {
      border-color: #17a2b8;
      box-shadow: 0 0 5px rgba(23, 162, 184, 0.3);
      outline: none;
    }
  }

  .error-message {
    color: red;
    font-size: 14px;
    margin-top: 5px;
  }
`;

const DetailsDonations = () => {
  const { id } = useParams();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingRequest, setIsAddingRequest] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const [userid, setUserid] = useState();
  const [isTheOwner, setIsTheOwner] = useState(false);
  const [requestQuantities, setRequestQuantities] = useState([]);
  const [requestMealQuantities, setRequestMealQuantities] = useState([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isRequestMapOpen, setIsRequestMapOpen] = useState(false); // State for request location picker
  const [address, setAddress] = useState(""); // Address for the donation
  const [requestAddress, setRequestAddress] = useState(""); // Address for the request
  const [requestLocation, setRequestLocation] = useState({ type: 'Point', coordinates: [0, 0] }); // Location for the request
  const [requestErrors, setRequestErrors] = useState({}); // Validation errors for the request
  const navigate = useNavigate();
  const isDonor = user?.role === "restaurant" || user?.role === "supermarket";
  const isRecipient = user?.role === "ong" || user?.role === "student";
  const { showAlert } = useAlert();

  const [editedDonation, setEditedDonation] = useState({
    title: "",
    location: { type: 'Point', coordinates: [0, 0] },
    address: "",
    expirationDate: "",
    type: "",
    category: "",
    description: "",
    products: [],
    meals: [],
    numberOfMeals: 0,
    donationType: 'products',
  });
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Details Donations";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  const productTypes = [
    {
      category: "Non-Perishable",
      items: [
        { value: "Canned_Goods", label: "Canned Goods (e.g., beans, soups)" },
        { value: "Dry_Goods", label: "Dry Goods (e.g., rice, pasta)" },
        { value: "Beverages", label: "Beverages (e.g., bottled water, juice)" },
        { value: "Snacks", label: "Snacks (e.g., chips, granola bars)" },
        { value: "Cereals", label: "Cereals (e.g., oatmeal, cornflakes)" },
        { value: "Baked_Goods", label: "Baked Goods (e.g., packaged bread, cookies)" },
        { value: "Condiments", label: "Condiments (e.g., ketchup, sauces)" },
      ],
    },
    {
      category: "Perishable",
      items: [
        { value: "Vegetables", label: "Vegetables (e.g., carrots, potatoes)" },
        { value: "Fruits", label: "Fruits (e.g., apples, bananas)" },
        { value: "Meat", label: "Meat (e.g., fresh beef, chicken)" },
        { value: "Fish", label: "Fish (e.g., fresh salmon, tuna)" },
        { value: "Dairy", label: "Dairy (e.g., milk, cheese)" },
        { value: "Eggs", label: "Eggs (e.g., fresh eggs)" },
      ],
    },
    {
      category: "Specialty",
      items: [
        { value: "Baby_Food", label: "Baby Food (e.g., formula, purees)" },
        { value: "Pet_Food", label: "Pet Food (e.g., dog/cat food)" },
        { value: "Other", label: "Other (Miscellaneous)" },
      ],
    },
  ];

  useEffect(() => {
    if (typeof user?.id === "number") {
      setUserid(user._id);
    } else if (typeof user?.id === "string") {
      setUserid(user.id);
    }
  }, [user]);

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const response = await getDonationById(id);
        const fetchedDonation = response.data;
        const hasProducts = fetchedDonation.products && fetchedDonation.products.length > 0;
        const hasMeals = fetchedDonation.meals && fetchedDonation.meals.length > 0;
        const donationType = hasMeals && !hasProducts ? 'meals' : 'products';

        setDonation(fetchedDonation);
        setEditedDonation({
          title: fetchedDonation.title || "",
          location: fetchedDonation.location || { type: 'Point', coordinates: [0, 0] },
          address: fetchedDonation.address || "",
          expirationDate: fetchedDonation.expirationDate || "",
          type: fetchedDonation.type || "",
          category: fetchedDonation.category || "",
          description: fetchedDonation.description || "",
          products: hasProducts
            ? fetchedDonation.products.map(item => ({
                id: item.product?.id || null,
                name: item.product?.name || '',
                quantity: item.quantity || 0,
                totalQuantity: item.product?.totalQuantity || 0,
                status: item.product?.status || 'available',
                productDescription: item.product?.productDescription || 'Default description',
                productType: item.product?.productType || 'Other',
                weightPerUnit: item.product?.weightPerUnit || 0,
                weightUnit: item.product?.weightUnit || 'kg',
              }))
            : [],
          meals: hasMeals
            ? fetchedDonation.meals.map(item => ({
                id: item.meal?.id || null,
                mealName: item.meal?.mealName || 'Unnamed Meal',
                mealDescription: item.meal?.mealDescription || 'Default meal description',
                mealType: item.meal?.mealType || 'Other',
                quantity: item.quantity || 1,
              }))
            : [],
          numberOfMeals: fetchedDonation.numberOfMeals || 0,
          donationType,
        });
        setAddress(fetchedDonation.address || "");
        setRequestQuantities((hasProducts ? fetchedDonation.products : []).map(item => item.quantity || 0));
        setRequestMealQuantities((hasMeals ? fetchedDonation.meals : []).map(item => item.quantity || 0));
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching donation data');
      } finally {
        setLoading(false);
      }
    };
    fetchDonation();
  }, [id]);

  useEffect(() => {
    if (donation && userid) {
      setIsTheOwner(userid === (donation.donor?._id || donation.donor));
    }
  }, [donation, userid]);

  const sendNotificationToDonor = async (recipientName, donationTitle, donorId) => {
    try {
      const message = `${recipientName} has created a new request for your donation "${donationTitle}" 5 minutes ago`;
      const notificationData = {
        sender: user?._id || user?.id,
        receiver: donorId,
        message: message,
        isRead: false,
      };
      await createnotification(notificationData);
      console.log('Notification sent successfully to donor');
    } catch (error) {
      console.error('Error sending notification to donor:', error);
      showAlert('warning', 'Request created, but failed to send notification to donor');
    }
  };

  const handleDeleteDonation = () => {
    deleteDonation(id)
      .then(() => {
        showAlert('success', 'Donation successfully deleted');
        window.history.back();
      })
      .catch((error) => {
        console.error("Error deleting donation:", error);
        showAlert('error', 'Failed to delete donation');
      });
  };

  const handleSaveDonation = () => {
    const invalidProduct = editedDonation.products.find(
      (item) => !item.name?.trim() || !item.productDescription?.trim() || !item.productType?.trim()
    );
    const invalidMeal = editedDonation.meals.find(
      (item) => !item.mealName?.trim() || !item.mealDescription?.trim() || !item.mealType?.trim() || item.quantity < 1
    );

    if (editedDonation.donationType === 'products' && invalidProduct) {
      showAlert('error', 'Please fill in all required fields for products.');
      return;
    }
    if (editedDonation.donationType === 'meals' && invalidMeal) {
      showAlert('error', 'Please fill in all required fields for meals, including a valid quantity.');
      return;
    }
    if (editedDonation.donationType === 'meals' && editedDonation.category === 'prepared_meals') {
      const totalMeals = editedDonation.meals.reduce((sum, meal) => sum + (Number(meal.quantity) || 0), 0);
      if (!editedDonation.meals.length || totalMeals < 1) {
        showAlert('error', 'List of meals and a valid total number of meals are required for prepared meals.');
        return;
      }
      editedDonation.numberOfMeals = totalMeals;
    }

    if (new Date(editedDonation.expirationDate) <= new Date()) {
      showAlert('error', 'Expiration date must be in the future.');
      return;
    }

    if (
      !editedDonation.location ||
      editedDonation.location.type !== 'Point' ||
      !Array.isArray(editedDonation.location.coordinates) ||
      editedDonation.location.coordinates.length !== 2 ||
      typeof editedDonation.location.coordinates[0] !== 'number' ||
      typeof editedDonation.location.coordinates[1] !== 'number'
    ) {
      showAlert('error', 'Invalid location format. Please select a valid location.');
      return;
    }

    const donationData = {
      ...editedDonation,
      location: JSON.stringify(editedDonation.location),
      address: editedDonation.address,
      products: editedDonation.donationType === 'products'
        ? editedDonation.products.map(item => ({
            id: item.id || null,
            name: item.name,
            productDescription: item.productDescription,
            productType: item.productType,
            weightPerUnit: Number(item.weightPerUnit) || 0,
            weightUnit: item.weightUnit,
            totalQuantity: Number(item.totalQuantity) || 0,
            status: item.status,
            quantity: Number(item.quantity) || 0,
          }))
        : [],
      meals: editedDonation.donationType === 'meals'
        ? editedDonation.meals.map(item => ({
            id: item.id || null,
            mealName: item.mealName,
            mealDescription: item.mealDescription,
            mealType: item.mealType,
            quantity: Number(item.quantity) || 1,
          }))
        : [],
      numberOfMeals: editedDonation.donationType === 'meals' ? Number(editedDonation.numberOfMeals) || 0 : 0,
    };

    console.log('Sending update with data:', donationData);

    updateDonation(id, donationData)
      .then((response) => {
        console.log("Server response:", response.data);
        setDonation(response.data.data);
        setIsEditing(false);
        showAlert('success', 'Donation updated successfully');
        window.location.reload();
      })
      .catch((error) => {
        console.error("Error updating donation:", error.response?.data || error);
        showAlert('error', 'Failed to update donation: ' + (error.response?.data?.message || error.message));
      });
  };

  const handleLocationSelect = (selectedLocation, selectedAddress) => {
    setEditedDonation({
      ...editedDonation,
      location: selectedLocation,
      address: selectedAddress,
    });
    setAddress(selectedAddress);
    setIsMapOpen(false);
  };

  const handleRequestLocationSelect = (selectedLocation, selectedAddress) => {
    setRequestLocation(selectedLocation);
    setRequestAddress(selectedAddress);
    setIsRequestMapOpen(false);
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...editedDonation.products];
    if (field === 'quantity' || field === 'totalQuantity' || field === 'weightPerUnit') {
      value = Number(value);
    }
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setEditedDonation({ ...editedDonation, products: updatedProducts });
  };

  const handleMealChange = (index, field, value) => {
    const updatedMeals = [...editedDonation.meals];
    if (field === 'quantity') {
      value = Number(value);
    }
    updatedMeals[index] = { ...updatedMeals[index], [field]: value };
    setEditedDonation({ ...editedDonation, meals: updatedMeals });
  };

  const handleDeleteProduct = async (index) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      const productToDelete = editedDonation.products[index];
      if (productToDelete.id) {
        try {
          await deleteProduct(productToDelete.id);
        } catch (error) {
          console.error("Error deleting product:", error);
          showAlert('error', "Failed to delete product. Please try again.");
          return;
        }
      }
      const updatedProducts = editedDonation.products.filter((_, i) => i !== index);
      setEditedDonation({ ...editedDonation, products: updatedProducts });
    }
  };

  const handleDeleteMeal = async (index) => {
    if (window.confirm("Are you sure you want to delete this meal?")) {
      const updatedMeals = editedDonation.meals.filter((_, i) => i !== index);
      setEditedDonation({ ...editedDonation, meals: updatedMeals });
    }
  };

  const handleAddProduct = () => {
    const newProduct = {
      id: null,
      name: '',
      quantity: 0,
      totalQuantity: 0,
      status: 'available',
      productDescription: 'New product description',
      productType: 'Canned_Goods',
      weightPerUnit: 0,
      weightUnit: 'kg',
    };
    setEditedDonation({
      ...editedDonation,
      products: [...editedDonation.products, newProduct],
    });
  };

  const handleAddMeal = () => {
    const newMeal = {
      id: null,
      mealName: '',
      mealDescription: 'New meal description',
      mealType: 'Other',
      quantity: 1,
    };
    setEditedDonation({
      ...editedDonation,
      meals: [...editedDonation.meals, newMeal],
    });
  };

  const handleRequestQuantityChange = (index, value) => {
    const newQuantities = [...requestQuantities];
    const maxQuantity = donation.products[index]?.quantity || 0;
    newQuantities[index] = Math.min(Number(value), maxQuantity);
    setRequestQuantities(newQuantities);
  };

  const handleRequestMealQuantityChange = (index, value) => {
    const newQuantities = [...requestMealQuantities];
    const maxQuantity = donation.meals[index]?.quantity || 0;
    newQuantities[index] = Math.min(Number(value), maxQuantity);
    setRequestMealQuantities(newQuantities);
  };

  const validateRequest = () => {
    let tempErrors = {};
    if (
      !requestLocation ||
      requestLocation.type !== 'Point' ||
      !Array.isArray(requestLocation.coordinates) ||
      requestLocation.coordinates.length !== 2 ||
      typeof requestLocation.coordinates[0] !== 'number' ||
      typeof requestLocation.coordinates[1] !== 'number'
    ) {
      tempErrors.location = "A valid location is required for the request";
    }
    if (!requestAddress || requestAddress.trim() === '') {
      tempErrors.address = "A valid address is required for the request";
    }
    if (editedDonation.donationType === 'products') {
      const hasValidQuantity = requestQuantities.some(qty => qty > 0);
      if (!hasValidQuantity) {
        tempErrors.products = "Please specify at least one product quantity to request";
      }
      requestQuantities.forEach((qty, index) => {
        if (qty > donation.products[index].quantity) {
          tempErrors[`product_${index}`] = `Quantity (${qty}) exceeds available amount (${donation.products[index].quantity}) for ${donation.products[index].product?.name || 'product'}`;
        }
      });
    } else {
      const totalRequestedMeals = requestMealQuantities.reduce((sum, qty) => sum + Number(qty), 0);
      if (!totalRequestedMeals || totalRequestedMeals <= 0) {
        tempErrors.meals = "Total number of meals must be greater than 0";
      } else if (totalRequestedMeals > donation.numberOfMeals) {
        tempErrors.meals = `Total requested meals (${totalRequestedMeals}) exceed available meals (${donation.numberOfMeals})`;
      }
      requestMealQuantities.forEach((qty, index) => {
        if (qty > donation.meals[index].quantity) {
          tempErrors[`meal_${index}`] = `Quantity (${qty}) exceeds available amount (${donation.meals[index].quantity}) for ${donation.meals[index].meal?.mealName || 'meal'}`;
        }
      });
    }
    setRequestErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmitRequest = async () => {
    if (!validateRequest()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      let requestedItems = [];
      let requestedMealsItems = [];

      if (editedDonation.donationType === 'products') {
        requestedItems = donation.products?.map((item, index) => ({
          product: item.product?._id || item.product,
          quantity: Number(requestQuantities[index]) || 0,
        })).filter(p => p.quantity > 0) || [];
      } else {
        requestedMealsItems = donation.meals?.map((item, index) => ({
          meal: item.meal?._id || item.meal,
          quantity: Number(requestMealQuantities[index]) || 0,
        })).filter(m => m.quantity > 0) || [];
      }

      const totalRequestedMeals = editedDonation.donationType === 'meals'
        ? requestMealQuantities.reduce((sum, qty) => sum + Number(qty), 0)
        : 0;

      const requestData = {
        donationId: id,
        requestedProducts: requestedItems,
        requestedMeals: requestedMealsItems,
        recipientId: user?._id || user?.id,
        description: editedDonation.description || '',
        numberOfMeals: totalRequestedMeals,
        location: requestLocation, // Add GeoJSON location
        address: requestAddress, // Add readable address
      };

      const response = await createRequestNeedForExistingDonation(id, requestData);
      setIsAddingRequest(false);
      setRequestQuantities(donation.products?.map(() => 0) || []);
      setRequestMealQuantities(donation.meals?.map(() => 0) || []);
      setRequestLocation({ type: 'Point', coordinates: [0, 0] }); // Reset location
      setRequestAddress(""); // Reset address

      const donorId = donation.donor?._id || donation.donor;
      const recipientName = user?.name || 'A recipient';
      const donationTitle = donation.title || 'Untitled Donation';
      await sendNotificationToDonor(recipientName, donationTitle, donorId);

      showAlert('success', 'Request submitted successfully');
    } catch (error) {
      console.error('Error submitting request:', error);
      showAlert('error', `Failed to submit request: ${error.message || 'Unknown error'}`);
    }
  };

  const handleRequestAll = async () => {
    if (!validateRequest()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      let requestedItems = [];
      let requestedMealsItems = [];

      if (editedDonation.donationType === 'products') {
        requestedItems = donation.products?.map(item => ({
          product: item.product?._id || item.product,
          quantity: Number(item.quantity) || 0,
        })) || [];
      } else {
        requestedMealsItems = donation.meals?.map(item => ({
          meal: item.meal?._id || item.meal,
          quantity: Number(item.quantity) || 0,
        })) || [];
      }

      const totalRequestedMeals = editedDonation.donationType === 'meals'
        ? requestedMealsItems.reduce((sum, item) => sum + item.quantity, 0)
        : 0;

      const requestData = {
        donationId: id,
        requestedProducts: requestedItems,
        requestedMeals: requestedMealsItems,
        recipientId: user?._id || user?.id,
        description: editedDonation.description || '',
        numberOfMeals: totalRequestedMeals,
        location: requestLocation,
        address: requestAddress,
      };

      const response = await createRequestNeedForExistingDonation(id, requestData);
      setIsAddingRequest(false);
      setRequestQuantities(donation.products?.map(() => 0) || []);
      setRequestMealQuantities(donation.meals?.map(() => 0) || []);
      setRequestLocation({ type: 'Point', coordinates: [0, 0] });
      setRequestAddress("");

      const donorId = donation.donor?._id || donation.donor;
      const recipientName = user?.name || 'A recipient';
      const donationTitle = donation.title || 'Untitled Donation';
      await sendNotificationToDonor(recipientName, donationTitle, donorId);

      showAlert('success', 'Requested all items successfully');
    } catch (error) {
      console.error('Error requesting all:', error);
      showAlert('error', `Failed to request all: ${error.message || 'Unknown error'}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!donation) return <div>No donation found.</div>;

  const { title, expirationDate, products, meals } = donation;
  const isExpired = new Date(expirationDate) < new Date();

  return (
    <>
      <Navbar />
      <div className="donation-details">
        {(isMapOpen || isRequestMapOpen) && <div className="donation-map-backdrop" onClick={() => { setIsMapOpen(false); setIsRequestMapOpen(false); }} />}
        <div className="donation-card-content-details">
          <img src={logo} alt="Logo" className="addDonation-logo" style={{ marginLeft: "47%" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {isEditing ? (
              <input
                type="text"
                value={editedDonation.title}
                onChange={(e) => setEditedDonation({ ...editedDonation, title: e.target.value })}
                placeholder="🛒 Donation Title"
                style={{ fontSize: "1.5rem", fontWeight: "bold", width: "60%" }}
              />
            ) : (
              <h3 className="donation-title">🛒 Donation: {title || "No Title"}</h3>
            )}
            {isTheOwner && (
              <div>
                <FaTrash className='fa-trash' onClick={handleDeleteDonation} />
                {isEditing ? (
                  <>
                    <FaSave className="fa-save" onClick={handleSaveDonation} />
                    <FaTimes className="fa-times" onClick={() => setIsEditing(false)} />
                  </>
                ) : (
                  <FaEdit className="fa-edit" onClick={() => setIsEditing(true)} />
                )}
              </div>
            )}
          </div>

          <p style={{ color:"black"}}> 
            <strong>📍 Address:</strong>{" "}
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onClick={() => setIsMapOpen(true)}
                  placeholder="📍 Enter Address"
                  readOnly
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ced4da', borderRadius: '6px', fontSize: '16px', background: '#f8f9fa' }}
                />
                {isMapOpen && (
                  <LocationPicker
                    isOpen={isMapOpen}
                    onClose={() => setIsMapOpen(false)}
                    onLocationChange={(loc) => setEditedDonation({ ...editedDonation, location: loc })}
                    onAddressChange={setAddress}
                    onSelect={handleLocationSelect}
                    initialAddress={address}
                  />
                )}
              </>
            ) : (
              address || "Unknown address"
            )}
          </p>
          <p style={{ color:"black"}}> 
            <strong>📆 Expiration Date:</strong>{" "}
            {isEditing ? (
              <input
                type="date"
                value={editedDonation.expirationDate ? new Date(editedDonation.expirationDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setEditedDonation({ ...editedDonation, expirationDate: e.target.value })}
              />
            ) : (
              expirationDate ? new Date(expirationDate).toLocaleDateString() : "Not set"
            )}
          </p>

          {editedDonation.donationType === 'meals' && isEditing && editedDonation.category === 'prepared_meals' && (
            <p style={{ color:"black"}}>
              <strong>🔢 Total Number of Meals:</strong>
              <span>{editedDonation.meals.reduce((sum, meal) => sum + (Number(meal.quantity) || 0), 0)}</span>
            </p>
          )}

          {editedDonation.donationType === 'products' ? (
            <>
              <h4>📦 Products:</h4>
              <ul className="donation-ul">
                {isEditing ? (
                  editedDonation.products.map((product, index) => (
                    <li key={index} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                        placeholder="🔖 Product Name"
                      />
                      <input
                        type="text"
                        value={product.productDescription}
                        onChange={(e) => handleProductChange(index, 'productDescription', e.target.value)}
                        placeholder="📝 Description"
                        style={{ marginLeft: "10px" }}
                      />
                      <input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                        placeholder="🔢 Quantity"
                        style={{ marginLeft: "10px" }}
                      />
                      <input
                        type="number"
                        value={product.weightPerUnit}
                        onChange={(e) => handleProductChange(index, 'weightPerUnit', e.target.value)}
                        placeholder="⚖️ Weight"
                        style={{ marginLeft: "10px" }}
                      />
                      <select
                        value={product.weightUnit}
                        onChange={(e) => handleProductChange(index, 'weightUnit', e.target.value)}
                        style={{ marginLeft: "10px", padding: "8px", borderRadius: "5px" }}
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="lb">lb</option>
                        <option value="oz">oz</option>
                      </select>
                      <select
                        value={product.productType}
                        onChange={(e) => handleProductChange(index, 'productType', e.target.value)}
                        style={{ marginLeft: "10px", padding: "8px", borderRadius: "5px" }}
                      >
                        {productTypes.map((group, groupIndex) => (
                          <optgroup key={groupIndex} label={group.category}>
                            {group.items.map((item, itemIndex) => (
                              <option key={itemIndex} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <select
                        value={product.status}
                        onChange={(e) => handleProductChange(index, 'status', e.target.value)}
                        style={{ marginLeft: "10px", padding: "8px", borderRadius: "5px" }}
                      >
                        <option value="available">Available</option>
                        <option value="pending">Pending</option>
                        <option value="delivered">Delivered</option>
                      </select>
                      <FaTimes
                        onClick={() => handleDeleteProduct(index)}
                        style={{ color: "red", cursor: "pointer", marginLeft: "10px" }}
                      />
                    </li>
                  ))
                ) : (
                  products && products.length > 0 ? (
                    products.map((item, index) => (
                      <li className="donation-li-list" key={index}>
                        <span><strong>🔖 Name:</strong> {item.product?.name || 'Not specified'}</span> <br />
                        <span><strong>📝 Description:</strong> {item.product?.productDescription || 'None'}</span> <br />
                        <span><strong>📦 Type:</strong> {item.product?.productType || 'Not specified'}</span> <br />
                        <span><strong>🔢 Quantity:</strong> {item.quantity || 0}</span> <br />
                        <span><strong>⚖️ Weight:</strong> {item.product?.weightPerUnit || 0} {item.product?.weightUnit || 'kg'}</span> <br />
                        <span><strong>🔄 Status:</strong> {item.product?.status || 'Unknown'}</span>
                      </li>
                    ))
                  ) : (
                    <li className="donation-li-list">No products available</li>
                  )
                )}
              </ul>
            </>
          ) : (
            <>
              <h4>🍽️ Meals:</h4>
              <ul className="donation-ul">
                {isEditing ? (
                  editedDonation.meals.map((meal, index) => (
                    <li key={index} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                      <input
                        type="text"
                        value={meal.mealName}
                        onChange={(e) => handleMealChange(index, 'mealName', e.target.value)}
                        placeholder="🍽️ Meal Name"
                      />
                      <input
                        type="text"
                        value={meal.mealDescription}
                        onChange={(e) => handleMealChange(index, 'mealDescription', e.target.value)}
                        placeholder="📝 Description"
                        style={{ marginLeft: "10px" }}
                      />
                      <input
                        type="number"
                        min="1"
                        value={meal.quantity}
                        onChange={(e) => handleMealChange(index, 'quantity', e.target.value)}
                        placeholder="🔢 Quantity"
                        style={{ marginLeft: "10px" }}
                      />
                      <select
                        value={meal.mealType}
                        onChange={(e) => handleMealChange(index, 'mealType', e.target.value)}
                        style={{ marginLeft: "10px", padding: "8px", borderRadius: "5px" }}
                      >
                        <option value="Breakfast">Breakfast</option>
                        <option value="Lunch">Lunch</option>
                        <option value="Dinner">Dinner</option>
                        <option value="Snack">Snack</option>
                        <option value="Other">Other</option>
                      </select>
                      <FaTimes
                        onClick={() => handleDeleteMeal(index)}
                        style={{ color: "red", cursor: "pointer", marginLeft: "10px" }}
                      />
                    </li>
                  ))
                ) : (
                  meals && meals.length > 0 ? (
                    meals.map((item, index) => (
                      <li className="donation-li-list" key={index}>
                        <span><strong>🍽️ Name:</strong> {item.meal?.mealName || 'Not specified'}</span> <br />
                        <span><strong>📝 Description:</strong> {item.meal?.mealDescription || 'None'}</span> <br />
                        <span><strong>🍴 Type:</strong> {item.meal?.mealType || 'Unknown'}</span> <br />
                        <span><strong>🔢 Quantity:</strong> {item.quantity || 0}</span>
                      </li>
                    ))
                  ) : (
                    <li className="donation-li-list">No meals available</li>
                  )
                )}
              </ul>
            </>
          )}

          {isAddingRequest && (
            <DonationForm>
              <h4>Specify the Request</h4>
              <div>
                <label>📍 Request Location</label>
                <input
                  type="text"
                  value={requestAddress}
                  onChange={(e) => setRequestAddress(e.target.value)}
                  onClick={() => setIsRequestMapOpen(true)}
                  placeholder="📍 Select Request Location"
                  readOnly
                />
                {isRequestMapOpen && (
                  <LocationPicker
                    isOpen={isRequestMapOpen}
                    onClose={() => setIsRequestMapOpen(false)}
                    onLocationChange={setRequestLocation}
                    onAddressChange={setRequestAddress}
                    onSelect={handleRequestLocationSelect}
                    initialAddress={requestAddress}
                  />
                )}
                {requestErrors.location && <p className="error-message">{requestErrors.location}</p>}
                {requestErrors.address && <p className="error-message">{requestErrors.address}</p>}
              </div>
              {editedDonation.donationType === 'products' ? (
                donation.products.map((item, index) => (
                  <div key={index}>
                    <label>
                      {item.product?.name || 'Not specified'} - {item.product?.productDescription || 'None'} (Max: {item.quantity || 0})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={requestQuantities[index]}
                      onChange={(e) => handleRequestQuantityChange(index, e.target.value)}
                      placeholder="Quantity to request"
                    />
                    {requestErrors[`product_${index}`] && <p className="error-message">{requestErrors[`product_${index}`]}</p>}
                  </div>
                ))
              ) : (
                donation.meals.map((item, index) => (
                  <div key={index}>
                    <label>
                      {item.meal?.mealName || 'Not specified'} - {item.meal?.mealDescription || 'None'} (Max: {item.quantity || 0})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={item.quantity}
                      value={requestMealQuantities[index]}
                      onChange={(e) => handleRequestMealQuantityChange(index, e.target.value)}
                      placeholder="Quantity to request"
                    />
                    {requestErrors[`meal_${index}`] && <p className="error-message">{requestErrors[`meal_${index}`]}</p>}
                    {requestErrors.meals && <p className="error-message">{requestErrors.meals}</p>}
                  </div>
                ))
              )}
              <Button variant="donate" onClick={handleRequestAll}>Request All</Button>
              <Button variant="donate" onClick={handleSubmitRequest}>Submit Request</Button>
            </DonationForm>
          )}

          <Button variant="back" onClick={() => window.history.back()}>🔙 Go Back</Button>

          {isTheOwner && !isEditing && (
            <Button variant="submit" as={Link} to={`/ListRequestsDonation/${id}`}>
              👀 See Requests
            </Button>
          )}

          {!isTheOwner && isRecipient && donation.status !== "fulfilled" && !isExpired && (
            <Button
              variant={isAddingRequest ? "cancel" : "add"}
              onClick={() => setIsAddingRequest(!isAddingRequest)}
            >
              {isAddingRequest ? 'Cancel' : 'Add Request'}
            </Button>
          )}

          {isEditing && (
            <Button variant="add" onClick={editedDonation.donationType === 'products' ? handleAddProduct : handleAddMeal}>
              ➕ Add {editedDonation.donationType === 'products' ? 'Product' : 'Meal'}
            </Button>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default DetailsDonations;