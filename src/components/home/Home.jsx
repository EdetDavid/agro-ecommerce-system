import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import { FaTruck, FaLeaf, FaSeedling, FaUsers } from "react-icons/fa";

import Vegetables from "../../assets/vegetables.jpg";
import Fruits from "../../assets/fruits.jpg";
import Dairy from "../../assets/dairy.jpg";
import Grains from "../../assets/grains.jpeg";

const Home = () => {
  // Sample data - in a real app, this would come from your backend
  const categories = [
    { id: 1, name: "Vegetables", count: 24, image: Vegetables },
    { id: 2, name: "Fruits", count: 18, image: Fruits },
    { id: 3, name: "Dairy", count: 12, image: Dairy },
    { id: 4, name: "Grains", count: 15, image: Grains },
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Farm Fresh Products Delivered to Your Doorstep</h1>
          <p>
            Support local farmers and enjoy fresh, organic agricultural
            products. Discover a healthier way to eat while promoting
            sustainable farming.
          </p>
          <Link to="/products" className="hero-btn">
            Explore Products
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="featured-categories">
        <h2 className="section-title">Browse Categories</h2>
        <div className="categories-grid">
          {categories.map((category) => (
            <Link
              to={`/products?category=${category.id}`}
              key={category.id}
              className="category-card"
            >
              <img
                src={category.image}
                alt={category.name}
                className="category-img"
              />
              <div className="category-overlay">
                <div className="category-name">{category.name}</div>
                <div className="category-count">{category.count} products</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-container">
          <h2 className="section-title">Why Choose Us</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <FaLeaf className="benefit-icon" />
              <h3 className="benefit-title">100% Organic</h3>
              <p className="benefit-desc">
                All our products are certified organic, grown without harmful
                pesticides or chemicals.
              </p>
            </div>

            <div className="benefit-card">
              <FaTruck className="benefit-icon" />
              <h3 className="benefit-title">Fast Delivery</h3>
              <p className="benefit-desc">
                We deliver fresh products right to your doorstep within 24 hours
                of harvesting.
              </p>
            </div>

            <div className="benefit-card">
              <FaUsers className="benefit-icon" />
              <h3 className="benefit-title">Support Farmers</h3>
              <p className="benefit-desc">
                We ensure fair compensation for farmers and promote sustainable
                agricultural practices.
              </p>
            </div>

            <div className="benefit-card">
              <FaSeedling className="benefit-icon" />
              <h3 className="benefit-title">Seasonal Products</h3>
              <p className="benefit-desc">
                Discover seasonal specialties and enjoy nature's bounty at its
                freshest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-title">Start Your Organic Journey Today</h2>
          <p className="cta-desc">
            Join thousands of customers who have switched to healthier,
            farm-fresh products.
          </p>
          <Link to="/auth" className="cta-btn">
            Sign Up Now
          </Link>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-container">
          <h2 className="newsletter-title">Stay Updated</h2>
          <p className="newsletter-desc">
            Subscribe to our newsletter for seasonal updates, special offers,
            and farming tips.
          </p>
          <form className="newsletter-form">
            <input
              type="email"
              className="newsletter-input"
              placeholder="Enter your email address"
              required
            />
            <button type="submit" className="newsletter-btn">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;
