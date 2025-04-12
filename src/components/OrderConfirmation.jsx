import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchOrderDetail } from '../api'; // Reuse API call
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import './OrderConfirmation.css'; // Create this CSS file
import { FaCheckCircle } from 'react-icons/fa';

const OrderConfirmation = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getOrder = async () => {
            if (!orderId) {
                setError("Order ID is missing.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                // Fetch minimal details needed for confirmation
                const data = await fetchOrderDetail(orderId);
                setOrder(data);
            } catch (err) {
                setError('Failed to fetch order confirmation details.');
                console.error("Confirmation Error:", err);
            } finally {
                setLoading(false);
            }
        };
        getOrder();
    }, [orderId]);

    if (loading) return <LoadingSpinner message="Loading your order confirmation..." />;
    if (error) return <ErrorMessage message={error} />;
    if (!order) return <ErrorMessage message="Could not load order details." />; // Fallback if order is null

    return (
        <div className="order-confirmation-container">
            <div className="confirmation-card">
                <FaCheckCircle className="confirmation-icon" />
                <h1 className="confirmation-title">Thank You For Your Order!</h1>
                <p className="confirmation-message">
                    Your order <span className="order-id">#{order.id}</span> has been placed successfully.
                </p>
                <p>
                    An email confirmation has been sent to <span className="email">{order.buyer?.email || 'your email'}</span>.
                    {/* Note: Buyer email might not be directly on the order object, adjust as needed */}
                </p>

                <div className="confirmation-details">
                    <h2>Order Summary</h2>
                    {/* You can display a simplified summary here if needed */}
                    <p><strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                    <p><strong>Order Total:</strong> ${parseFloat(order.total_price).toFixed(2)}</p>
                     {/* Example: Show only total or add items if desired */}
                     {/* <p>Items: {order.items?.length || 0}</p> */}
                </div>

                <div className="confirmation-actions">
                    <Link to={`/order/${order.id}`} className="confirmation-button view-order">
                        View Order Details
                    </Link>
                    <Link to="/products" className="confirmation-button continue-shopping">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;