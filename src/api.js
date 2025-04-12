import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://https://agro-ecommerce-system-backend.onrender.com/api";

// --- Create dedicated Axios instance ---
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Don't set default Content-Type here if you need to handle FormData
});

// --- Axios Request Interceptor ---
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // --- THIS IS THE KEY PART for file uploads ---
    if (config.data instanceof FormData) {
      // Let the browser set the Content-Type header automatically
      // for multipart/form-data, including the boundary.
      // Do not set config.headers['Content-Type'] = 'multipart/form-data';
      // explicitly here, as it might miss the boundary.
      delete config.headers["Content-Type"]; // Remove any default
    } else if (!config.headers["Content-Type"]) {
       // If not FormData, ensure JSON Content-Type is set if not already present
       config.headers["Content-Type"] = "application/json";
    }
    // --- End Key Part ---

    return config;
  },
  (error) => Promise.reject(error)
);

// --- Error Handling Helper ---
function handleApiError(error) {
  let errorMessage = "An unexpected error occurred. Please try again.";

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    console.error(`API Error Response (${status}):`, data);

    if (status === 401) {
      errorMessage = "Authentication failed. Please log in again.";
      // Consider redirecting to login or triggering logout
      // Example: window.location.href = '/auth';
      localStorage.removeItem("token"); // Clear token on 401
    } else if (status === 403) {
      errorMessage = "You do not have permission to perform this action.";
    } else if (status === 404) {
      errorMessage = "The requested resource was not found.";
    } else if (data) {
        if (typeof data === 'string') {
            errorMessage = data;
        } else if (data.detail) { // DRF default error key
            errorMessage = data.detail;
        } else if (data.error) { // Common custom error key
            errorMessage = data.error;
        } else if (Array.isArray(data)) { // Handle list of errors
             errorMessage = data.join(' ');
        } else if (typeof data === 'object') { // Handle field errors
            const fieldErrors = Object.entries(data)
              .map(([field, messages]) =>
                  `${field}: ${Array.isArray(messages) ? messages.join(" ") : String(messages)}`)
              .join("; ");
            if (fieldErrors) {
              errorMessage = `Validation failed: ${fieldErrors}`;
            } else {
              errorMessage = `Server error (${status}). Check details or contact support.`;
            }
        } else {
             errorMessage = `Server error (${status}). Please try again.`;
        }
    } else {
      errorMessage = `Server responded with status ${status}.`;
    }
  } else if (error.request) {
    console.error("API Error Request:", error.request);
    errorMessage =
      "No response from server. Please check your network connection.";
  } else {
    console.error("API Error Message:", error.message);
    errorMessage = `Error setting up request: ${error.message}`;
  }

  // Return an actual Error object
  const errorObject = new Error(errorMessage);
  errorObject.originalError = error; // Attach original error if needed
  return errorObject;
}


// =========================================
// ===          AUTH API Calls           ===
// =========================================
export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post("/users/login/", credentials);
    if (response.data.access) {
      localStorage.setItem("token", response.data.access);
      // Optionally store refresh token if using it:
      // localStorage.setItem("refreshToken", response.data.refresh);
    }
    return response.data; // Contains access token, maybe refresh
  } catch (error) {
    throw handleApiError(error);
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post("/users/register/", userData);
    return response.data; // Should return created user data (without password)
  } catch (error) {
    throw handleApiError(error);
  }
};

export const logoutUser = async () => {
    // No API call usually needed for simple JWT logout, just clear local storage
    localStorage.removeItem("token");
    // localStorage.removeItem("refreshToken"); // Clear refresh token too
    return Promise.resolve(); // Indicate success
};

export const fetchUserProfile = async () => {
  try {
    const response = await apiClient.get("/users/profile/me/");
    return response.data; // Returns the Profile object (with nested user)
  } catch (error) {
    throw handleApiError(error);
  }
};

// Updated updateUserProfile - accepts FormData or JSON
export const updateUserProfile = async (profileData) => {
    try {
      // The interceptor handles Content-Type based on profileData type (FormData or object)
      const response = await apiClient.patch("/users/profile/me/", profileData);
      return response.data; // Returns updated Profile object
    } catch (error) {
      throw handleApiError(error);
    }
};


