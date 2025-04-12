import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-section">
                    <Link to="/" className="footer-logo">AgroEcommerce</Link>
                    <p>Your one-stop shop for fresh, locally sourced agricultural products.</p>
                    <div className="footer-social">
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
                    </div>
                </div>
                
                <div className="footer-section">
                    <h3>Quick Links</h3>
                    <ul className="footer-links">
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/products">Products</Link></li>
                        <li><Link to="/promotions">Promotions</Link></li>
                        <li><Link to="/profile">My Account</Link></li>
                    </ul>
                </div>
                
                <div className="footer-section">
                    <h3>Information</h3>
                    <ul className="footer-links">
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li><Link to="/terms">Terms of Service</Link></li>
                        <li><Link to="/privacy">Privacy Policy</Link></li>
                    </ul>
                </div>
                
                <div className="footer-section">
                    <h3>Contact Us</h3>
                    <p>123 Farm Road<br />Agricultural Valley<br />Farmville, AG 12345</p>
                    <p>Phone: (123) 456-7890</p>
                    <p>Email: info@agroecommerce.com</p>
                </div>
            </div>
            
            <div className="footer-bottom">
                <p>&copy; {currentYear} AgroEcommerce. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;