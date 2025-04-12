import React, { useEffect, useState, useRef, useCallback } from 'react';
import { fetchUserProfile, updateUserProfile } from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import LoadingSpinner from './LoadingSpinner'; // Assuming you have this
import ErrorMessage from './ErrorMessage'; // Assuming you have this
import './UserProfile.css'; // Make sure CSS is imported
import { FaUserCircle, FaCamera, FaSave, FaTimes, FaCheckCircle, FaExclamationTriangle, FaTrashAlt } from 'react-icons/fa'; // Icons

// Simple inline spinner for button loading state
const ButtonSpinner = () => (
    <div style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);


const UserProfile = () => {
    const { user: authUser, loadUser } = useAuth(); // Get profile object and reload function from context
    const [profile, setProfile] = useState(null); // Stores the fetched profile data (contains nested user)

    // Separate state for profile fields and role fields
    const [formData, setFormData] = useState({ phone_number: '', address: '' });
    // Initial role state (will be overwritten by fetched data)
    const [roleData, setRoleData] = useState({ is_farmer: false, is_buyer: false });

    // State for picture handling
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);
    const [clearCurrentImage, setClearCurrentImage] = useState(false);
    const fileInputRef = useRef(null);

    // Component status states
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [updateSuccess, setUpdateSuccess] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const navigate = useNavigate();

    // --- Fetch profile data ---
    const getProfileData = useCallback(async () => {
        if (!authUser) { return; } // Wait for authUser
        console.log("Attempting to fetch profile data...");
        try {
            setLoading(true); setError(null);
            const data = await fetchUserProfile();
            console.log("Fetched profile data:", data);
            setProfile(data);
            setFormData({
                phone_number: data.phone_number || '',
                address: data.address || '',
            });
            // Set role state accurately from fetched nested user data
            setRoleData({
                is_farmer: data.user?.is_farmer || false,
                is_buyer: data.user?.is_buyer || false, // Reflect actual state, no defaulting here
            });
            setProfilePicturePreview(data.profile_picture_url || null);
            setProfilePictureFile(null);
            setClearCurrentImage(false);
        } catch (err) {
            console.error("Profile fetch error:", err);
            setError(err.message || 'Failed to fetch profile');
            if (err.response?.status === 401) { navigate('/auth', { state: { from: '/profile' } }); }
        } finally { setLoading(false); }
    }, [authUser, navigate]);

    useEffect(() => {
        getProfileData();
    }, [getProfileData]);

    // --- Input Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // --- SIMPLIFIED Role Checkbox Change Handler ---
    const handleRoleChange = (e) => {
        const { name, checked } = e.target;
        // Simply update the state for the specific checkbox changed
        setRoleData(prev => ({ ...prev, [name]: checked }));
    };

    // --- Image Handlers (Unchanged) ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { setError("Profile picture must be less than 2MB."); return; }
            if (!file.type.startsWith('image/')) { setError("Please select a valid image file."); return; }
            setError(null);
            setProfilePictureFile(file);
            setClearCurrentImage(false);
            const reader = new FileReader();
            reader.onloadend = () => setProfilePicturePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };
    const handleAvatarClick = () => { if (isEditing && fileInputRef.current) fileInputRef.current.click(); };
    const handleRemovePicture = () => {
        setProfilePictureFile(null); setProfilePicturePreview(null); setClearCurrentImage(true);
        if (fileInputRef.current) fileInputRef.current.value = ''; setError(null);
    };

    // --- Submit Handler (Sends current roleData state) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); setUpdateSuccess(false); setSubmitLoading(true);

        let dataToSend;
        const useFormData = !!profilePictureFile || clearCurrentImage;

        if (useFormData) {
            dataToSend = new FormData();
            dataToSend.append('phone_number', formData.phone_number);
            dataToSend.append('address', formData.address);
            // Append roles directly from state
            dataToSend.append('is_farmer', roleData.is_farmer);
            dataToSend.append('is_buyer', roleData.is_buyer);
            if (profilePictureFile) { dataToSend.append('profile_picture', profilePictureFile); }
            else if (clearCurrentImage) { dataToSend.append('profile_picture', ''); }
        } else {
            dataToSend = {
                phone_number: formData.phone_number,
                address: formData.address,
                // Include roles directly from state
                is_farmer: roleData.is_farmer,
                is_buyer: roleData.is_buyer,
            };
        }

        try {
            const updatedProfileData = await updateUserProfile(dataToSend);
            setProfile(updatedProfileData);
            // Update roleData state from response
            setRoleData({
                 is_farmer: updatedProfileData.user?.is_farmer || false,
                 is_buyer: updatedProfileData.user?.is_buyer || false // Reflect backend state
            });
            setProfilePicturePreview(updatedProfileData.profile_picture_url || null);
            setProfilePictureFile(null);
            setClearCurrentImage(false);
            setIsEditing(false);
            setUpdateSuccess(true);
            await loadUser(); // Refresh context

            setTimeout(() => setUpdateSuccess(false), 3000);
        } catch (err) {
            console.error("Profile update submission error:", err);
            let errorMsg = 'Failed to update profile.';
             if (err.response?.data) { /* ... extract details ... */ }
             else if (err.message) { errorMsg += ` ${err.message}`; }
            setError(errorMsg);
        } finally { setSubmitLoading(false); }
    };

    // --- Toggle Edit (Resets roles from profile) ---
    const toggleEdit = () => {
        if (isEditing) { // Reverting changes
            setFormData({ phone_number: profile?.phone_number || '', address: profile?.address || '' });
            // Reset roleData based on fetched profile user data
            setRoleData({
                is_farmer: profile?.user?.is_farmer || false,
                is_buyer: profile?.user?.is_buyer || false
            });
            setProfilePicturePreview(profile?.profile_picture_url || null);
            setProfilePictureFile(null);
            setClearCurrentImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
        setIsEditing(!isEditing);
        setUpdateSuccess(false); setError(null);
    };

    // --- Render Logic ---
    if (loading) return <div className="profile-container"><LoadingSpinner message="Loading profile..." /></div>;
    if (!profile && error) return <div className="profile-container"><ErrorMessage message={error} /></div>;
    if (!profile) return <div className="profile-container profile-empty">Could not load profile data. Please try refreshing.</div>;

    const displayAvatarUrl = profilePicturePreview;

    return (
        <div className="profile-container">
            <h1 className="profile-title">Your Profile</h1>

            {updateSuccess && <div className="profile-success-message"><FaCheckCircle /> Profile updated successfully!</div>}
            {error && !loading && <div className="profile-error"><FaExclamationTriangle /> {error}</div>}

            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-header-content">
                         {/* Avatar Section */}
                        <div className="profile-avatar-section">
                             <div
                                className={`profile-avatar-wrapper ${isEditing ? 'editable' : ''}`}
                                onClick={handleAvatarClick}
                                title={isEditing ? "Click avatar to change picture" : ""}
                             >
                                {displayAvatarUrl ? (
                                    <img src={displayAvatarUrl} alt="Profile" className="profile-avatar-image" />
                                ) : (
                                    <FaUserCircle className="profile-avatar-icon" />
                                )}
                                {isEditing && <FaCamera className="profile-avatar-edit-icon" />}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} disabled={!isEditing} />
                            {isEditing && (
                                <div className="avatar-edit-buttons">
                                    <button type="button" onClick={handleAvatarClick} className="avatar-change-button">
                                        <FaCamera /> {profilePicturePreview ? "Change" : "Upload"} Picture
                                    </button>
                                     {displayAvatarUrl && (
                                        <button type="button" onClick={handleRemovePicture} className="avatar-remove-button">
                                            <FaTrashAlt /> Remove Picture
                                        </button>
                                     )}
                                </div>
                            )}
                        </div>
                        {/* User Info */}
                        <div className="profile-user-info">
                            <h2>{profile.user?.username || 'Username'}</h2>
                            <p className="profile-user-email">{profile.user?.email || 'Email not available'}</p>
                        </div>
                    </div>
                     {/* Edit Button (outside header content) */}
                    {!isEditing && (
                        <button onClick={toggleEdit} className="edit-profile-button">Edit Profile</button>
                    )}
                </div>

                {/* Form or Details View */}
                 <div className="profile-body">
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="profile-form">
                            {/* Phone Number */}
                            <div className="form-group">
                                <label htmlFor="phone_number">Phone Number</label>
                                <input type="tel" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="e.g., +1 123 456 7890" />
                            </div>
                            {/* Address */}
                            <div className="form-group">
                                <label htmlFor="address">Address</label>
                                <textarea id="address" name="address" rows="3" value={formData.address} onChange={handleChange} placeholder="Your street address, city, etc."></textarea>
                            </div>
                            {/* --- Role Checkboxes --- */}
                            <div className="form-group">
                                <label>Your Roles</label>
                                <div className="roles-group">
                                    <label className="role-label">
                                        <input
                                            type="checkbox" name="is_farmer"
                                            checked={roleData.is_farmer} onChange={handleRoleChange}
                                            className="auth-role-checkbox"
                                        />
                                        Register as Farmer
                                    </label>
                                    <label className="role-label">
                                        <input
                                            type="checkbox" name="is_buyer"
                                            checked={roleData.is_buyer} onChange={handleRoleChange}
                                            className="auth-role-checkbox"
                                        />
                                        Register as Buyer
                                    </label>
                                </div>
                                <p className="helperText">(Select the role(s) that apply to you)</p> {/* Updated Helper Text */}
                            </div>
                            {/* Form Action Buttons */}
                            <div className="form-buttons">
                                <button type="submit" className="save-profile-button" disabled={submitLoading}>
                                    {submitLoading ? <ButtonSpinner /> : <FaSave />} Save Changes
                                </button>
                                <button type="button" className="cancel-button" onClick={toggleEdit} disabled={submitLoading}>
                                    <FaTimes /> Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        // Display Details
                        <div className="profile-details">
                            <p><span className="detail-icon">📞</span><strong>Phone:</strong> {profile.phone_number || 'Not provided'}</p>
                            <p><span className="detail-icon">📍</span><strong>Address:</strong> {profile.address || 'Not provided'}</p>
                            <p>
                                <span className="detail-icon">👤</span><strong>Roles:</strong>
                                {!profile.user?.is_farmer && !profile.user?.is_buyer && 'Not specified'} {/* Handle case where neither might be true if backend allows */}
                                {profile.user?.is_farmer && <span className="role-badge farmer">Farmer</span>}
                                {profile.user?.is_buyer && <span className="role-badge buyer">Buyer</span>}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;

