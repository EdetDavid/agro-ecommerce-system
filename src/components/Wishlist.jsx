import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../api';
import { useAuth } from '../context/AuthContext';
import ProductCard from './products/ProductCard';
import styles from './products/ProductStyles.module.css';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import './Wishlist.css';

const Wishlist = () => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        // In a real app, you would fetch from an API
        // For now, we'll retrieve from localStorage
        const fetchWishlist = async () => {
            setLoading(true);
            try {
                // Get wishlist IDs from localStorage
                const wishlistIds = JSON.parse(localStorage.getItem('wishlist') || '[]');
                
                if (wishlistIds.length === 0) {
                    setWishlistItems([]);
                    setLoading(false);
                    return;
                }
                
                // Fetch all products
                const products = await fetchProducts();
                
                // Filter only products that are in the wishlist
                const wishlistProducts = products.filter(product => 
                    wishlistIds.includes(product.id)
                );
                
                setWishlistItems(wishlistProducts);
            } catch (err) {
                console.error('Error fetching wishlist:', err);
                setError('Failed to load your wishlist. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchWishlist();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const removeFromWishlist = (productId) => {
        // Get current wishlist
        const currentWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        
        // Remove the product
        const updatedWishlist = currentWishlist.filter(id => id !== productId);
        
        // Update localStorage
        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
        
        // Update state
        setWishlistItems(prev => prev.filter(item => item.id !== productId));
    };

    const clearWishlist = () => {
        if (window.confirm('Are you sure you want to clear your wishlist?')) {
            localStorage.setItem('wishlist', '[]');
            setWishlistItems([]);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="wishlist-container">
                <div className="wishlist-unauthorized">
                    <h2>Please Sign In</h2>
                    <p>You need to be logged in to view your wishlist.</p>
                    <Link to="/auth" className="wishlist-login-btn">Sign In</Link>
                </div>
            </div>
        );
    }

    if (loading) return <LoadingSpinner message="Loading your wishlist..." />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="wishlist-container">
            <div className="wishlist-header">
                <h1>My Wishlist</h1>
                {wishlistItems.length > 0 && (
                    <button 
                        onClick={clearWishlist} 
                        className="wishlist-clear-btn"
                    >
                        Clear Wishlist
                    </button>
                )}
            </div>

            {wishlistItems.length === 0 ? (
                <div className="wishlist-empty">
                    <div className="wishlist-empty-icon">♥</div>
                    <h2>Your wishlist is empty</h2>
                    <p>Add items you love to your wishlist. Review them anytime and easily move them to your cart.</p>
                    <Link to="/products" className="wishlist-browse-btn">Browse Products</Link>
                </div>
            ) : (
                <div className="wishlist-content">
                    <div className={styles.productsGrid}>
                        {wishlistItems.map(product => (
                            <div key={product.id} className="wishlist-item">
                                <ProductCard product={product} />
                                <div className="wishlist-item-actions">
                                    <button 
                                        onClick={() => removeFromWishlist(product.id)}
                                        className="wishlist-remove-btn"
                                    >
                                        Remove
                                    </button>
                                    <button 
                                        onClick={() => {
                                            // Get current cart
                                            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                                            
                                            // Check if product is already in cart
                                            if (!cart.some(item => item.id === product.id)) {
                                                // Add to cart with quantity 1
                                                cart.push({ ...product, quantity: 1 });
                                                localStorage.setItem('cart', JSON.stringify(cart));
                                            }
                                            
                                            // Optionally remove from wishlist
                                            removeFromWishlist(product.id);
                                            
                                            // Navigate to cart
                                            window.location.href = '/cart';
                                        }}
                                        className="wishlist-cart-btn"
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wishlist;