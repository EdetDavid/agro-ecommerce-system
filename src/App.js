import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import Home from "./components/home/Home";
import ProductList from "./components/products/ProductList";
import ProductDetail from "./components/products/ProductDetail";
import AddProduct from "./components/products/AddProduct";
import EditProduct from "./components/products/EditProduct";
import Cart from "./components/Cart";
import Auth from "./components/auth/Auth";
import UserProfile from "./components/UserProfile";
import Checkout from "./components/Checkout";
import OrderHistory from "./components/OrderHistory";
import OrderDetail from "./components/OrderDetail";
import OrderConfirmation from "./components/OrderConfirmation";
import Search from "./components/Search";
import Wishlist from "./components/Wishlist";
import Promotions from "./components/Promotions";
import Footer from "./components/Footer";
import AdminDashboard from "./components/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import SuccessPopup from "./components/SuccessPopup"; // Import the new SuccessPopup component

import "./styles/variables.css";

const PAYPAL_CLIENT_ID =
  process.env.REACT_APP_PAYPAL_CLIENT_ID ||
  "AStYh1L52CgAWhblc0kIYsw3xDvjttFuTOaWE2fL6QqpQJhlJ7M058Hsi2xwsbdr_jr9HTvnzRD_97kV";

function AppContent() {
  const [checkoutCurrency, setCheckoutCurrency] = useState("USD"); // Default currency - in real app, fetch dynamically
  const [showSuccessPopup, setShowSuccessPopup] = useState(false); // State for success popup

  // --- Conceptual Function to Simulate Dynamic Currency Update ---
  // In a real application, this would be triggered by user currency selection
  const handleCurrencyChange = (newCurrency) => {
    setCheckoutCurrency(newCurrency);
    console.log(`Currency changed to: ${newCurrency}`);
  };

  const handleOrderCompletion = () => {
    setShowSuccessPopup(true); // Show the success popup
    setTimeout(() => {
      setShowSuccessPopup(false); // Hide the popup after 3 seconds
      window.location.href = "/"; // Redirect to the home page
    }, 3000);
  };

  useEffect(() => {
    // --- Conceptual Currency Setting (replace with real logic) ---
    // Example: Simulate fetching user's preferred currency from backend
    // In a real app, you'd use an API call in useEffect or similar.
    // For now, just set a different currency after a delay for demo purposes
    const currencyTimer = setTimeout(() => {
      handleCurrencyChange("EUR"); // Example: Switch to EUR after 3 seconds
    }, 3000); // Simulate async currency load

    return () => clearTimeout(currencyTimer); // Clear timeout on unmount
  }, []); // Run once on mount

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/search" element={<Search />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route
            path="/product/add"
            element={
              <ProtectedRoute requiredRole="farmer">
                <AddProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/product/edit/:id"
            element={
              <ProtectedRoute requiredRole="farmer">
                <EditProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/cart" element={<Cart />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout currentCurrency={checkoutCurrency} />{" "}
                {/* Pass currency as prop */}
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation/:orderId"
            element={
              <ProtectedRoute>
                <OrderConfirmation onOrderComplete={handleOrderCompletion} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {showSuccessPopup && <SuccessPopup message="Order completed successfully!" />}
      <Footer />
    </div>
  );
}

function App() {
  const initialOptions = {
    "client-id": PAYPAL_CLIENT_ID,
    currency: "USD", // Default currency - might be overridden by Checkout component
    intent: "capture",
  };

  if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === "YOUR_SANDBOX_CLIENT_ID") {
    console.error("FATAL: PayPal Client ID is not configured properly. ...");
  }

  return (
    <AuthProvider>
      <CartProvider>
        <PayPalScriptProvider options={initialOptions}>
          <Router>
            <AppContent /> {/* Render AppContent inside Router and Provider */}
          </Router>
        </PayPalScriptProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
