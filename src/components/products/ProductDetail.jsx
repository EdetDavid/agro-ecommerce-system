import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom"; // <-- Import useLocation
import { fetchProductDetail, deleteProduct, fetchCategories } from "../../api";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../LoadingSpinner";
import ErrorMessage from "../ErrorMessage";
import styles from "./ProductStyles.module.css";
import { FaShoppingCart, FaHeart, FaEdit, FaTrash, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { ClipLoader } from 'react-spinners'; // <-- Import ClipLoader

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth(); // Need isAuthenticated
    const location = useLocation(); // <-- Get location object

    const [product, setProduct] = useState(null);
    const [categoryName, setCategoryName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isOwner, setIsOwner] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const productData = await fetchProductDetail(id);
            if (!productData) throw new Error("Product not found");
            setProduct(productData);

            // Ensure user object and its id exist before comparison
            const currentUserId = user?.user?.id || user?.id;
            const ownerStatus = isAuthenticated && user?.is_farmer && currentUserId === productData.farmer;
            setIsOwner(ownerStatus);

            if (productData.category) {
                try {
                    const categories = await fetchCategories();
                    const category = categories.find(c => c.id === productData.category);
                    setCategoryName(category?.name || '');
                } catch (catErr) { console.error("Error fetching category:", catErr); }
            }
         } catch (err) {
            console.error("Error fetching product:", err);
            setError(err.message || "Failed to fetch product details.");
            setProduct(null);
         } finally {
            setLoading(false);
        }
        // Include isAuthenticated in dependency array if its change should trigger reload
    }, [id, user, isAuthenticated]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const showFeedback = (message) => {
        setFeedbackMessage(message);
        setTimeout(() => setFeedbackMessage(''), 2500);
    };

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            // Pass current location in state for redirect back
            navigate('/auth', { state: { from: location }, replace: true }); // <-- Use location object
            return;
        }
        if (!product || quantity <= 0) return;

        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const existingItemIndex = cart.findIndex(item => item.id === product.id);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            cart.push({ ...product, quantity });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        showFeedback(`${quantity} x ${product.name} added to cart!`);
        setQuantity(1);
    };

    const handleAddToWishlist = () => {
         if (!isAuthenticated) {
            // Pass current location in state for redirect back
            navigate('/auth', { state: { from: location }, replace: true }); // <-- Use location object
            return;
        }
        if (!product) return;

        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        if (!wishlist.includes(product.id)) {
            wishlist.push(product.id);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            showFeedback(`${product.name} added to wishlist!`);
        } else {
             showFeedback(`${product.name} is already in your wishlist.`);
        }
    };


    const handleDelete = async () => {
        if (!isOwner || !product) return;
        if (!window.confirm(`Are you sure you want to delete "${product.name}"? This cannot be undone.`)) {
            return;
        }
        setIsDeleting(true);
        setError(null);
        try {
            await deleteProduct(product.id);
            navigate("/products", { state: { message: `Product "${product.name}" deleted successfully.` } });
        } catch (err) {
            console.error("Error deleting product:", err);
            setError("Failed to delete product: " + (err.message || ''));
            setIsDeleting(false);
        }
    };

    const handleQuantityChange = (change) => {
        setQuantity(prev => Math.max(1, Math.min(prev + change, product?.quantity || 1)));
    };


    if (loading) return <LoadingSpinner message="Loading product details..." />;
    if (error && !product) return <div className={styles.detailContainer}><ErrorMessage message={error} /></div>;
    if (!product) return <div className={styles.notFound}>Product not found.</div>;


    const isLowStock = product.quantity < 10;
    const productImage = product.image_path || product.image_url || `https://via.placeholder.com/600x400?text=No+Image+Available`;

    return (
        <div className={styles.detailContainer}>
             {error && <ErrorMessage message={error} />}

             {feedbackMessage && (
                <div className={styles.feedbackPopup}>
                    <FaCheckCircle /> {feedbackMessage}
                </div>
            )}

            <div className={styles.productLayout}>
                <div className={styles.productImageWrapper}>
                    <img
                        src={productImage}
                        alt={product.name}
                        className={styles.detailImage}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/600x400?text=Image+Load+Error";
                        }}
                    />
                     {isLowStock && <span className={`${styles.stockBadge} ${styles.lowStockBadge}`}>Low Stock</span>}
                </div>

                <div className={styles.productContent}>
                    {categoryName && (
                         <Link to={`/products?category=${product.category}`} className={styles.categoryLink}>
                            {categoryName}
                         </Link>
                     )}
                    <h1 className={styles.productTitle}>{product.name}</h1>

                    {product.farmer_details && (
                        <div className={styles.farmerInfo}>
                             <img src={`https://avatar.vercel.sh/${product.farmer_details.username}.svg?text=${product.farmer_details.username[0]}`} alt="Farmer" className={styles.farmerAvatar} />
                            <div>
                                <span className={styles.farmerLabel}>Sold by:</span>
                                <span className={styles.farmerName}>{product.farmer_details.username}</span>
                            </div>
                        </div>
                    )}


                    <div className={styles.priceSection}>
                        <span className={styles.productDetailPrice}>${parseFloat(product.price).toFixed(2)}</span>
                        <span className={`${styles.stockInfo} ${isLowStock ? styles.lowStock : ''}`}>
                            {product.quantity} available
                        </span>
                    </div>

                    <p className={styles.productDescription}>{product.description}</p>

                     <div className={styles.purchaseActions}>
                         <div className={styles.quantitySelector}>
                            <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} aria-label="Decrease quantity">-</button>
                            <input type="number" value={quantity} readOnly min="1" max={product.quantity} aria-label="Quantity" />
                            <button onClick={() => handleQuantityChange(1)} disabled={quantity >= product.quantity} aria-label="Increase quantity">+</button>
                        </div>
                        <button
                            className={`${styles.actionButton} ${styles.addToCartButton}`}
                            onClick={handleAddToCart}
                            disabled={product.quantity === 0}
                        >
                            <FaShoppingCart /> {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                         <button className={styles.wishlistButton} onClick={handleAddToWishlist} aria-label="Add to Wishlist">
                            <FaHeart />
                        </button>
                     </div>

                    {isOwner && (
                        <div className={styles.ownerActions}>
                            <h3 className={styles.ownerActionsTitle}>Manage Product</h3>
                            <Link
                                to={`/product/edit/${product.id}`}
                                className={`${styles.actionButtonSmall} ${styles.editButton}`}
                            >
                                <FaEdit /> Edit
                            </Link>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className={`${styles.actionButtonSmall} ${styles.deleteButton}`}
                            >
                                {/* Use imported ClipLoader */}
                                {isDeleting ? <ClipLoader size={14} color="#fff" /> : <FaTrash />} Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

             <Link to="/products" className={styles.backLink}>
                <FaArrowLeft /> Back to Products
            </Link>
        </div>
    );
};

export default ProductDetail;