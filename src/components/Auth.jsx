import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ensure correct path
import './Auth.css';
import Logo from '../assets/logo.jpg'; // Ensure logo exists at this path
import { FaEye, FaEyeSlash, FaGoogle, FaFacebook } from 'react-icons/fa';
import ErrorMessage from './ErrorMessage'; // Use the consistent error component

const Auth = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [credentials, setCredentials] = useState({
        username: '',
        email: '',
        password: '',
        is_farmer: false, // Only farmer checkbox state is needed
        first_name: '',
        last_name: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register, error: authError, loading: authLoading } = useAuth();

    const from = location.state?.from?.pathname || "/";

    // Reset form when switching modes
    useEffect(() => {
        // Reset state, keeping is_farmer as the only role state
        setCredentials({
            username: '', email: '', password: '', is_farmer: false, first_name: '', last_name: ''
        });
        setFormErrors({});
    }, [isLoginMode]);

    // Client-side validation logic
    const validateForm = () => {
        const errors = {};
        // --- Common Validations ---
        if (!credentials.username.trim()) errors.username = "Username is required";
        else if (credentials.username.length < 3) errors.username = "Username must be at least 3 characters";
        if (!credentials.password) errors.password = "Password is required";

        // --- Registration Specific Validations ---
        if (!isLoginMode) {
            if (!credentials.email.trim()) errors.email = "Email is required";
            else if (!/\S+@\S+\.\S+/.test(credentials.email)) errors.email = "Please enter a valid email address";
            if (credentials.password.length < 6) errors.password = "Password must be at least 6 characters";
            if (!credentials.first_name.trim()) errors.first_name = "First name is required";
            if (!credentials.last_name.trim()) errors.last_name = "Last name is required";
            // No need to validate role selection anymore
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm() || authLoading) return;

        try {
            if (isLoginMode) {
                await login({
                    username: credentials.username,
                    password: credentials.password
                });
                if (document.getElementById('remember-me')?.checked) {
                    localStorage.setItem('rememberedUser', credentials.username);
                } else {
                    localStorage.removeItem('rememberedUser');
                }
                navigate(from, { replace: true });
            } else {
                // *** Determine roles based on is_farmer checkbox ***
                const isFarmerSelected = credentials.is_farmer;
                const payload = {
                    username: credentials.username,
                    email: credentials.email,
                    password: credentials.password,
                    first_name: credentials.first_name,
                    last_name: credentials.last_name,
                    is_farmer: isFarmerSelected,
                    is_buyer: !isFarmerSelected // Set is_buyer based on is_farmer
                    // If farmers can ALSO be buyers, change the above line to:
                    // is_buyer: true // Always true, or depends on another logic
                };

                await register(payload); // Send the constructed payload

                alert('Registration successful! Please log in.');
                setIsLoginMode(true);
            }
        } catch (err) {
            console.error("Authentication failed:", err);
            const firstErrorField = Object.keys(formErrors).find(key => formErrors[key]);
            if (firstErrorField) {
                document.getElementById(firstErrorField)?.focus();
            }
        }
    };

    // Load remembered username effect
     useEffect(() => {
        if (isLoginMode) {
            const rememberedUser = localStorage.getItem('rememberedUser');
            if (rememberedUser) {
                setCredentials(prev => ({ ...prev, username: rememberedUser }));
            }
        }
    }, [isLoginMode]);

    return (
        <div className="auth-container">
            <div className={`auth-form ${!isLoginMode ? 'register-mode' : ''}`}>
                <Link to="/" className="auth-logo-link">
                    <img src={Logo} alt="Agro E-commerce Logo" className="auth-logo" />
                </Link>
                <h1 className="auth-title">{isLoginMode ? 'Welcome Back!' : 'Create Account'}</h1>

                {authError && !authLoading && <ErrorMessage message={authError} />}

                <form onSubmit={handleSubmit} noValidate>

                    {/* Username Input */}
                    <div className="auth-input-group">
                        <label htmlFor="username" className="auth-input-label">Username</label>
                        <input
                            id="username" type="text" name="username"
                            placeholder="Choose a username"
                            value={credentials.username} onChange={handleChange}
                            className={`auth-input ${formErrors.username ? 'invalid' : ''}`}
                            required aria-invalid={!!formErrors.username}
                            aria-describedby={formErrors.username ? "username-error" : undefined}
                        />
                        {formErrors.username && <p id="username-error" className="auth-input-error">{formErrors.username}</p>}
                    </div>

                    {/* Registration Only Fields */}
                    {!isLoginMode && (
                        <>
                            {/* Email Input */}
                            <div className="auth-input-group">
                                <label htmlFor="email" className="auth-input-label">Email Address</label>
                                <input
                                    id="email" type="email" name="email"
                                    placeholder="you@example.com"
                                    value={credentials.email} onChange={handleChange}
                                    className={`auth-input ${formErrors.email ? 'invalid' : ''}`}
                                    required aria-invalid={!!formErrors.email}
                                    aria-describedby={formErrors.email ? "email-error" : undefined}
                                />
                                {formErrors.email && <p id="email-error" className="auth-input-error">{formErrors.email}</p>}
                            </div>
                             {/* First Name Input */}
                             <div className="auth-input-group">
                                <label htmlFor="first_name" className="auth-input-label">First Name</label>
                                <input
                                    id="first_name" type="text" name="first_name"
                                    placeholder="Your first name"
                                    value={credentials.first_name} onChange={handleChange}
                                    className={`auth-input ${formErrors.first_name ? 'invalid' : ''}`}
                                    required aria-invalid={!!formErrors.first_name}
                                    aria-describedby={formErrors.first_name ? "first_name-error" : undefined}
                                />
                                {formErrors.first_name && <p id="first_name-error" className="auth-input-error">{formErrors.first_name}</p>}
                            </div>
                             {/* Last Name Input */}
                            <div className="auth-input-group">
                                <label htmlFor="last_name" className="auth-input-label">Last Name</label>
                                <input
                                    id="last_name" type="text" name="last_name"
                                    placeholder="Your last name"
                                    value={credentials.last_name} onChange={handleChange}
                                    className={`auth-input ${formErrors.last_name ? 'invalid' : ''}`}
                                    required aria-invalid={!!formErrors.last_name}
                                    aria-describedby={formErrors.last_name ? "last_name-error" : undefined}
                                />
                                {formErrors.last_name && <p id="last_name-error" className="auth-input-error">{formErrors.last_name}</p>}
                            </div>
                        </>
                    )}

                    {/* Password Input */}
                    <div className="auth-input-group">
                        <label htmlFor="password" className="auth-input-label">Password</label>
                        <div className="password-input-wrapper">
                            <input
                                id="password" type={showPassword ? "text" : "password"} name="password"
                                placeholder={isLoginMode ? "Enter password" : "Create a password (min. 6 chars)"}
                                value={credentials.password} onChange={handleChange}
                                className={`auth-input ${formErrors.password ? 'invalid' : ''}`}
                                required aria-invalid={!!formErrors.password}
                                aria-describedby={formErrors.password ? "password-error" : undefined}
                            />
                            <button
                                type="button" className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        {formErrors.password && <p id="password-error" className="auth-input-error">{formErrors.password}</p>}
                    </div>

                    {/* Farmer Role Checkbox Only (Register only) */}
                    {!isLoginMode && (
                        <div className="auth-input-group farmer-role-group">
                             <label className="auth-role-label" htmlFor="is_farmer">
                                <input
                                    type="checkbox" id="is_farmer" name="is_farmer"
                                    checked={credentials.is_farmer} onChange={handleChange}
                                    className="auth-role-checkbox"
                                />
                                <span>Sign up as a Farmer?</span>
                                <span className="role-tooltip">Check this box if you intend to sell products. Otherwise, you'll be registered as a buyer.</span>
                            </label>
                            {/* Removed is_buyer checkbox and roles error display */}
                        </div>
                    )}

                     {/* Remember Me (Login only) */}
                    {isLoginMode && (
                        <div className="remember-me">
                            <input
                                id="remember-me" type="checkbox"
                                defaultChecked={!!localStorage.getItem('rememberedUser')}
                            />
                            <label htmlFor="remember-me">Remember me</label>
                        </div>
                    )}


                    {/* Submit Button */}
                    <button type="submit" className="auth-button" disabled={authLoading}>
                        {authLoading && <span className="loading-spinner" aria-hidden="true"></span>}
                        {authLoading ? (isLoginMode ? 'Signing In...' : 'Creating Account...') : (isLoginMode ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div className="auth-divider"><span>OR</span></div>

                <div className="social-login">
                     <button type="button" className="social-login-button google" aria-label="Login with Google" disabled>
                         <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google" />
                        <span>Continue with Google</span>
                    </button>
                    <button type="button" className="social-login-button facebook" aria-label="Login with Facebook" disabled>
                        <FaFacebook /> <span>Continue with Facebook</span>
                    </button>
                    <p className="social-login-note">(Social login coming soon!)</p>
                </div>

                <div className="auth-toggle-section">
                    <button
                        type="button" onClick={() => setIsLoginMode(!isLoginMode)}
                        className="auth-toggle-button" disabled={authLoading}
                    >
                        {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;