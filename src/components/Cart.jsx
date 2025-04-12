import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchProducts } from '../api';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import './Cart.css';

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    // Calculate total price
    const totalPrice = cartItems.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * item.quantity);
    }, 0);

    useEffect(() => {
        const loadCartItems = async () => {
            setLoading(true);
            try {
                // Get cart from localStorage
                const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                
                if (cart.length === 0) {
                    setCartItems([]);
                    setLoading(false);
                    return;
                }
                
                // If cart has product IDs instead of full products, fetch the products
                if (typeof cart[0] === 'number') {
                    // Fetch all products
                    const products = await fetchProducts();
                    
                    // Map cart IDs to products with quantity
                    const cartWithProducts = cart.map(id => {
                        const product = products.find(p => p.id === id);
                        return product ? { ...product, quantity: 1 } : null;
                    }).filter(item => item !== null);
                    
                    setCartItems(cartWithProducts);
                    // Update localStorage with full product data
                    localStorage.setItem('cart', JSON.stringify(cartWithProducts));
                } else {
                    setCartItems(cart);
                }
            } catch (err) {
                console.error('Error loading cart:', err);
                setError('Failed to load your cart. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadCartItems();
    }, []);

    const updateQuantity = (productId, newQuantity) => {
        // Ensure quantity is valid
        const quantity = Math.max(1, Math.min(newQuantity, 99));
        
        const updatedCart = cartItems.map(item => 
            item.id === productId ? { ...item, quantity } : item
        );
        
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
    };

    const removeFromCart = (productId) => {
        const updatedCart = cartItems.filter(item => item.id !== productId);
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
    };

    const clearCart = () => {
        if (window.confirm('Are you sure you want to clear your cart?')) {
            setCartItems([]);
            localStorage.setItem('cart', '[]');
        }
    };

    const proceedToCheckout = () => {
        if (!isAuthenticated) {
            if (window.confirm('You need to be logged in to checkout. Would you like to sign in now?')) {
                navigate('/auth', { state: { from: '/cart' } });
            }
            return;
        }
        
        navigate('/checkout');
    };

    if (loading) return <LoadingSpinner message="Loading your cart..." />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className="cart-container">
            <h1 className="cart-title">Your Shopping Cart</h1>
            
            {cartItems.length === 0 ? (
                <div className="cart-empty">
                    <div className="cart-empty-icon">🛒</div>
                    <h2>Your cart is empty</h2>
                    <p>Looks like you haven't added any products to your cart yet.</p>
                    <Link to="/products" className="cart-browse-btn">Browse Products</Link>
                </div>
            ) : (
                <>
                    <div className="cart-actions">
                        <button onClick={clearCart} className="cart-clear-btn">Clear Cart</button>
                        <Link to="/products" className="cart-continue-shopping">Continue Shopping</Link>
                    </div>
                    
                    <div className="cart-content">
                        <div className="cart-items">
                            <div className="cart-header">
                                <div className="cart-header-product">Product</div>
                                <div className="cart-header-price">Price</div>
                                <div className="cart-header-quantity">Quantity</div>
                                <div className="cart-header-total">Total</div>
                                <div className="cart-header-actions"></div>
                            </div>
                            
                            {cartItems.map(item => (
                                <div key={item.id} className="cart-item">
                                    <div className="cart-item-product">
                                        <div className="cart-item-image">
                                            <img 
                                                src={item.image_path || item.image_url || "https://via.placeholder.com/80"}
                                                alt={item.name}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://via.placeholder.com/80?text=No+Image";
                                                }}
                                            />
                                        </div>
                                        <div className="cart-item-details">
                                            <Link to={`/product/${item.id}`} className="cart-item-name">{item.name}</Link>
                                            {item.category_name && <span className="cart-item-category">{item.category_name}</span>}
                                        </div>
                                    </div>
                                    
                                    <div className="cart-item-price">${parseFloat(item.price).toFixed(2)}</div>
                                    
                                    <div className="cart-item-quantity">
                                        <button 
                                            className="quantity-btn"
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            -
                                        </button>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="99" 
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                            className="quantity-input"
                                        />
                                        <button 
                                            className="quantity-btn"
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                    
                                    <div className="cart-item-total">
                                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                                    </div>
                                    
                                    <div className="cart-item-actions">
                                        <button 
                                            onClick={() => removeFromCart(item.id)}
                                            className="cart-item-remove"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="cart-summary">
                            <h2 className="summary-title">Order Summary</h2>
                            
                            <div className="summary-row">
                                <span>Items ({cartItems.length}):</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>
                            
                            <div className="summary-row">
                                <span>Shipping & Handling:</span>
                                <span>$0.00</span>
                            </div>
                            
                            <div className="summary-row summary-total">
                                <span>Order Total:</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>
                            
                            <button 
                                onClick={proceedToCheckout}
                                className="checkout-btn"
                                disabled={cartItems.length === 0}
                            >
                                Proceed to Checkout
                            </button>
                            
                            <div className="secure-checkout">
                                <span className="secure-icon">🔒</span> Secure Checkout
                            </div>
                            
                            <div className="payment-methods">
                                We accept: Credit Card, PayPal, Bank Transfer
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Cart;