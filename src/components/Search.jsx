import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts } from '../api';
import ProductCard from './products/ProductCard';
import styles from './products/ProductStyles.module.css';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';


const Search = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const initialQuery = searchParams.get('q') || '';
        setSearchQuery(initialQuery); // Load the query from URL on mount

        const fetchAndFilterProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const allProducts = await fetchProducts();
                const filteredProducts = allProducts.filter(product => 
                    product.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setProducts(filteredProducts);
            } catch (err) {
                setError('Failed to fetch products.');
            } finally {
                setLoading(false);
            }
        };
        fetchAndFilterProducts();
    }, [searchQuery, setSearchParams]);
    
    const handleSearch = (e) => {
        e.preventDefault();
        setSearchParams({ q: searchQuery }); // Update URL with search query
    };

    const handleInputChange = (e) => {
        setSearchQuery(e.target.value);
    };
    

    if (loading) return <LoadingSpinner message="Searching..." />;
    if (error) return <ErrorMessage message={error} />;

    return (
        <div className={styles.listContainer}>
            <div className={styles.searchHeader}>
                <h1>Search Results</h1>
                <form className={styles.searchForm} onSubmit={handleSearch}>
                    <input 
                        type="text" 
                        placeholder="Search for products..." 
                        value={searchQuery} 
                        onChange={handleInputChange}
                        className={styles.searchInput}
                    />
                    <button type="submit" className={styles.searchButton}>Search</button>
                </form>
            </div>

            {products.length === 0 ? (
                <p className={styles.emptyMessage}>No products found for "{searchQuery}"</p>
            ) : (
                <div className={styles.productsGrid}>
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Search;