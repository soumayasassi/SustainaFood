import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../assets/styles/AddDonation.css";
import logo from "../assets/images/LogoCh.png";
import Papa from "papaparse";
import { FaEdit, FaTrash, FaSave } from "react-icons/fa";
import { addDonation } from "../api/donationService";
import { createrequests } from "../api/requestNeedsService";
import { useAuth } from "../contexts/AuthContext";
import { useAlert } from "../contexts/AlertContext";
import LocationPicker from "../components/LocationPicker";

export const AddDonation = () => {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const mealsFileInputRef = useRef(null);
  const { showAlert } = useAlert();

  // Form states
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState({
    type: 'Point',
    coordinates: [0, 0],
  });
  const [address, setAddress] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [expirationDate, setExpirationDate] = useState("");
  const [type, setType] = useState("donation");
  const [category, setCategory] = useState("prepared_meals");
  const [description, setDescription] = useState("");
  const [numberOfMeals, setNumberOfMeals] = useState("");

  // Error handling
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  // Products and Meals state
  const [products, setProducts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [manualProducts, setManualProducts] = useState([
    {
      name: "",
      productType: "Canned_Goods",
      productDescription: "",
      weightPerUnit: "",
      weightUnit: "kg",
      weightUnitTotale: "kg",
      totalQuantity: "",
      image: "",
      status: "available",
    },
  ]);
  const [manualMeals, setManualMeals] = useState([
    {
      mealName: "",
      mealDescription: "",
      mealType: "Lunch",
      quantity: "",
      image: null,
      imagePreview: "",
    },
  ]);

  // Editing state
  const [editableRow, setEditableRow] = useState(null);
  const [editedItem, setEditedItem] = useState({});
  const [editableType, setEditableType] = useState(null);

  // Entry mode
  const [productEntryMode, setProductEntryMode] = useState("csv");
  const [mealsEntryMode, setMealsEntryMode] = useState("csv");

  // User data
  const user = JSON.parse(localStorage.getItem("user"));
  const [userid, setUserid] = useState();

  const isDonner = user?.role === "restaurant" || user?.role === "supermarket" || user?.role === "personaldonor";
  const isRecipient = user?.role === "ong" || user?.role === "student";

  const productTypes = [
    "Canned_Goods",
    "Dry_Goods",
    "Beverages",
    "Snacks",
    "Cereals",
    "Baked_Goods",
    "Condiments",
    "Vegetables",
    "Fruits",
    "Meat",
    "Fish",
    "Dairy",
    "Eggs",
    "Baby_Food",
    "Pet_Food",
    "Other",
  ];
  const weightUnits = ["kg", "g", "lb", "oz", "ml", "l"];
  const statuses = ["available", "pending", "reserved", "out_of_stock"];
  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert", "Other"];
 // Set the page title dynamically
 useEffect(() => {
  document.title = "SustainaFood - Add Donation";
  return () => {
    document.title = "SustainaFood"; // Reset to default on unmount
  };
}, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (typeof user?.id === "number") {
        if (!user || !user._id) return;
        try {
          setUserid(user._id);
        } catch (error) {
          console.error("Backend Error:", error);
        }
      } else if (typeof user?.id === "string") {
        if (!user || !user.id) return;
        try {
          setUserid(user.id);
        } catch (error) {
          console.error("Backend Error:", error);
        }
      }
    };

    if (user && (user._id || user.id)) {
      fetchUser();
    }

    if (isDonner) setType("donation");
    else if (isRecipient) setType("request");
  }, [user, isDonner, isRecipient]);

  // Update numberOfMeals whenever manualMeals changes
  useEffect(() => {
    if (mealsEntryMode === "form" && isDonner) {
      const total = manualMeals.reduce(
        (sum, meal) => sum + (parseInt(meal.quantity) || 0),
        0
      );
      setNumberOfMeals(total || "");
    }
  }, [manualMeals, mealsEntryMode, isDonner]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          console.log("Parsed CSV Products:", result.data);
          setProducts(result.data);
        },
        header: true,
        skipEmptyLines: true,
      });
      showAlert("success", "Products uploaded successfully.");
    }
  };

  const handleFileUploadMeals = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        complete: (result) => {
          const parsedMeals = result.data.map((meal) => ({
            ...meal,
            quantity: parseInt(meal.quantity) || 0,
            image: null,
            imagePreview: "",
          }));
          setMeals(parsedMeals);
          const total = parsedMeals.reduce(
            (sum, meal) => sum + (meal.quantity || 0),
            0
          );
          setNumberOfMeals(total || "");
          showAlert("success", "Meals uploaded successfully.");
        },
        header: true,
        skipEmptyLines: true,
      });
    }
  };

  const mapPredictionToMealType = (prediction) => {
    const lowerPrediction = prediction.toLowerCase();
    if (
      lowerPrediction.includes("breakfast") ||
      lowerPrediction.includes("pancake") ||
      lowerPrediction.includes("egg")
    ) {
      return "Breakfast";
    } else if (
      lowerPrediction.includes("lunch") ||
      lowerPrediction.includes("sandwich") ||
      lowerPrediction.includes("salad")
    ) {
      return "Lunch";
    } else if (
      lowerPrediction.includes("dinner") ||
      lowerPrediction.includes("pasta") ||
      lowerPrediction.includes("steak")
    ) {
      return "Dinner";
    } else if (
      lowerPrediction.includes("snack") ||
      lowerPrediction.includes("chips") ||
      lowerPrediction.includes("nuts")
    ) {
      return "Snack";
    } else if (
      lowerPrediction.includes("dessert") ||
      lowerPrediction.includes("cake") ||
      lowerPrediction.includes("ice cream")
    ) {
      return "Dessert";
    }
    return "Other";
  };

  const handleImageUpload = async (index, file, isCsv = false) => {
    if (!file) return;

    const imagePreview = URL.createObjectURL(file);

    let updatedMeals;
    if (isCsv) {
      updatedMeals = [...meals];
      updatedMeals[index] = { ...updatedMeals[index], image: null, imagePreview };
      setMeals(updatedMeals);
    } else {
      updatedMeals = [...manualMeals];
      updatedMeals[index] = { ...updatedMeals[index], image: null, imagePreview };
      setManualMeals(updatedMeals);
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const data = await response.json();
      console.log("Image Analysis Results:", data);

      const topPrediction = data[0]?.description || "";
      const confidence = data[0]?.confidence || 0;

      const mealName = topPrediction
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const predictedMealType = mapPredictionToMealType(mealName);

      updatedMeals[index] = {
        ...updatedMeals[index],
        mealName,
        mealDescription: `Predicted as ${mealName} with ${Math.round(
          confidence * 100
        )}% confidence.`,
        mealType: predictedMealType,
        image: null,
        imagePreview,
      };

      if (isCsv) {
        setMeals(updatedMeals);
        const total = updatedMeals.reduce(
          (sum, meal) => sum + (parseInt(meal.quantity) || 0),
          0
        );
        setNumberOfMeals(total || "");
      } else {
        setManualMeals(updatedMeals);
        const total = updatedMeals.reduce(
          (sum, meal) => sum + (parseInt(meal.quantity) || 0),
          0
        );
        setNumberOfMeals(total || "");
      }

      showAlert("success", "Image analyzed and fields populated!");
    } catch (err) {
      console.error("Error analyzing image:", err);
      showAlert("error", "Failed to analyze image.");
    }
  };

  const validateForm = () => {
    let tempErrors = {};
    if (!title.trim()) tempErrors.title = "Title is required";
    else if (title.length < 3)
      tempErrors.title = "Title must be at least 3 characters long";

    if (
      location.coordinates[0] === 0 &&
      location.coordinates[1] === 0
    ) {
      tempErrors.location = "Please select a valid location on the map";
    }

    if (!expirationDate) tempErrors.expirationDate = "Expiration date is required";
    else if (new Date(expirationDate) < new Date())
      tempErrors.expirationDate = "Expiration date cannot be in the past";

    if (!description.trim()) tempErrors.description = "Description is required";
    else if (description.length < 10)
      tempErrors.description =
        "Description must be at least 10 characters long";

    if (category === "prepared_meals") {
      const parsedNumberOfMeals = parseInt(numberOfMeals, 10);
      if (
        !numberOfMeals ||
        isNaN(parsedNumberOfMeals) ||
        parsedNumberOfMeals <= 0
      ) {
        tempErrors.numberOfMeals =
          "Number of meals must be a valid positive integer";
      }
      console.log("isDonner", isDonner);
      if (isDonner) {
        if (mealsEntryMode === "csv" && meals.length === 0) {
          tempErrors.meals = "Meals list is required when uploading via CSV";
        } else if (mealsEntryMode === "form") {
          const invalidMeals = manualMeals.filter(
            (meal) =>
              !meal.mealName.trim() ||
              !meal.mealType ||
              !meal.mealDescription.trim() ||
              !meal.quantity ||
              parseInt(meal.quantity) <= 0
          );
          if (invalidMeals.length > 0) {
            tempErrors.meals =
              "All meals must have a name, type, description, and valid quantity";
          }
        }

        // Calculate total meals only for donors
        const totalMeals =
          mealsEntryMode === "form"
            ? manualMeals.reduce(
                (sum, meal) => sum + (parseInt(meal.quantity) || 0),
                0
              )
            : meals.reduce(
                (sum, meal) => sum + (parseInt(meal.quantity) || 0),
                0
              );

        if (totalMeals !== parsedNumberOfMeals && isDonner) {
          tempErrors.numberOfMeals = `Total quantity of meals (${totalMeals}) must match the number of meals (${parsedNumberOfMeals})`;
        }
      }
    }

    if (category === "packaged_products") {
      if (productEntryMode === "csv" && products.length === 0) {
        tempErrors.products = "Please upload a CSV file with products";
      } else if (productEntryMode === "form") {
        const invalidProducts = manualProducts.filter(
          (p) =>
            !p.name.trim() ||
            !p.productType ||
            !p.productDescription.trim() ||
            !p.weightPerUnit ||
            p.weightPerUnit <= 0 ||
            !p.totalQuantity ||
            p.totalQuantity <= 0
        );
        if (invalidProducts.length > 0) {
          tempErrors.products =
            "All products must have a name, type, description, weight per unit, and total quantity greater than 0";
        }
      }
    }

    setErrors(tempErrors);
    console.log("Validation Errors:", tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleEditRow = (index, type) => {
    setEditableRow(index);
    setEditableType(type);
    setEditedItem(type === "products" ? { ...products[index] } : { ...meals[index] });
    showAlert("warning", `Editing ${type === "products" ? "product" : "meal"} row.`);
  };

  const handleRowInputChange = (e, key) => {
    const value =
      key === "quantity" || key === "weightPerUnit" || key === "totalQuantity"
        ? parseInt(e.target.value) || ""
        : e.target.value;
    setEditedItem((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveRow = (index) => {
    if (editableType === "products") {
      const updatedProducts = [...products];
      updatedProducts[index] = editedItem;
      setProducts(updatedProducts);
      showAlert("success", "Product updated successfully!");
    } else if (editableType === "meals") {
      const updatedMeals = [...meals];
      updatedMeals[index] = { ...editedItem, image: null };
      setMeals(updatedMeals);
      const total = updatedMeals.reduce(
        (sum, meal) => sum + (parseInt(meal.quantity) || 0),
        0
      );
      setNumberOfMeals(total || "");
      showAlert("success", "Meal updated successfully!");
    }
    setEditableRow(null);
    setEditedItem({});
    setEditableType(null);
  };

  const handleDeleteRow = (index, type) => {
    if (type === "products") {
      setProducts(products.filter((_, i) => i !== index));
      showAlert("success", "Product removed from list.");
    } else if (type === "meals") {
      const updatedMeals = meals.filter((_, i) => i !== index);
      setMeals(updatedMeals);
      const total = updatedMeals.reduce(
        (sum, meal) => sum + (parseInt(meal.quantity) || 0),
        0
      );
      setNumberOfMeals(total || "");
      showAlert("success", "Meal removed from list.");
    }
  };

  const handleDeleteList = (type) => {
    if (type === "products") {
      setProducts([]);
      showAlert("success", "Product list cleared.");
    } else if (type === "meals") {
      setMeals([]);
      setNumberOfMeals("");
      showAlert("success", "Meal list cleared.");
    }
  };

  const handleManualProductChange = (index, field, value) => {
    const updated = [...manualProducts];
    updated[index][field] =
      field === "totalQuantity" || field === "weightPerUnit"
        ? parseInt(value) || ""
        : value;
    setManualProducts(updated);
  };

  const handleManualMealChange = (index, field, value) => {
    const updated = [...manualMeals];
    updated[index][field] =
      field === "quantity" ? parseInt(value) || "" : value;
    setManualMeals(updated);
  };

  const handleAddManualProduct = () => {
    setManualProducts([
      ...manualProducts,
      {
        name: "",
        productType: "Canned_Goods",
        productDescription: "",
        weightPerUnit: "",
        weightUnit: "kg",
        weightUnitTotale: "kg",
        totalQuantity: "",
        image: "",
        status: "available",
      },
    ]);
    showAlert("success", "New product entry added.");
  };

  const handleAddManualMeal = () => {
    setManualMeals([
      ...manualMeals,
      {
        mealName: "",
        mealDescription: "",
        mealType: "Lunch",
        quantity: "",
        image: null,
        imagePreview: "",
      },
    ]);
    showAlert("success", "New meal entry added.");
  };

  const handleRemoveManualProduct = (index) => {
    setManualProducts(manualProducts.filter((_, i) => i !== index));
    showAlert("success", "Manual product removed.");
  };

  const handleRemoveManualMeal = (index) => {
    setManualMeals(manualMeals.filter((_, i) => i !== index));
    showAlert("success", "Manual meal removed.");
  };

  const handleLocationSelect = (selectedLocation, selectedAddress) => {
    setLocation(selectedLocation);
    setAddress(selectedAddress);
    setIsMapOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      console.log("Form validation failed. Errors:", errors);
      return;
    }

    const donationData = new FormData();
    donationData.append("title", title);
    donationData.append("location", JSON.stringify(location));
    donationData.append("address", address);
    donationData.append("expirationDate", expirationDate);
    donationData.append("description", description);
    donationData.append("category", category);
    donationData.append("created_at", new Date().toISOString());
    donationData.append("updated_at", new Date().toISOString());
    donationData.append("status", "pending");

    if (category === "prepared_meals") {
      donationData.append("numberOfMeals", numberOfMeals);
      if (isDonner) {
        const mealsToSend = mealsEntryMode === "form" ? manualMeals : meals;
        const formattedMeals = mealsToSend.map((meal) => ({
          mealName: meal.mealName,
          mealDescription: meal.mealDescription,
          mealType: meal.mealType,
          quantity: parseInt(meal.quantity),
        }));
        console.log("Formatted Meals to Send:", formattedMeals);
        donationData.append("meals", JSON.stringify(formattedMeals));
      }
    }

    if (category === "packaged_products") {
      const productsToSend = productEntryMode === "csv" ? products : manualProducts;
      if (isDonner) {
        const formattedProducts = productsToSend.map((product) => ({
          ...product,
          totalQuantity: parseInt(product.totalQuantity),
          weightPerUnit: parseFloat(product.weightPerUnit),
        }));
        console.log("Formatted Products to Send (Donor):", formattedProducts);
        donationData.append("products", JSON.stringify(formattedProducts));
      } else if (isRecipient) {
        const formattedRequestedProducts = productsToSend.map((product) => ({
          name: product.name,
          productType: product.productType,
          productDescription: product.productDescription,
          weightPerUnit: parseFloat(product.weightPerUnit),
          weightUnit: product.weightUnit,
          weightUnitTotale: product.weightUnitTotale,
          totalQuantity: parseFloat(product.totalQuantity),
          quantity: parseInt(product.totalQuantity),
          image: product.image,
          status: product.status,
        }));
        console.log(
          "Formatted Requested Products to Send (Recipient):",
          formattedRequestedProducts
        );
        donationData.append(
          "requestedProducts",
          JSON.stringify(formattedRequestedProducts)
        );
      }
    }

    try {
      let response;
      if (isDonner) {
        donationData.append("type", type);
        donationData.append("donor", userid);
        console.log("Sending Donation Data:", [...donationData.entries()]);
        response = await addDonation(donationData);
        console.log("Donation created successfully:", response.data);
        showAlert("success", "Donation created successfully!");
        window.history.back();
      } else if (isRecipient) {
        donationData.append("recipient", userid);
        console.log("Sending Request Data:", [...donationData.entries()]);
        response = await createrequests(donationData);
        console.log("Request created successfully:", response.data);
        showAlert("success", "Request created successfully!");
        window.history.back();
      }
    } catch (err) {
      console.error("Error creating donation/request:", err);
      const errorData = err.response?.data;
      if (
        errorData?.message === "Inappropriate language detected in submission" &&
        errorData?.badWordsDetected
      ) {
        const badWordsDetails = errorData.badWordsDetected
          .map(({ field, badWord }) => `${field}: "${badWord}"`)
          .join(", ");
        setError(`Inappropriate language detected: ${badWordsDetails}`);
        errorData.badWordsDetected.forEach(({ field, badWord }) => {
          showAlert(
            "error",
            `Inappropriate language detected in ${field}: "${badWord}"`
          );
        });
      } else {
        const errorMessage =
          errorData?.message ||
          "An error occurred while creating the donation/request.";
        setError(errorMessage);
        showAlert("error", errorMessage);
      }
    }
  };

  useEffect(() => {
    if (category !== "packaged_products") {
      setProducts([]);
      setManualProducts([
        {
          name: "",
          productType: "Canned_Goods",
          productDescription: "",
          weightPerUnit: "",
          weightUnit: "kg",
          weightUnitTotale: "kg",
          totalQuantity: "",
          image: "",
          status: "available",
        },
      ]);
    }
    if (category !== "prepared_meals") {
      setMeals([]);
      setManualMeals([
        {
          mealName: "",
          mealDescription: "",
          mealType: "Lunch",
          quantity: "",
          image: null,
          imagePreview: "",
        },
      ]);
      setNumberOfMeals("");
    }
  }, [category]);

  const descriptionCharCount = description.length;

  return (
    <>
      <Navbar />
      <div className="addDonation">
        {isMapOpen && <div className="addDonation-map-backdrop" onClick={() => setIsMapOpen(false)} />}
        <form className="addDonation-form" onSubmit={handleSubmit}>
          <img src={logo} alt="Logo" className="addDonation-logo" />
          <h1 className="addDonation-h1">
            {isDonner ? "Add Donation" : "Add Request Need"}
          </h1>

          <div className="addDonation-input-container">
            <input
              className="addDonation-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder=" "
              required
            />
            <label>Title</label>
            {errors.title && <p className="addDonation-error-message">{errors.title}</p>}
          </div>

          <div className="addDonation-input-Location">
            <input 
              className="addDonation-input"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onClick={() => setIsMapOpen(true)}
              placeholder=" "
              readOnly
            />
            <label style={{  position: "relative"}}>Location</label>
            {isMapOpen && (
              <LocationPicker
                isOpen={isMapOpen}
                onClose={() => setIsMapOpen(false)}
                onLocationChange={setLocation}
                onAddressChange={setAddress}
                onSelect={handleLocationSelect}
                initialAddress={address}
              />
            )}
            {errors.location && <p className="addDonation-error-message">{errors.location}</p>}
          </div>

          <div className="addDonation-input-container">
            <input
              className="addDonation-input"
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              required
            />
            <label>Expiration Date</label>
            {errors.expirationDate && (
              <p className="addDonation-error-message">{errors.expirationDate}</p>
            )}
          </div>

          <div className="addDonation-input-container">
            <select
              className="addDonation-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="prepared_meals">Prepared Meals</option>
              <option value="packaged_products">Packaged Products</option>
            </select>
            <label>Category</label>
          </div>

          {category === "prepared_meals" && (
            <div className="addDonation-input-container">
              <input
                className="addDonation-input"
                type="number"
                value={numberOfMeals}
                onChange={(e) => setNumberOfMeals(e.target.value)}
                placeholder=" "
                readOnly={isDonner}
                min="1"
                required
              />
              <label>Total Number of Meals</label>
              {errors.numberOfMeals && (
                <p className="addDonation-error-message">{errors.numberOfMeals}</p>
              )}
            </div>
          )}

          <div className="addDonation-input-container">
            <textarea
              className="addDonation-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder=" "
              required
            />
            <label>Description</label>
            <p
              className="addDonation-char-count"
              style={{
                display: "block",
                width: "100%",
                textAlign: "right",
                color: "gray",
              }}
            >
              [{descriptionCharCount}]
            </p>
            {errors.description && (
              <p className="addDonation-error-message">{errors.description}</p>
            )}
          </div>

          {category === "prepared_meals" && isDonner && (
            <>
              <div className="addDonation-radio-buttons-container" style={{ display: "flex" }}>
                <div className="addDonation-radio-button">
                  <input
                    name="radio-group-meals"
                    id="radio-csv-meals"
                    className="addDonation-radio-button__input"
                    type="radio"
                    checked={mealsEntryMode === "csv"}
                    onChange={() => setMealsEntryMode("csv")}
                  />
                  <label
                    htmlFor="radio-csv-meals"
                    className="addDonation-radio-button__label"
                  >
                    <span className="addDonation-radio-button__custom"></span>
                    CSV File
                  </label>
                </div>
                <div className="addDonation-radio-button">
                  <input
                    name="radio-group-meals"
                    id="radio-form-meals"
                    className="addDonation-radio-button__input"
                    type="radio"
                    checked={mealsEntryMode === "form"}
                    onChange={() => setMealsEntryMode("form")}
                  />
                  <label
                    htmlFor="radio-form-meals"
                    className="addDonation-radio-button__label"
                  >
                    <span className="addDonation-radio-button__custom"></span>
                    Form
                  </label>
                </div>
              </div>

              {mealsEntryMode === "csv" && meals.length === 0 && (
                <>
                  <input
                    ref={mealsFileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUploadMeals}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    className="addDonation-container-btn-file"
                    onClick={() => mealsFileInputRef.current.click()}
                  >
                    <svg
                      fill="#fff"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 50 50"
                    >
                      <path d="M 25 2 C 12.309295 2 2 12.309295 2 25 C 2 37.690705 12.309295 48 25 48 C 37.690705 48 48 37.690705 48 25 C 48 12.309295 37.690705 2 25 2 z M 25 4 C 36.609824 4 46 13.390176 46 25 C 46 36.609824 36.609824 46 25 46 C 13.390176 46 4 36.609824 4 25 C 4 13.390176 13.390176 4 25 4 z M 24 13 L 24 24 L 13 24 L 13 26 L 24 26 L 24 37 L 26 37 L 26 26 L 37 26 L 37 24 L 26 24 L 26 13 L 24 13 z" />
                    </svg>
                    Upload List of Meals
                  </button>
                  <span className="addDonation-file-name">
                    *The CSV for meals should contain: mealName,
                    mealDescription, mealType, and quantity.
                  </span>
                </>
              )}

              {mealsEntryMode === "csv" && meals.length > 0 && (
                <>
                  <p>
                    List of meals uploaded
                  </p>
                  <div className="addDonation-file-actions">
                    <FaEdit
                      className="AddDonation-fa-edit"
                      onClick={() => mealsFileInputRef.current.click()}
                    />
                    <FaTrash
                      className="addDonation-fa-trash"
                      onClick={() => handleDeleteList("meals")}
                    />
                  </div>
                  <table className="addDonation-product-table">
                    <thead>
                      <tr>
                        <th>Meal Name</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Image</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meals.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {editableRow === rowIndex &&
                          editableType === "meals" ? (
                            <>
                              <td>
                                <input
                                  value={editedItem.mealName || ""}
                                  onChange={(e) =>
                                    handleRowInputChange(e, "mealName")
                                  }
                                  className="addDonation-edit-input"
                                />
                              </td>
                              <td>
                                <input
                                  value={editedItem.mealDescription || ""}
                                  onChange={(e) =>
                                    handleRowInputChange(e, "mealDescription")
                                  }
                                  className="addDonation-edit-input"
                                />
                              </td>
                              <td>
                                <select
                                  value={editedItem.mealType || ""}
                                  onChange={(e) =>
                                    handleRowInputChange(e, "mealType")
                                  }
                                  className="addDonation-edit-input"
                                >
                                  {mealTypes.map((mt) => (
                                    <option key={mt} value={mt}>
                                      {mt}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  value={editedItem.quantity || ""}
                                  onChange={(e) =>
                                    handleRowInputChange(e, "quantity")
                                  }
                                  className="addDonation-edit-input"
                                  min="1"
                                />
                              </td>
                              <td>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleImageUpload(
                                      rowIndex,
                                      e.target.files[0],
                                      true
                                    )
                                  }
                                />
                                {editedItem.imagePreview && (
                                  <img
                                    src={editedItem.imagePreview}
                                    alt="Meal Preview"
                                    style={{
                                      width: "50px",
                                      height: "50px",
                                      objectFit: "cover",
                                    }}
                                  />
                                )}
                              </td>
                              <td>
                                <FaSave
                                  className="addDonation-fa-save"
                                  onClick={() => handleSaveRow(rowIndex)}
                                />
                              </td>
                            </>
                          ) : (
                            <>
                              <td>{row.mealName}</td>
                              <td>{row.mealDescription}</td>
                              <td>{row.mealType}</td>
                              <td>{row.quantity}</td>
                              <td>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleImageUpload(
                                      rowIndex,
                                      e.target.files[0],
                                      true
                                    )
                                  }
                                />
                                {row.imagePreview && (
                                  <img
                                    src={row.imagePreview}
                                    alt="Meal Preview"
                                    style={{
                                      width: "50px",
                                      height: "50px",
                                      objectFit: "cover",
                                    }}
                                  />
                                )}
                              </td>
                              <td>
                                <FaEdit
                                  className="addDonation-fa-edit"
                                  onClick={() =>
                                    handleEditRow(rowIndex, "meals")
                                  }
                                  style={{
                                    color: "black",
                                    cursor: "pointer",
                                    fontSize: "20px",
                                  }}
                                />
                                <FaTrash
                                  className="addDonation-fa-trash"
                                  onClick={() =>
                                    handleDeleteRow(rowIndex, "meals")
                                  }
                                  style={{
                                    color: "red",
                                    cursor: "pointer",
                                    fontSize: "20px",
                                    marginLeft: "10px",
                                  }}
                                />
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {mealsEntryMode === "form" && (
                <div className="addDonation-manual-product-entry">
                  {manualMeals.map((meal, index) => (
                    <div key={index} className="addDonation-manual-product-row">
                      <div className="addDonation-input-container">
                        <input
                          type="text"
                          value={meal.mealName}
                          onChange={(e) =>
                            handleManualMealChange(
                              index,
                              "mealName",
                              e.target.value
                            )
                          }
                          className="addDonation-input"
                          placeholder=" "
                        />
                        <label>Meal Name</label>
                      </div>
                      <div className="addDonation-input-container">
                        <textarea
                          value={meal.mealDescription}
                          onChange={(e) =>
                            handleManualMealChange(
                              index,
                              "mealDescription",
                              e.target.value
                            )
                          }
                          className="addDonation-input"
                          placeholder=" "
                        />
                        <label>Meal Description</label>
                      </div>
                      <div className="addDonation-input-container">
                        <select
                          value={meal.mealType}
                          onChange={(e) =>
                            handleManualMealChange(
                              index,
                              "mealType",
                              e.target.value
                            )
                          }
                          className="addDonation-input"
                        >
                          {mealTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <label>Meal Type</label>
                      </div>
                      <div className="addDonation-input-container">
                        <input
                          type="number"
                          value={meal.quantity}
                          onChange={(e) =>
                            handleManualMealChange(
                              index,
                              "quantity",
                              e.target.value
                            )
                          }
                          className="addDonation-input"
                          placeholder=" "
                          min="1"
                        />
                        <label>Quantity</label>
                      </div>
                      <div className="addDonation-input-container">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageUpload(index, e.target.files[0])
                          }
                          className="addDonation-input"
                        />
                        <label>Image</label>
                        {meal.imagePreview && (
                          <img
                            src={meal.imagePreview}
                            alt="Meal Preview"
                            style={{
                              width: "100px",
                              height: "100px",
                              objectFit: "cover",
                            }}
                          />
                        )}
                      </div>
                      {manualMeals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveManualMeal(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddManualMeal}
                    className="addDonation-button"
                  >
                    Add Another Meal
                  </button>
                </div>
              )}
              {errors.meals && <p className="addDonation-error-message">{errors.meals}</p>}
            </>
          )}

          {category === "packaged_products" && (
            <>
              <div className="addDonation-radio-buttons-container">
                <div className="addDonation-radio-button">
                  <input
                    name="radio-group-products"
                    id="radio-csv-products"
                    className="addDonation-radio-button__input"
                    type="radio"
                    checked={productEntryMode === "csv"}
                    onChange={() => setProductEntryMode("csv")}
                  />
                  <label
                    htmlFor="radio-csv-products"
                    className="addDonation-radio-button__label"
                  >
                    <span className="addDonation-radio-button__custom"></span>CSV
                    File
                  </label>
                </div>
                <div className="addDonation-radio-button">
                  <input
                    name="radio-group-products"
                    id="radio-form-products"
                    className="addDonation-radio-button__input"
                    type="radio"
                    checked={productEntryMode === "form"}
                    onChange={() => setProductEntryMode("form")}
                  />
                  <label
                    htmlFor="radio-form-products"
                    className="addDonation-radio-button__label"
                  >
                    <span className="addDonation-radio-button__custom"></span>Form
                  </label>
                </div>
              </div>

              {productEntryMode === "csv" && products.length === 0 && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    className="addDonation-container-btn-file"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <svg
                      fill="#fff"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 50 50"
                    >
                      <path d="M 25 2 C 12.309295 2 2 12.309295 2 25 C 2 37.690705 12.309295 48 25 48 C 37.690705 48 48 37.690705 48 25 C 48 12.309295 37.690705 2 25 2 z M 25 4 C 36.609824 4 46 13.390176 46 25 C 46 36.609824 36.609824 46 25 46 C 13.390176 46 4 36.609824 4 25 C 4 13.390176 13.390176 4 25 4 z M 24 13 L 24 24 L 13 24 L 13 26 L 24 26 L 24 37 L 26 37 L 26 26 L 37 26 L 37 24 L 26 24 L 26 13 L 24 13 z" />
                    </svg>
                    Upload List of Products
                  </button>
                  <span className="addDonation-file-name">
                    *The CSV for products should contain: name, weightPerUnit,
                    totalQuantity, productDescription, status, productType,
                    weightUnit, and weightUnitTotale.
                  </span>
                </>
              )}

              {productEntryMode === "form" && (
                <div className="addDonation-manual-product-entry">
                  {manualProducts.map((product, index) => (
                    <div key={index} className="addDonation-manual-product-row">
                      <div className="addDonation-input-container">
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) =>
                            handleManualProductChange(index, "name", e.target.value)
                          }
                          className="addDonation-input"
                          placeholder=" "
                        />
                        <label>Product Name</label>
                      </div>
                      <div className="addDonation-input-container">
                        <select
                          className="addDonation-input"
                          value={product.productType}
                          onChange={(e) =>
                            handleManualProductChange(
                              index,
                              "productType",
                              e.target.value
                            )
                          }
                        >
                          {productTypes.map((pt) => (
                            <option key={pt} value={pt}>
                              {pt}
                            </option>
                          ))}
                        </select>
                        <label>Product Type</label>
                      </div>
                      <div className="addDonation-input-container">
                        <textarea
                          className="addDonation-input"
                          value={product.productDescription}
                          onChange={(e) =>
                            handleManualProductChange(
                              index,
                              "productDescription",
                              e.target.value
                            )
                          }
                          placeholder=" "
                        />
                        <label>Product Description</label>
                      </div>
                      <div className="addDonation-input-container">
                        <input
                          type="number"
                          value={product.weightPerUnit}
                          onChange={(e) =>
                            handleManualProductChange(
                              index,
                              "weightPerUnit",
                              e.target.value
                            )
                          }
                          className="addDonation-input"
                          placeholder=" "
                        />
                        <label>Weight Per Unit</label>
                      </div>
                      <div className="addDonation-input-container">
                        <select
                          className="addDonation-input"
                          value={product.weightUnit}
                          onChange={(e) =>
                            handleManualProductChange(
                              index,
                              "weightUnit",
                              e.target.value
                            )
                          }
                        >
                          {weightUnits.map((wu) => (
                            <option key={wu} value={wu}>
                              {wu}
                            </option>
                          ))}
                        </select>
                        <label>Weight Unit</label>
                      </div>
                      <div className="addDonation-input-container">
                        <select
                          className="addDonation-input"
                          value={product.weightUnitTotale}
                          onChange={(e) =>
                            handleManualProductChange(
                              index,
                              "weightUnitTotale",
                              e.target.value
                            )
                          }
                        >
                          {weightUnits.map((wu) => (
                            <option key={wu} value={wu}>
                              {wu}
                            </option>
                          ))}
                        </select>
                        <label>Total Weight Unit</label>
                      </div>
                      <div className="addDonation-input-container">
                        <input
                          type="number"
                          value={product.totalQuantity}
                          onChange={(e) =>
                            handleManualProductChange(
                              index,
                              "totalQuantity",
                              e.target.value
                            )
                          }
                          className="addDonation-input"
                          placeholder=" "
                        />
                        <label>Total Quantity</label>
                      </div>
                      {manualProducts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveManualProduct(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddManualProduct}
                    className="addDonation-button"
                  >
                    Add Another Product
                  </button>
                </div>
              )}

              {productEntryMode === "csv" && products.length > 0 && (
                <>
                  <p style={{color: "#8dc73f" }}>
                    List of products uploaded
                  </p>
                  <div className="addDonation-file-actions">
                    <FaEdit
                      className="addDonation-fa-edit"
                      onClick={() => fileInputRef.current.click()}
                    />
                    <FaTrash
                      className="addDonation-fa-trash"
                      onClick={() => handleDeleteList("products")}
                    />
                  </div>
                  <table className="addDonation-product-table">
                    <thead>
                      <tr>
                        {Object.keys(products[0]).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {editableRow === rowIndex &&
                          editableType === "products" ? (
                            Object.keys(row).map((key) => (
                              <td key={key}>
                                {key === "productType" ? (
                                  <select
                                    value={editedItem[key] || ""}
                                    onChange={(e) => handleRowInputChange(e, key)}
                                    className="addDonation-edit-input"
                                  >
                                    {productTypes.map((pt) => (
                                      <option key={pt} value={pt}>
                                        {pt}
                                      </option>
                                    ))}
                                  </select>
                                ) : key === "weightUnit" ||
                                  key === "weightUnitTotale" ? (
                                  <select
                                    value={editedItem[key] || ""}
                                    onChange={(e) => handleRowInputChange(e, key)}
                                    className="addDonation-edit-input"
                                  >
                                    {weightUnits.map((wu) => (
                                      <option key={wu} value={wu}>
                                        {wu}
                                      </option>
                                    ))}
                                  </select>
                                ) : key === "status" ? (
                                  <select
                                    value={editedItem[key] || ""}
                                    onChange={(e) => handleRowInputChange(e, key)}
                                    className="addDonation-edit-input"
                                  >
                                    {statuses.map((status) => (
                                      <option key={status} value={status}>
                                        {status}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type={
                                      key === "weightPerUnit" ||
                                      key === "totalQuantity"
                                        ? "number"
                                        : "text"
                                    }
                                    value={editedItem[key] || ""}
                                    onChange={(e) => handleRowInputChange(e, key)}
                                    className="addDonation-edit-input"
                                  />
                                )}
                              </td>
                            ))
                          ) : (
                            Object.values(row).map((value, colIndex) => (
                              <td key={colIndex}>{value}</td>
                            ))
                          )}
                          <td>
                            {editableRow === rowIndex &&
                            editableType === "products" ? (
                              <FaSave
                                className="addDonation-fa-save"
                                onClick={() => handleSaveRow(rowIndex)}
                              />
                            ) : (
                              <FaEdit
                                className="addDonation-fa-edit"
                                onClick={() => handleEditRow(rowIndex, "products")}
                                style={{
                                  color: "black",
                                  cursor: "pointer",
                                  fontSize: "20px",
                                }}
                              />
                            )}
                            <FaTrash
                              className="addDonation-fa-trash"
                              onClick={() => handleDeleteRow(rowIndex, "products")}
                              style={{
                                color: "red",
                                cursor: "pointer",
                                fontSize: "20px",
                                marginLeft: "10px",
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {errors.products && <p className="addDonation-error-message">{errors.products}</p>}
            </>
          )}

          {error && <p className="addDonation-error-message">{error}</p>}
          <button type="submit" className="addDonation-button">
            Add
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default AddDonation;