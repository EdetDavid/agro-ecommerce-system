import React from 'react';

const AdminDashboard = () => {
    return (
        <div>
            <h1>Admin Dashboard</h1>
            <ul>
                <li><a href="/admin/products">Manage Products</a></li>
                <li><a href="/admin/orders">Manage Orders</a></li>
                <li><a href="/admin/users">Manage Users</a></li>
            </ul>
        </div>
    );
};

export default AdminDashboard;