import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { fetchProducts, fetchCategories } from '../../api';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../ErrorMessage';
import ProductCard from './ProductCard';
import SkeletonProductCard from './SkeletonProductCard'; // Import skeleton
import styles from './ProductStyles.module.css';
import { FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa'; // Icons for sorting

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [sortBy, setSortBy] = useState('name'); // 'name', 'price'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
    const { user } = useAuth();

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch products and categories concurrently
            const [productsData, categoriesData] = await Promise.all([
                fetchProducts(),
                fetchCategories()
            ]);
            setProducts(productsData);
            setCategories(categoriesData);
        } catch (err) {
            setError('Failed to load products or categories.');
            console.error('Error loading data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]); // Load data on mount

    // Memoize filtered and sorted products
    const processedProducts = useMemo(() => {
        let filtered = selectedCategory
            ? products.filter(product => product.category === selectedCategory)
            : products;

        // Sort
        filtered.sort((a, b) => {
            let compareA, compareB;
            if (sortBy === 'price') {
                compareA = parseFloat(a.price);
                compareB = parseFloat(b.price);
            } else { // Default to name
                compareA = a.name.toLowerCase();
                compareB = b.name.toLowerCase();
            }

            if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
            if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [products, selectedCategory, sortBy, sortOrder]);

    const handleSortChange = (newSortBy) => {
        if (newSortBy === sortBy) {
            // Toggle order if clicking the same sort criteria
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new criteria and default to ascending
            setSortBy(newSortBy);
            setSortOrder('asc');
        }
    };

    // Render skeleton loaders
    const renderSkeletons = () => (
        Array.from({ length: 8 }).map((_, index) => ( // Show 8 skeletons
            <SkeletonProductCard key={index} />
        ))
    );

    return (
        <div className={styles.listContainer}>
            <div className={styles.listHeader}>
                <h1>Products</h1>
                {user?.is_farmer && (
                    <Link to="/product/add" className={styles.addProductButton}>
                        + Add Product
                    </Link>
                )}
            </div>

            {/* Filters and Sorting */}
            <div className={styles.controlsContainer}>
                {/* Category Filter */}
                {categories.length > 0 && !loading && (
                    <div className={styles.categoryFilter}>
                        <span className={styles.filterLabel}>Filter by:</span>
                        <button
                            className={`${styles.categoryButton} ${selectedCategory === null ? styles.activeCategory : ''}`}
                            onClick={() => setSelectedCategory(null)}
                        >
                            All
                        </button>
                        {categories.map(category => (
                            <button
                                key={category.id}
                                className={`${styles.categoryButton} ${selectedCategory === category.id ? styles.activeCategory : ''}`}
                                onClick={() => setSelectedCategory(category.id)}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Sorting Controls */}
                 {!loading && products.length > 0 && (
                     <div className={styles.sortControls}>
                        <span className={styles.filterLabel}>Sort by:</span>
                        <button
                            className={`${styles.sortButton} ${sortBy === 'name' ? styles.activeSort : ''}`}
                            onClick={() => handleSortChange('name')}
                        >
                            Name {sortBy === 'name' && (sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                        </button>
                        <button
                            className={`${styles.sortButton} ${sortBy === 'price' ? styles.activeSort : ''}`}
                            onClick={() => handleSortChange('price')}
                        >
                            Price {sortBy === 'price' && (sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
                        </button>
                    </div>
                 )}
            </div>


            {error && <ErrorMessage message={error} />}

            <div className={styles.productsGrid}>
                {loading
                    ? renderSkeletons()
                    : processedProducts.length === 0
                        ? <p className={styles.emptyMessage}>No products found matching your criteria.</p>
                        : processedProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))
                }
            </div>
        </div>
    );
};

export default ProductList;