import React, { useState, useEffect, useRef } from 'react';
import { fetchProductDetail, updateProduct, fetchCategories } from '../../api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import styles from './ProductStyles.module.css';

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // user here is likely the profile object from AuthContext

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        quantity: '',
        category: ''
    });

    // Image states
    const [image, setImage] = useState(null); // For new file upload
    const [imagePreview, setImagePreview] = useState(''); // Preview for new file
    const [imageUrl, setImageUrl] = useState(''); // For new image URL input
    const [currentImageUrl, setCurrentImageUrl] = useState(''); // Stores existing image URL/path
    const [keepExistingImage, setKeepExistingImage] = useState(true); // Flag to manage image update
    const fileInputRef = useRef(null); // Ref for clearing file input

    // Other states
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true); // For initial data load
    const [submitting, setSubmitting] = useState(false); // For form submission loading state
    const [error, setError] = useState(null); // For displaying errors
    const [fieldErrors, setFieldErrors] = useState({}); // For inline field validation errors
    const [isOwner, setIsOwner] = useState(false); // Flag to check if current user owns the product

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Load product data first
                const productData = await fetchProductDetail(id);
                if (!productData) {
                    throw new Error("Product not found.");
                }

                // --- CORRECTED OWNERSHIP CHECK ---
                // 1. Get the actual User ID from the nested user object in the context
                const currentUserId = user?.user?.id;

                // 2. Log IDs and types for debugging
                console.log("EditProduct: Context User Object:", user);
                console.log("EditProduct: Extracted Context User ID:", currentUserId);
                console.log("EditProduct: Product Farmer ID from API:", productData.farmer);
                console.log("EditProduct: Type of Context User ID:", typeof currentUserId);
                console.log("EditProduct: Type of Product Farmer ID:", typeof productData.farmer);

                // 3. Perform the comparison (convert to Number for safety)
                // Check if user context exists, nested user exists, and IDs match
                if (user && user.user && Number(currentUserId) === Number(productData.farmer)) {
                    console.log("EditProduct: Ownership confirmed.");
                    setIsOwner(true);
                } else {
                    console.log("EditProduct: Ownership check failed.");
                    setIsOwner(false);
                    // We set isOwner to false, the rendering logic will handle showing the error message.
                    // No need to set general 'error' state here unless the API call itself failed.
                }
                // --- END CORRECTED CHECK ---

                // Load categories (can be done concurrently or after ownership check)
                const categoriesData = await fetchCategories();

                // If ownership is confirmed, set form data
                if (Number(currentUserId) === Number(productData.farmer)) { // Re-check here before setting state
                    setFormData({
                        name: productData.name,
                        description: productData.description,
                        price: productData.price.toString(),
                        quantity: productData.quantity.toString(),
                        category: productData.category?.toString() || '' // Use optional chaining and fallback
                    });

                    // Set current image display state based on product data
                    const existingImage = productData.image_path || productData.image_url;
                    if (existingImage) {
                        setCurrentImageUrl(existingImage);
                        setKeepExistingImage(true); // Default to keeping it
                        setImageUrl(''); // Clear potential user input if existing image is present
                    } else {
                        setCurrentImageUrl('');
                        setKeepExistingImage(false); // No existing image to keep
                    }
                }

                setCategories(categoriesData);

            } catch (err) {
                console.error("Error in loadData:", err);
                setError('Failed to load product data: ' + (err.message || 'Please try again.'));
                setIsOwner(false); // Ensure isOwner is false if loading fails
            } finally {
                setLoading(false);
            }
        };

        // Check if user is loaded from context before fetching
        if (user && user.user) { // Check for nested user object as well
            loadData();
        } else if (!loading) { // Only set error if not already loading and user isn't loaded
            setError('User data not available. Please ensure you are logged in.');
            setLoading(false); // Stop loading if user context isn't ready
            setIsOwner(false);
        }

    }, [id, user]); // Rerun effect if id or user context changes


    // --- Validation Function ---
    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = 'Product name is required';
        if (!formData.description.trim()) errors.description = 'Description is required';
        if (!formData.price) errors.price = 'Price is required';
        else if (parseFloat(formData.price) <= 0) errors.price = 'Price must be positive';
        if (!formData.quantity) errors.quantity = 'Quantity is required';
        else if (parseInt(formData.quantity, 10) < 0) errors.quantity = 'Quantity cannot be negative'; // Allow 0
        if (!formData.category) errors.category = 'Category is required';
        // Add image validation if needed (e.g., required on create, optional on edit)

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // --- Input Change Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    // --- Image Handlers ---
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setFieldErrors(prev => ({ ...prev, image: 'Image size should be less than 2MB' }));
                return;
            }
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
            setImageUrl(''); // Clear URL field
            setKeepExistingImage(false); // Indicate new image is being used
            setFieldErrors(prev => ({ ...prev, image: null })); // Clear image error
        }
    };

    const handleImageUrlChange = (e) => {
        const url = e.target.value;
        setImageUrl(url);
        if (url) { // If URL is entered, clear file input/preview
            setImage(null);
            setImagePreview('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            setKeepExistingImage(false); // Indicate new image URL is being used
            setFieldErrors(prev => ({ ...prev, image: null })); // Clear image error
        }
    };

    const handleRemoveImage = () => { // Used when removing the *current* image or canceling a *new* image
        setImage(null);
        setImagePreview('');
        setImageUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setKeepExistingImage(false); // Mark that we don't want to keep the existing one anymore
    };

    const handleKeepExistingImage = () => { // Used to revert back to keeping the current image
        setImage(null);
        setImagePreview('');
        setImageUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setKeepExistingImage(true); // Explicitly keep the existing image
        setFieldErrors(prev => ({ ...prev, image: null })); // Clear image error
    };


    // --- Form Submission Handler ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isOwner || !validateForm()) { // Double-check ownership and validation
            if (!isOwner) setError("Cannot submit: You are not the owner.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const productData = new FormData();
            productData.append('name', formData.name);
            productData.append('description', formData.description);
            productData.append('price', parseFloat(formData.price));
            productData.append('quantity', parseInt(formData.quantity, 10));
            productData.append('category', parseInt(formData.category, 10));

            // --- Image Update Logic ---
            if (image) {
                // 1. New file selected: Append the new image file
                productData.append('image', image);
                 // Ensure backend handles clearing image_url if image file is provided
                productData.append('image_url', ''); // Explicitly clear URL if file is uploaded
            } else if (imageUrl) {
                // 2. New URL entered: Append the new image URL
                productData.append('image_url', imageUrl);
                 // Ensure backend handles clearing image file if image_url is provided
                productData.append('image', ''); // Explicitly clear file if URL is provided
            } else if (!keepExistingImage && currentImageUrl) {
                // 3. No new image AND user chose to remove existing: Send empty values to clear
                productData.append('image', '');
                productData.append('image_url', '');
            }
            // 4. If keepExistingImage is true and no new image provided, don't append anything for image/image_url.
            // The backend should retain the existing image in this case.

            console.log("Submitting FormData:", Object.fromEntries(productData.entries())); // Log FormData contents

            await updateProduct(id, productData);
            navigate(`/product/${id}`, { state: { message: "Product updated successfully!" } }); // Redirect on success
        } catch (err) {
            console.error("Update Product Error:", err);
            let errorMsg = 'Failed to update product.';
             if (err.response && err.response.data) {
                // Try to extract specific field errors from backend response
                const backendErrors = err.response.data;
                 if (typeof backendErrors === 'object') {
                     errorMsg += ' Details: ' + JSON.stringify(backendErrors);
                     // Optionally update fieldErrors state here based on backendErrors
                 } else if (typeof backendErrors === 'string') {
                     errorMsg += ' ' + backendErrors;
                 }
             } else if (err.message) {
                errorMsg += ' ' + err.message;
             }
            setError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };


    // --- Render Logic ---

    if (loading) return <LoadingSpinner message="Loading product data..." />;

    // Display error or unauthorized message if not owner or if initial load failed
    if (!isOwner) {
        return (
            <div className={styles.formContainer}>
                 <ErrorMessage message={error || 'You do not have permission to edit this product.'} />
                 <Link to={`/product/${id}`} className={styles.cancelLink}>Back to Product</Link>
            </div>
        );
    }

    // Render the form if loading is complete and user is owner
    return (
        <div className={styles.formContainer}>
            <h1 className={styles.formTitle}>Edit Product</h1>

            {/* Display general submission error */}
            {error && !submitting && <ErrorMessage message={error} />}

            <form onSubmit={handleSubmit} className={styles.productForm} encType="multipart/form-data">
                {/* Name */}
                <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.inputLabel}>Product Name</label>
                    <input
                        id="name" type="text" name="name"
                        value={formData.name} onChange={handleChange}
                        className={`${styles.textInput} ${fieldErrors.name ? styles.invalid : ''}`}
                        required
                    />
                    {fieldErrors.name && <div className={styles.fieldError}>{fieldErrors.name}</div>}
                </div>

                {/* Description */}
                <div className={styles.formGroup}>
                    <label htmlFor="description" className={styles.inputLabel}>Description</label>
                    <textarea
                        id="description" name="description"
                        value={formData.description} onChange={handleChange}
                        className={`${styles.textArea} ${fieldErrors.description ? styles.invalid : ''}`}
                        rows="4" required
                    />
                    {fieldErrors.description && <div className={styles.fieldError}>{fieldErrors.description}</div>}
                </div>

                {/* Price and Quantity Row */}
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label htmlFor="price" className={styles.inputLabel}>Price ($)</label>
                        <input
                            id="price" type="number" name="price"
                            step="0.01" min="0.01"
                            value={formData.price} onChange={handleChange}
                            className={`${styles.textInput} ${fieldErrors.price ? styles.invalid : ''}`}
                            required
                        />
                        {fieldErrors.price && <div className={styles.fieldError}>{fieldErrors.price}</div>}
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="quantity" className={styles.inputLabel}>Quantity</label>
                        <input
                            id="quantity" type="number" name="quantity"
                            min="0" // Allow 0 for out of stock
                            value={formData.quantity} onChange={handleChange}
                            className={`${styles.textInput} ${fieldErrors.quantity ? styles.invalid : ''}`}
                            required
                        />
                        {fieldErrors.quantity && <div className={styles.fieldError}>{fieldErrors.quantity}</div>}
                    </div>
                </div>

                {/* Category */}
                <div className={styles.formGroup}>
                    <label htmlFor="category" className={styles.inputLabel}>Category</label>
                    <select
                        id="category" name="category"
                        value={formData.category} onChange={handleChange}
                        className={`${styles.selectInput} ${fieldErrors.category ? styles.invalid : ''}`}
                        required
                    >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id.toString()}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                    {fieldErrors.category && <div className={styles.fieldError}>{fieldErrors.category}</div>}
                </div>

                {/* --- Image Section --- */}
                <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>Product Image</label>

                    {/* Display Current Image (if exists and we intend to keep it) */}
                    {currentImageUrl && keepExistingImage && (
                        <div className={styles.imagePreviewContainer}>
                            <p className={styles.previewCaption}>Current Image:</p>
                            <img src={currentImageUrl} alt="Current Product" className={styles.previewImage}
                                 onError={(e) => {e.target.style.display='none'; /* Hide if broken */ }}/>
                            <button type="button" onClick={handleRemoveImage} className={styles.removeImageButton}>
                                Change/Remove Image
                            </button>
                        </div>
                    )}

                    {/* Show Upload/URL fields only if changing/removing image */}
                    {!keepExistingImage && (
                         <div className={styles.imageUploadSection}>
                            {/* Button to revert to keeping existing image (if one exists) */}
                            {currentImageUrl && (
                                <button type="button" onClick={handleKeepExistingImage} className={styles.secondaryButton} style={{marginBottom: '15px'}}>
                                    Keep Current Image
                                </button>
                            )}

                            {/* Upload New File */}
                            <div className={styles.imageUploadOption}>
                                <label htmlFor="image" className={styles.imageInputLabel}>Upload New Image:</label>
                                <input
                                    id="image" type="file" accept="image/*"
                                    onChange={handleImageChange}
                                    className={styles.fileInput} ref={fileInputRef}
                                />
                            </div>

                            <div className={styles.dividerWithText}><span>OR</span></div>

                             {/* Provide New URL */}
                            <div className={styles.imageUploadOption}>
                                <label htmlFor="imageUrl" className={styles.imageInputLabel}>Provide New Image URL:</label>
                                <input
                                    id="imageUrl" type="text" placeholder="https://example.com/image.jpg"
                                    value={imageUrl} onChange={handleImageUrlChange}
                                    className={styles.textInput}
                                />
                            </div>

                             {/* Preview New Image */}
                            {imagePreview && (
                                <div className={styles.imagePreviewContainer}>
                                     <p className={styles.previewCaption}>New Image Preview:</p>
                                    <img src={imagePreview} alt="New Preview" className={styles.previewImage} />
                                    {/* Optionally add a button to cancel the *new* selection here */}
                                    <button type="button" onClick={handleRemoveImage} className={styles.removeImageButton}>
                                        Cancel New Image
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Display image-related field errors */}
                    {fieldErrors.image && <div className={styles.fieldError}>{fieldErrors.image}</div>}

                    <p className={styles.helperText}>Max 2MB. Recommended: 800x600 pixels.</p>
                </div>

                {/* Form Actions */}
                <div className={styles.formActions}>
                    <button type="submit" className={styles.submitButton} disabled={submitting}>
                        {submitting ? 'Updating...' : 'Update Product'}
                    </button>
                    <Link to={`/product/${id}`} className={styles.cancelButton}>Cancel</Link>
                </div>
            </form>
        </div>
    );
};

export default EditProduct;