// =========================================
// ===        PRODUCT API Calls          ===
// =========================================
export const fetchProducts = async () => {
  try {
    const response = await apiClient.get("/products/products/");
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const fetchProductDetail = async (id) => {
  try {
    const response = await apiClient.get(`/products/products/${id}/`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Accepts FormData
export const createProduct = async (productFormData) => {
  if (!(productFormData instanceof FormData)) {
    throw new Error("createProduct requires FormData.");
  }
  try {
    // Interceptor handles Content-Type
    const response = await apiClient.post("/products/products/", productFormData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Accepts FormData
export const updateProduct = async (id, productFormData) => {
  if (!(productFormData instanceof FormData)) {
    throw new Error("updateProduct requires FormData.");
  }
  try {
     // Use PATCH for partial updates, PUT for full replacement
     // Interceptor handles Content-Type
    const response = await apiClient.patch(`/products/products/${id}/`, productFormData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const deleteProduct = async (id) => {
  try {
    await apiClient.delete(`/products/products/${id}/`);
    return true; // Indicate success
  } catch (error) {
    throw handleApiError(error);
  }
};

// =========================================
// ===        CATEGORY API Calls         ===
// =========================================
export const fetchCategories = async () => {
  try {
    const response = await apiClient.get("/products/categories/");
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createCategory = async (categoryData) => {
  try {
    const response = await apiClient.post("/products/categories/", categoryData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// =========================================
// ===          ORDER API Calls          ===
// =========================================
export const fetchOrders = async () => {
  try {
    const response = await apiClient.get("/orders/orders/");
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const fetchOrderDetail = async (id) => {
  try {
    const response = await apiClient.get(`/orders/orders/${id}/`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createOrder = async (orderData) => {
  try {
    const response = await apiClient.post("/orders/orders/", orderData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// =========================================
// ===         PAYMENT API Calls         ===
// =========================================

export const createPayPalOrder = async (djangoOrderId) => {
  try {
    console.log("API: Creating PayPal order for Django Order ID:", djangoOrderId);
    const response = await apiClient.post("/payments/paypal/create-order/", {
      order_id: djangoOrderId, // Match backend expected key
    });
    console.log("API: PayPal order created response:", response.data);
    if (!response.data?.id) {
      throw new Error("PayPal Order ID not received from backend.");
    }
    return response.data.id; // Return only the PayPal Order ID
  } catch (error) {
    console.error("API Error creating PayPal order:", error);
    throw handleApiError(error); // Use the helper for consistent error format
  }
};

export const capturePayPalOrder = async (paypalOrderID, djangoOrderID) => {
  try {
    console.log("API: Capturing PayPal order:", paypalOrderID, "for Django Order ID:", djangoOrderID);
    const response = await apiClient.post("/payments/paypal/capture-order/", {
      orderID: paypalOrderID,      // Match backend expected key
      djangoOrderID: djangoOrderID // Match backend expected key
    });
    console.log("API: PayPal order capture response:", response.data);
    return response.data; // Return the full capture result (e.g., updated payment record)
  } catch (error) {
    console.error("API Error capturing PayPal order:", error);
    throw handleApiError(error); // Use the helper
  }
};

// =========================================
// ===      PLACEHOLDER API Calls        ===
// =========================================
// --- Payments ---
export const createPayment = async (paymentData) => {
  try {
    console.warn("createPayment API call not fully implemented.");
    return Promise.reject(new Error("Payment API not implemented"));
  } catch (error) {
    throw handleApiError(error);
  }
};
// --- Reviews ---
export const fetchReviews = async (productId) => {
  try {
    console.warn("fetchReviews API call not fully implemented.");
    return Promise.resolve([]);
  } catch (error) {
    throw handleApiError(error);
  }
};
export const createReview = async (reviewData) => {
  try {
    console.warn("createReview API call not fully implemented.");
    return Promise.reject(new Error("Review API not implemented"));
  } catch (error) {
    throw handleApiError(error);
  }
};
// --- Logistics (Deliveries) ---
export const fetchDeliveryStatus = async (orderId) => {
  try {
    console.warn("fetchDeliveryStatus API call not fully implemented.");
    return Promise.resolve({ status: "Pending", delivery_agent: null });
  } catch (error) {
    throw handleApiError(error);
  }
};
// --- Notifications ---
export const fetchNotifications = async () => {
  try {
    console.warn("fetchNotifications API call not fully implemented.");
    return Promise.resolve([]);
  } catch (error) {
    throw handleApiError(error);
  }
};
export const markNotificationRead = async (notificationId) => {
  try {
    console.warn("markNotificationRead API call not fully implemented.");
    return Promise.resolve({ id: notificationId, is_read: true });
  } catch (error) {
    throw handleApiError(error);
  }
};
