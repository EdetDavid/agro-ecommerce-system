import React, { useState, useEffect, useRef } from 'react';
import { createProduct, fetchCategories, createCategory } from '../../api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';
import styles from './ProductStyles.module.css';



const AddProduct = () => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        quantity: '',
        category: ''
    });
    
    // Image states
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const fileInputRef = useRef(null);
    
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});
    const [showNewCategoryField, setShowNewCategoryField] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryCreating, setCategoryCreating] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const getCategories = async () => {
            try {
                const data = await fetchCategories();
                setCategories(data);
            } catch (err) {
                setError('Failed to fetch categories.');
            } finally {
                setInitialLoading(false);
            }
        };
        getCategories();
    }, []);

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = 'Product name is required';
        if (!formData.description.trim()) errors.description = 'Description is required';
        if (!formData.price) errors.price = 'Price is required';
        if (parseFloat(formData.price) <= 0) errors.price = 'Price must be greater than 0';
        if (!formData.quantity) errors.quantity = 'Quantity is required';
        if (parseInt(formData.quantity) <= 0) errors.quantity = 'Quantity must be greater than 0';
        if (!formData.category) errors.category = 'Category is required';
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (limit to 2MB)
            if (file.size > 2 * 1024 * 1024) {
                setFieldErrors(prev => ({
                    ...prev,
                    image: 'Image size should be less than 2MB'
                }));
                return;
            }
            
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
            setImageUrl(''); // Clear URL if file is selected
            
            // Clear image error if it exists
            if (fieldErrors.image) {
                setFieldErrors(prev => ({
                    ...prev,
                    image: null
                }));
            }
        }
    };
    
    const handleImageUrlChange = (e) => {
        setImageUrl(e.target.value);
        
        // Clear file input and preview if URL is entered
        if (e.target.value) {
            setImage(null);
            setImagePreview('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
            // Clear image error if it exists
            if (fieldErrors.image) {
                setFieldErrors(prev => ({
                    ...prev,
                    image: null
                }));
            }
        }
    };
    
    const handleRemoveImage = () => {
        setImage(null);
        setImagePreview('');
        setImageUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        if (value === "new") {
            setShowNewCategoryField(true);
            setFormData(prev => ({
                ...prev,
                category: ''
            }));
        } else {
            setShowNewCategoryField(false);
            setFormData(prev => ({
                ...prev,
                category: value
            }));
        }
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            setFieldErrors(prev => ({
                ...prev,
                newCategory: 'Category name is required'
            }));
            return;
        }

        setCategoryCreating(true);
        try {
            const newCategory = await createCategory({ name: newCategoryName.trim() });
            
            // Add the new category to the categories list
            setCategories(prev => [...prev, newCategory]);
            
            // Ensure the category ID is a string when setting in formData
            const categoryId = newCategory.id?.toString();
            
            // Update the form data with the new category ID
            setFormData(prev => ({
                ...prev,
                category: categoryId
            }));
            
            // Close the new category field
            setShowNewCategoryField(false);
            setNewCategoryName('');
            
            // Clear any category field errors
            if (fieldErrors.category || fieldErrors.newCategory) {
                setFieldErrors(prev => ({
                    ...prev,
                    category: null,
                    newCategory: null
                }));
            }
        } catch (err) {
            setError('Failed to create category: ' + (err.message || ''));
        } finally {
            setCategoryCreating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        if (!user || !user.is_farmer) {
            setError('Only farmers can add products.');
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            // Create FormData for file upload
            const productData = new FormData();
            productData.append('name', formData.name);
            productData.append('description', formData.description);
            productData.append('price', parseFloat(formData.price));
            productData.append('quantity', parseInt(formData.quantity));
            productData.append('category', parseInt(formData.category));
            
            // Add image file or URL
            if (image) {
                productData.append('image', image);
            } else if (imageUrl) {
                productData.append('image_url', imageUrl);
            }
            
            await createProduct(productData);
            navigate('/products');
        } catch (err) {
            setError('Failed to add product. ' + (err.message || ''));
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <LoadingSpinner message="Loading form..." />;
    
    if (!user || !user.is_farmer) {
        return (
            <div className={styles.formContainer}>
                <div className={styles.unauthorizedMessage}>
                    Only farmers can add products.
                </div>
                <Link to="/products" className={styles.cancelLink}>Back to Products</Link>
            </div>
        );
    }

    return (
        <div className={styles.formContainer}>
            <h1 className={styles.formTitle}>Add New Product</h1>
            
            {error && <ErrorMessage message={error} />}
            
            <form onSubmit={handleSubmit} className={styles.productForm} encType="multipart/form-data">
                <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.inputLabel}>Product Name</label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={styles.textInput}
                    />
                    {fieldErrors.name && <div className={styles.fieldError}>{fieldErrors.name}</div>}
                </div>
                
                <div className={styles.formGroup}>
                    <label htmlFor="description" className={styles.inputLabel}>Description</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className={styles.textArea}
                        rows="4"
                    />
                    {fieldErrors.description && <div className={styles.fieldError}>{fieldErrors.description}</div>}
                </div>
                
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label htmlFor="price" className={styles.inputLabel}>Price ($)</label>
                        <input
                            id="price"
                            type="number"
                            name="price"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={handleChange}
                            className={styles.textInput}
                        />
                        {fieldErrors.price && <div className={styles.fieldError}>{fieldErrors.price}</div>}
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="quantity" className={styles.inputLabel}>Quantity</label>
                        <input
                            id="quantity"
                            type="number"
                            name="quantity"
                            min="1"
                            value={formData.quantity}
                            onChange={handleChange}
                            className={styles.textInput}
                        />
                        {fieldErrors.quantity && <div className={styles.fieldError}>{fieldErrors.quantity}</div>}
                    </div>
                </div>
                
                <div className={styles.formGroup}>
                    <label htmlFor="category" className={styles.inputLabel}>Category</label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category || (showNewCategoryField ? "new" : "")}
                        onChange={handleCategoryChange}
                        className={styles.selectInput}
                    >
                        <option value="">Select a category</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id.toString()}>
                                {category.name}
                            </option>
                        ))}
                        <option value="new">+ Add new category</option>
                    </select>
                    {fieldErrors.category && !showNewCategoryField && (
                        <div className={styles.fieldError}>{fieldErrors.category}</div>
                    )}

                    {showNewCategoryField && (
                        <div className={styles.newCategoryBox}>
                            <div className={styles.newCategoryInput}>
                                <input
                                    type="text"
                                    placeholder="Enter new category name"
                                    value={newCategoryName}
                                    onChange={(e) => {
                                        setNewCategoryName(e.target.value);
                                        // Clear error when typing
                                        if (fieldErrors.newCategory) {
                                            setFieldErrors(prev => ({
                                                ...prev,
                                                newCategory: null
                                            }));
                                        }
                                    }}
                                    className={styles.textInput}
                                />
                                <button 
                                    type="button" 
                                    onClick={handleCreateCategory}
                                    disabled={categoryCreating}
                                    className={styles.createButton}
                                >
                                    {categoryCreating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                            {fieldErrors.newCategory && (
                                <div className={styles.fieldError}>{fieldErrors.newCategory}</div>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Image upload section */}
                <div className={styles.formGroup}>
                    <label className={styles.inputLabel}>Product Image</label>
                    
                    <div className={styles.imageUploadSection}>
                        <div className={styles.imageUploadOption}>
                            <label htmlFor="image" className={styles.imageInputLabel}>Upload Image File:</label>
                            <input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className={styles.fileInput}
                                ref={fileInputRef}
                            />
                        </div>
                        
                        <div className={styles.dividerWithText}>
                            <span>OR</span>
                        </div>
                        
                        <div className={styles.imageUploadOption}>
                            <label htmlFor="imageUrl" className={styles.imageInputLabel}>Provide Image URL:</label>
                            <input
                                id="imageUrl"
                                type="text"
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChange={handleImageUrlChange}
                                className={styles.textInput}
                            />
                        </div>
                        
                        {imagePreview && (
                            <div className={styles.imagePreviewContainer}>
                                <img 
                                    src={imagePreview} 
                                    alt="Preview" 
                                    className={styles.previewImage} 
                                />
                                <p className={styles.previewCaption}>Image Preview</p>
                                <button 
                                    type="button" 
                                    onClick={handleRemoveImage}
                                    className={styles.removeImageButton}
                                >
                                    Remove Image
                                </button>
                            </div>
                        )}
                        
                        {fieldErrors.image && (
                            <div className={styles.fieldError}>{fieldErrors.image}</div>
                        )}
                        
                        <p className={styles.helperText}>
                            Recommended image size: Maximum 2MB. Best dimensions: 800x600 pixels.
                        </p>
                    </div>
                </div>
                
                <div className={styles.formActions}>
                    <button type="submit" className={styles.submitButton} disabled={loading}>
                        {loading ? 'Adding...' : 'Add Product'}
                    </button>
                    <Link to="/products" className={styles.cancelButton}>Cancel</Link>
                </div>
            </form>
        </div>
    );
};

export default AddProduct;