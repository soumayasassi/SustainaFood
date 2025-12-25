import axios from "axios";

const PRODUCT_BASE_URL = 'http://localhost:3000/product';

// ✅ Get all products
export const getAllProducts = async () => {
  try {
    return await axios.get(`${PRODUCT_BASE_URL}/all`);
  } catch (error) {
    console.error("Error fetching all products:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Get product by ID
export const getProductById = async (id) => {
  try {
    return await axios.get(`${PRODUCT_BASE_URL}/${id}`);
  } catch (error) {
    console.error("Error fetching product by ID:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Get products by Donation ID
export const getProductsByDonationId = async (idDonation) => {
  try {
    return await axios.get(`${PRODUCT_BASE_URL}/donation/${idDonation}`);
  } catch (error) {
    console.error("Error fetching products by donation ID:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Get products by Status
export const getProductsByStatus = async (status) => {
  try {
    return await axios.get(`${PRODUCT_BASE_URL}/status/${status}`);
  } catch (error) {
    console.error("Error fetching products by status:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Create a new product (with optional image upload)
export const createProduct = async (productData, imageFile = null) => {
  try {
    // If there's an image, use FormData for multipart/form-data
    if (imageFile) {
      const formData = new FormData();
      // Append the image file
      formData.append("image", imageFile);
      // Append other product data fields
      Object.keys(productData).forEach((key) => {
        formData.append(key, productData[key]);
      });

      return await axios.post(`${PRODUCT_BASE_URL}/create`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      // If no image, send as JSON
      return await axios.post(`${PRODUCT_BASE_URL}/create`, productData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    console.error("Error creating product:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Update a product by ID (with optional image upload)
export const updateProduct = async (id, productData, imageFile = null) => {
  try {
    // If there's an image, use FormData for multipart/form-data
    if (imageFile) {
      const formData = new FormData();
      // Append the image file
      formData.append("image", imageFile);
      // Append other product data fields
      Object.keys(productData).forEach((key) => {
        formData.append(key, productData[key]);
      });

      return await axios.put(`${PRODUCT_BASE_URL}/update/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      // If no image, send as JSON
      return await axios.put(`${PRODUCT_BASE_URL}/update/${id}`, productData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  } catch (error) {
    console.error("Error updating product:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Delete a product by ID
export const deleteProduct = async (id) => {
  try {
    return await axios.delete(`${PRODUCT_BASE_URL}/delete/${id}`);
  } catch (error) {
    console.error("Error deleting product:", error.response?.data || error.message);
    throw error;
  }
};