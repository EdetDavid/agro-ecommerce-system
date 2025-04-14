import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';
import { useAuth } from '../context/AuthContext';
import './Navbar.css'; // Ensure this CSS file is imported
import logoImage from '../assets/logo.jpg'; // Adjust path if needed
// Using FaUserCircle as a fallback icon
import { FaUserCircle, FaBars, FaTimes, FaShoppingCart } from 'react-icons/fa';

const Navbar = () => {
    const { user, isAuthenticated, logout, loading: authLoading } = useAuth(); // user from context is the profile object
    const [loggingOut, setLoggingOut] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null); // Ref for desktop dropdown
    const mobileMenuRef = useRef(null); // Ref for mobile menu panel
    const hamburgerRef = useRef(null); // Ref for hamburger button

    // --- Extract relevant user info safely ---
    const profileData = user; // user from context IS the profile
    const actualUser = profileData?.user; // The nested user object
    const userName = actualUser?.username || 'User';
    const profilePicUrl = profileData?.profile_picture_url; // Get URL from profile
    const isFarmer = actualUser?.is_farmer;

    // --- Effect to handle clicks outside menus ---
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close desktop dropdown if click is outside
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            // Close mobile menu if click is outside the menu AND outside the hamburger button
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) &&
                hamburgerRef.current && !hamburgerRef.current.contains(event.target)) {
                 setMenuOpen(false);
            }
        };
        // Add listener when component mounts
        document.addEventListener('mousedown', handleClickOutside);
        // Clean up listener when component unmounts
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

    // --- Effect to close menus on route change ---
     useEffect(() => {
        setMenuOpen(false);
        setDropdownOpen(false);
     }, [location.pathname]); // Dependency: current route path

    // --- Logout Handler ---
    const handleLogout = async () => {
        if (loggingOut || authLoading) return;
        if (window.confirm('Are you sure you want to logout?')) {
            setLoggingOut(true);
            setDropdownOpen(false); // Close menus on logout attempt
            setMenuOpen(false);
            try {
                await logout(); // Call logout from context
                navigate('/auth'); // Redirect after logout
            } catch (error) {
                 console.error("Logout failed:", error);
                 // Optionally show an error message to the user
            } finally {
                 setLoggingOut(false);
            }
        }
    };

    // --- Menu Toggle Functions ---
    const toggleMenu = () => setMenuOpen(prev => !prev); // Use functional update for toggling
    const toggleDropdown = () => setDropdownOpen(prev => !prev);
    const closeMenu = () => setMenuOpen(false); // Explicit close function
    const closeDropdown = () => setDropdownOpen(false); // Explicit close function

    const activeClassName = "navbar-link active"; // For NavLink active state styling

    return (
        // The 'relative' position on the navbar itself might need adjustment
        // depending on overall layout (e.g., if you want it sticky/fixed)
        <nav className="navbar">
             {/* Overlay - Rendered conditionally based on menuOpen */}
             {/* The "+" sibling selector in CSS handles its visibility */}
             <div className={`navbar-overlay ${menuOpen ? 'overlay-open' : ''}`} onClick={closeMenu}></div>

             {/* Brand/Logo */}
             <div className="navbar-brand">
                <Link to="/" className="navbar-logo" onClick={closeMenu}> {/* Close menu on logo click */}
                    <img src={logoImage} alt="Farm Fresh Logo" className="logo-image" />
                    <span className="logo-text">Farm Fresh </span>
                </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="navbar-desktop">
                 {/* Main Links */}
                 <div className="navbar-links">
                    <NavLink to="/" className={({ isActive }) => isActive ? activeClassName : "navbar-link"}>Home</NavLink>
                    <NavLink to="/products" className={({ isActive }) => isActive ? activeClassName : "navbar-link"}>Products</NavLink>
                    {/* Add other main navigation links here */}
                </div>

                 {/* Auth/User Section */}
                <div className="navbar-auth">
                     {/* Cart Link */}
                     <NavLink to="/cart" className={({isActive}) => isActive ? `${activeClassName} cart-link-desktop` : "navbar-link cart-link-desktop"}>
                        <FaShoppingCart /> Cart
                     </NavLink>

                     {/* User Dropdown or Login Button */}
                    {isAuthenticated && profileData ? (
                        <div className="navbar-user-section" ref={dropdownRef}>
                            <button onClick={toggleDropdown} className="navbar-user-button" aria-haspopup="true" aria-expanded={dropdownOpen}>
                                {profilePicUrl ? (
                                    <img src={profilePicUrl} alt=" " className="navbar-user-avatar" />
                                ) : (
                                    <FaUserCircle className="user-icon" />
                                )}
                                <span className="navbar-greeting">{userName}</span>
                                {/* Optional: Add dropdown indicator icon (e.g., chevron) */}
                            </button>
                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="navbar-dropdown" role="menu">
                                    <NavLink to="/profile" className="dropdown-link" role="menuitem" onClick={closeDropdown}>Profile</NavLink>
                                    <NavLink to="/orders" className="dropdown-link" role="menuitem" onClick={closeDropdown}>My Orders</NavLink>
                                    <NavLink to="/wishlist" className="dropdown-link" role="menuitem" onClick={closeDropdown}>Wishlist</NavLink>
                                    {isFarmer && (
                                        <NavLink to="/product/add" className="dropdown-link" role="menuitem" onClick={closeDropdown}>Add Product</NavLink>
                                    )}
                                    <hr className="dropdown-divider" />
                                    <button onClick={handleLogout} disabled={loggingOut || authLoading} className="dropdown-link logout" role="menuitem">
                                        {loggingOut ? <ClipLoader size={14} color="#333" /> : 'Logout'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Login Button if not authenticated
                         <NavLink to="/auth" className="login-link">Get Started</NavLink>
                    )}
                </div>
            </div>

            {/* --- Mobile Controls (Hamburger & Cart) --- */}
             <div className="navbar-mobile-controls">
                <NavLink to="/cart" className="navbar-link cart-link-mobile" aria-label="Shopping Cart">
                    <FaShoppingCart />
                </NavLink>
                <button
                    className="hamburger-menu"
                    onClick={toggleMenu}
                    ref={hamburgerRef}
                    aria-label="Toggle menu"
                    aria-expanded={menuOpen}
                    aria-controls="mobile-menu-panel" // Link button to the panel
                >
                    {/* Toggle icon based on state */}
                    {menuOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

             {/* --- Mobile Menu Panel --- */}
             {/* Apply 'open' class based on menuOpen state */}
             <div
                id="mobile-menu-panel" // Added ID for aria-controls
                ref={mobileMenuRef}
                className={`navbar-mobile-menu ${menuOpen ? 'open' : ''}`}
             >
                  {/* Header within Mobile Menu */}
                  <div className="mobile-menu-header">
                    <span className="mobile-menu-title">Menu</span>
                    <button className="close-menu-button" onClick={closeMenu} aria-label="Close menu">
                        <FaTimes />
                    </button>
                 </div>

                  {/* Links within Mobile Menu */}
                  <div className="mobile-links">
                    <NavLink to="/" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"} onClick={closeMenu}>Home</NavLink>
                    <NavLink to="/products" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"} onClick={closeMenu}>Products</NavLink>
                    {/* Authenticated User Links */}
                    {isAuthenticated && (
                        <>
                            <NavLink to="/profile" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"} onClick={closeMenu}>Profile</NavLink>
                            <NavLink to="/orders" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"} onClick={closeMenu}>My Orders</NavLink>
                            <NavLink to="/wishlist" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"} onClick={closeMenu}>Wishlist</NavLink>
                            {isFarmer && ( // Show Add Product only for farmers
                                <NavLink to="/product/add" className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"} onClick={closeMenu}>Add Product</NavLink>
                            )}
                        </>
                    )}
                </div>

                 {/* Auth Section within Mobile Menu */}
                 <div className="mobile-auth-section">
                    {isAuthenticated && profileData ? (
                        <>
                            {/* Display user info */}
                            <div className="mobile-user-info">
                                 {profilePicUrl ? (
                                    <img src={profilePicUrl} alt="" className="navbar-user-avatar-mobile" />
                                 ) : (
                                     <FaUserCircle className="user-icon-mobile" />
                                 )}
                                 Signed in as: {userName}
                             </div>
                            {/* Logout Button */}
                            <button onClick={handleLogout} disabled={loggingOut || authLoading} className="mobile-logout-button">
                                {loggingOut ? <ClipLoader size={15} color="#ffffff" /> : 'Logout'}
                            </button>
                        </>
                    ) : (
                        // Login Link if not authenticated
                        <Link to="/auth" className="mobile-login-link" onClick={closeMenu}>
                            Sign In / Sign Up
                        </Link>
                    )}
                </div>
             </div> {/* End mobile menu panel */}
        </nav>
    );
};

export default Navbar;
