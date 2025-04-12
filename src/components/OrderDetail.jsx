import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchOrderDetail } from '../api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import './OrderDetail.css';
import { FaArrowLeft, FaBoxOpen, FaShippingFast, FaCreditCard, FaCalendarAlt } from 'react-icons/fa'; // Added more icons

const OrderDetail = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Use useCallback to memoize the fetch function
    const getOrder = useCallback(async () => {
        if (!id) {
            setError("Order ID is missing from URL.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await fetchOrderDetail(id);
            if (!data || !data.id) { // Check if data or essential ID is missing
                throw new Error(`Order with ID ${id} not found.`);
            }
            console.log("Fetched Order Data:", data); // Log fetched data for debugging
            setOrder(data);
        } catch (err) {
            console.error("Failed to fetch order details:", err);
            setError(err.message || 'Failed to fetch order details.');
            setOrder(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        getOrder();
    }, [getOrder]);

    // --- Conditional Rendering ---
    if (loading) return <LoadingSpinner message="Loading order details..." />;
    if (error) return <div className="order-detail-container"><ErrorMessage message={error} /><Link to="/orders" className="back-link-error"><FaArrowLeft /> Back to Orders</Link></div>;
    if (!order) return <div className="order-detail-container order-detail-not-found">Order not found. <Link to="/orders" className="back-link-error"><FaArrowLeft /> Back to Orders</Link></div>;

    // --- Safe Data Access ---
    const orderTotalPrice = parseFloat(order?.total_price ?? 0);
    // Ensure items is always an array, even if missing or null in response
    const itemsArray = Array.isArray(order?.items) ? order.items : [];
    // Use optional chaining and nullish coalescing for nested objects
    const deliveryAddress = order?.delivery?.delivery_address ?? 'N/A';
    const deliveryStatus = order?.delivery?.status ?? 'N/A';
    const deliveryAgent = order?.delivery?.delivery_agent ?? 'Not Assigned';
    const paymentStatus = order?.payment?.status ?? 'N/A';
    const paymentTransactionId = order?.payment?.transaction_id ?? 'N/A'; // Example, if available
    const paymentMethod = order?.paymentMethod ?? 'N/A'; // Get from top level if sent like that
    const buyerEmail = order?.buyer_details?.email ?? 'N/A'; // Access nested buyer details

    // --- Render Logic ---
    return (
        <div className="order-detail-container">
            <h1 className="order-detail-title">Order Details <span className="order-id-span">#{order.id}</span></h1>

            <div className="order-main-info">
                 {/* Order Info Section */}
                <div className="order-info-card">
                    <h2 className="order-info-header">Order Information</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <FaCalendarAlt className="info-icon" />
                            <div>
                                <strong>Order Date:</strong>
                                <span>{order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </div>
                         <div className="info-item">
                            <FaBoxOpen className="info-icon" />
                            <div>
                                <strong>Order Status:</strong>
                                <span className={`status-badge status-${order?.status?.toLowerCase()}`}>{order?.status ?? 'Unknown'}</span>
                            </div>
                        </div>
                        <div className="info-item">
                            <FaCreditCard className="info-icon" />
                            <div>
                                <strong>Payment Status:</strong>
                                <span className={`status-badge status-${paymentStatus.toLowerCase()}`}>{paymentStatus}</span>
                             </div>
                        </div>
                        <div className="info-item">
                            <FaShippingFast className="info-icon" />
                            <div>
                                <strong>Delivery Status:</strong>
                                <span className={`status-badge status-${deliveryStatus.toLowerCase()}`}>{deliveryStatus}</span>
                            </div>
                        </div>
                        <div className="info-item full-width"> {/* Span full width */}
                            <strong>Buyer Email:</strong>
                            <span>{buyerEmail}</span>
                        </div>
                         <div className="info-item full-width">
                             <strong>Total Paid:</strong>
                             <span className="info-total-price">${orderTotalPrice.toFixed(2)}</span>
                         </div>
                    </div>
                 </div>

                {/* Shipping Info Section */}
                <div className="order-info-card">
                     <h2 className="order-info-header">Shipping Address</h2>
                     <div className="info-grid">
                        <div className="info-item full-width">
                            <p className="shipping-address-text">{deliveryAddress}</p>
                        </div>
                         <div className="info-item full-width">
                            <strong>Delivery Agent:</strong>
                            <span>{deliveryAgent}</span>
                         </div>
                    </div>
                 </div>
            </div>


             {/* Order Items Section */}
             <div className="order-detail-section items-section">
                 <h2>Order Items ({itemsArray.length})</h2>
                 {itemsArray.length > 0 ? (
                    <div className="items-table-container"> {/* Added container for responsiveness */}
                        <table className="order-items-table">
                            <thead>
                                <tr>
                                    <th className="item-product-col">Product</th>
                                    <th className="item-price-col">Unit Price</th>
                                    <th className="item-qty-col">Quantity</th>
                                    <th className="item-total-col">Item Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsArray.map((item, index) => {
                                    const product = item?.product;
                                    const productName = product?.name ?? 'Product Unavailable';
                                    // Use item.price (price at time of order)
                                    const itemPrice = parseFloat(item?.price ?? 0);
                                    const itemQuantity = parseInt(item?.quantity ?? 0, 10);
                                    const itemTotal = itemPrice * itemQuantity;
                                    const key = item?.id ?? `item-${index}`;

                                    return (
                                        <tr key={key}>
                                            <td data-label="Product:"> {/* Add data-label for mobile */}
                                                <div className="product-cell">
                                                    {/* Add image thumbnail if available */}
                                                    {product?.image_path || product?.image_url ? (
                                                        <img
                                                          src={product.image_path || product.image_url}
                                                          alt={productName}
                                                          className="item-thumbnail"
                                                          onError={(e) => e.target.style.display='none'} // Hide if error
                                                        />
                                                    ) : <div className="item-thumbnail-placeholder"></div>}
                                                    {product?.id ? (
                                                        <Link to={`/product/${product.id}`} className="item-name-link">{productName}</Link>
                                                    ) : (
                                                        <span>{productName}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td data-label="Unit Price:">${itemPrice.toFixed(2)}</td>
                                            <td data-label="Quantity:">{itemQuantity}</td>
                                            <td data-label="Item Total:"><strong>${itemTotal.toFixed(2)}</strong></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                     </div>
                 ) : (
                     <p className="no-items-message">No items found in this order.</p>
                 )}
             </div>


            <div className="order-detail-actions">
                 <Link to="/orders" className="back-link">
                    <FaArrowLeft /> Back to Order History
                </Link>
                {/* Potential other actions */}
                 {/* <button className="action-button print-invoice">Print Invoice</button> */}
            </div>
        </div>
    );
};

export default OrderDetail;