import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import './OrderHistory.css';

const OrderHistory = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getOrders = async () => {
            setLoading(true);
            try {
                const orderData = await fetchOrders();
                setOrders(orderData);
            } catch (err) {
                setError('Failed to fetch orders.');
            } finally {
                setLoading(false);
            }
        };
        getOrders();
    }, []);

    if (loading) return <LoadingSpinner message="Loading your order history..." />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="order-history-container">
            <h1 className="order-history-title">Order History</h1>
            
            {orders.length === 0 ? (
                <div className="order-history-empty">
                    <p>No orders found.</p>
                </div>
            ) : (
                <table className="order-history-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>View Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id}>
                                <td>{order.id}</td>
                                <td>{new Date(order.created_at).toLocaleDateString()}</td>
                                <td>${order.total_price}</td>
                                <td>{order.status}</td>
                                <td><Link to={`/order/${order.id}`} className="view-details-link">View Details</Link></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default OrderHistory;