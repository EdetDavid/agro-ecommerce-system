import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import SuccessPopup from "./SuccessPopup"; // Import SuccessPopup
import "./Checkout.css";

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [{ isPending: isPayPalScriptPending, isRejected: isPayPalScriptRejected }] = usePayPalScriptReducer();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false); // State for SuccessPopup
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    phone: "",
    paymentMethod: "paypal",
  });

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + parseFloat(item.price || 0) * (item.quantity || 1),
        0
      ),
    [cartItems]
  );
  const shippingCost = 0;
  const taxRate = 0.05;
  const tax = useMemo(() => subtotal * taxRate, [subtotal, taxRate]);
  const total = useMemo(() => subtotal + shippingCost + tax, [subtotal, shippingCost, tax]);

  useEffect(() => {
    setLoading(true);
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (cart.length === 0) {
        navigate("/cart");
        return;
      }
      setCartItems(cart);

      // Pre-fill form data
      setFormData((prev) => ({
        ...prev,
        fullName: user?.name || "",
        email: user?.email || "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        phone: "",
        paymentMethod: "paypal",
      }));
    } catch (err) {
      setError("Failed to load cart data.");
    } finally {
      setLoading(false);
    }
  }, [navigate, user]);

  const handleCreateOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: total.toFixed(2),
          },
        },
      ],
    });
  };

  const handleApprove = async (data, actions) => {
    try {
      const details = await actions.order.capture();
      console.log("Payment successful:", details);
      localStorage.removeItem("cart");
      setCartItems([]);

      // Show SuccessPopup and redirect after a delay
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        navigate("/");
      }, 3000); // Redirect after 3 seconds
    } catch (err) {
      console.error("Payment capture failed:", err);
      setError("Payment capture failed. Please try again.");
    }
  };

  const handleError = (err) => {
    console.error("PayPal error:", err);
    setError("An error occurred with PayPal. Please try again.");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return (
    <div className="checkout-container">
      <LoadingSpinner message="Loading checkout..." />
    </div>
  );
  
  if (error) return (
    <div className="checkout-container">
      <ErrorMessage message={error} />
    </div>
  );

  return (
    <div className="checkout-container">
      <h1 className="checkout-title">Checkout</h1>

      {error && <ErrorMessage message={error} />}
      {showSuccessPopup && <SuccessPopup message="Payment successful!" />}

      <form onSubmit={(e) => e.preventDefault()} className="checkout-form" noValidate>
        {/* Shipping Information Section */}
        <div className="checkout-section">
          <h2>Shipping Information</h2>
          
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>
          
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          {/* Address */}
          <div className="form-group">
            <label htmlFor="address">Street Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St"
            />
          </div>
          
          {/* City */}
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
            />
          </div>
          
          {/* State & Zip */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="state">State / Province</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="zipCode">Zip / Postal Code</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
              />
            </div>
          </div>
          
          {/* Country */}
          <div className="form-group">
            <label htmlFor="country">Country</label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              {/* Add more countries as needed */}
            </select>
          </div>
          
          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone">
              Phone{" "}
              <span style={{ color: "#999", fontWeight: "normal" }}>
                (Optional)
              </span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="For delivery updates"
            />
          </div>
        </div>

        {/* Right Column: Payment & Summary */}
        <div className="checkout-right-column">
          {/* Payment Method Selection */}
          <div className="checkout-section">
            <h2>Payment Method</h2>
            <div className="form-group payment-options">
              {/* PayPal Option */}
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paypal"
                  checked={formData.paymentMethod === "paypal"}
                  onChange={handleChange}
                />
                <img
                  src="https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_266x142.png"
                  alt="PayPal"
                  style={{ height: "24px", marginLeft: "8px" }}
                />
              </label>
              {/* Placeholder for other methods */}
              <label
                className="payment-option"
                style={{ color: "#aaa", cursor: "not-allowed" }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="credit_card"
                  disabled
                  checked={formData.paymentMethod === "credit_card"}
                  onChange={handleChange}
                />
                <span>Credit/Debit Card (Coming Soon)</span>
              </label>
            </div>

            {/* PayPal Buttons Area */}
            {formData.paymentMethod === "paypal" && (
              <div
                className="paypal-button-container"
                style={{
                  marginTop: "20px",
                  minHeight: "50px" /* Prevents layout jump */,
                }}
              >
                {isPayPalScriptPending && (
                  <LoadingSpinner message="Loading PayPal..." />
                )}
                {isPayPalScriptRejected && (
                  <ErrorMessage message="Failed to load PayPal checkout. Please refresh or try again later." />
                )}
                {!isPayPalScriptPending && !isPayPalScriptRejected && (
                  <PayPalButtons
                    style={{
                      layout: "vertical",
                      color: "blue",
                      shape: "rect",
                      label: "pay",
                    }}
                    createOrder={handleCreateOrder}
                    onApprove={handleApprove}
                    onError={handleError}
                  />
                )}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="checkout-summary checkout-section">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {cartItems.map((item) => (
                <div key={item.id} className="summary-item">
                  <span className="summary-item-name">
                    {item.name} (x{item.quantity || 1})
                  </span>
                  <span className="summary-item-price">
                    $
                    {(
                      parseFloat(item.price || 0) * (item.quantity || 1)
                    ).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="summary-row">
              <span>Subtotal:</span> <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span> <span>Free</span>
            </div>
            <div className="summary-row">
              <span>Tax:</span> <span>${tax.toFixed(2)}</span>
            </div>
            <div className="summary-row summary-total">
              <span>Total:</span> <span>${total.toFixed(2)}</span>
            </div>

            {formData.paymentMethod !== "paypal" && (
              <button type="button" disabled className="checkout-submit-btn">
                Payment Method Unavailable
              </button>
            )}

            <p className="secure-checkout">🔒 Secure Payment</p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;