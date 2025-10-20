"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Mail, Lock, User, Eye, EyeOff, Phone } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function AuthModal({ isOpen, onClose, mode, onSwitchMode }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Unified state to handle all form fields for different roles
  const [formData, setFormData] = useState({
    // Common user fields
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    avatarUrl: "",
    role: "customer",

    // Restaurant specific fields
    businessName: "",
    businessEmail: "",
    businessPhone: "",
    categories: "",
    imageUrl: "",
    
    // Common address fields
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    
    // Delivery Partner specific fields
    licenseNumber: "",
    vehicleType: "MOTORCYCLE",
    vehicleModel: "",
    vehicleRegistrationNumber: "",
    idProofUrl: "",
    zone: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Helper function for making API POST requests
  const apiPost = async (url, body) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Request failed with status ${response.status}`
      );
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    return null;
  };

  // Redirect user to the appropriate dashboard based on their role
  const redirectToDashboard = (userRole) => {
    const role = userRole.toUpperCase();
    console.log("Redirecting to dashboard for role:", role);
    switch (role) {
      case "CUSTOMER":
        navigate("/customer-dashboard");
        break;
      case "RESTAURANT":
        navigate("/restaurant-management");
        break;
      case "DELIVERY_PARTNER":
      case "DELIVERY":
        navigate("/delivery-partner-dashboard");
        break;
      case "ADMIN":
        navigate("/admin-dashboard");
        break;
      default:
        navigate("/"); // Fallback to home page
    }
  };

  // Handle form submission for both sign-in and sign-up
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

    try {
      if (mode === "signin") {
        const userData = await login(formData.email, formData.password);
        onClose();
        redirectToDashboard(userData.role); // Redirect after login
      } else {
        if (formData.password !== formData.confirmPassword) {
          setErrors({ confirmPassword: "Passwords do not match." });
          throw new Error("Passwords do not match.");
        }

        const { role } = formData;
        let endpoint = "";
        let payload = {};

        // Construct payload based on the selected role
        switch (role) {
          case "customer":
            endpoint = `${API_BASE_URL}/api/auth/register/customer`;
            payload = {
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              password: formData.password,
              avatarUrl: formData.avatarUrl,
              address: {
                line1: formData.addressLine1,
                city: formData.city,
                state: formData.state,
                postalCode: formData.postalCode,
                country: formData.country,
              },
            };
            break;

          case "restaurant":
            endpoint = `${API_BASE_URL}/api/auth/register/restaurant`;
            payload = {
              owner: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                avatarUrl: formData.avatarUrl,
              },
              restaurant: {
                name: formData.businessName,
                email: formData.businessEmail,
                phone: formData.businessPhone,
                categories: formData.categories,
                imageUrl: formData.imageUrl,
                address: {
                  line1: formData.addressLine1,
                  city: formData.city,
                  state: formData.state,
                  postalCode: formData.postalCode,
                  country: formData.country,
                },
              },
            };
            break;

          case "delivery":
            endpoint = `${API_BASE_URL}/api/auth/register/delivery-partner`;
            payload = {
              user: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                avatarUrl: formData.avatarUrl,
              },
              profile: {
                licenseNumber: formData.licenseNumber,
                vehicleType: formData.vehicleType.toUpperCase(),
                vehicleModel: formData.vehicleModel,
                vehicleRegistrationNumber: formData.vehicleRegistrationNumber,
                idProofUrl: formData.idProofUrl,
                zone: formData.zone,
              },
            };
            break;

          default:
            throw new Error("Invalid role selected.");
        }

        await apiPost(endpoint, payload);
        alert("Registration successful! Please sign in to continue.");
        onSwitchMode(); // Switch to sign-in mode after successful registration
      }
    } catch (err) {
      setErrors({ general: err.message || "An error occurred. Please try again." });
      console.error("Authentication process error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle changes in form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear specific field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!isOpen) return null;

  // JSX for Restaurant specific fields
  const renderRestaurantFields = () => (
    <>
      <hr className="my-4" />
      <h3 className="text-lg font-semibold mb-2">Restaurant Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
          <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Email</label>
          <input type="email" name="businessEmail" value={formData.businessEmail} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
          <input type="tel" name="businessPhone" value={formData.businessPhone} onChange={handleChange} className="input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
          <input type="text" name="categories" value={formData.categories} onChange={handleChange} className="input-field" placeholder="e.g., Pizza, Indian" required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="input-field" />
        </div>
        {/* Common Address Fields */}
        {renderAddressFields()}
      </div>
    </>
  );

  // JSX for Delivery Partner specific fields
  const renderDeliveryFields = () => (
    <>
      <hr className="my-4" />
      <h3 className="text-lg font-semibold mb-2">Delivery Partner Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
            <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className="input-field" required>
                <option>MOTORCYCLE</option>
                <option>SCOOTER</option>
                <option>CAR</option>
                <option>BICYCLE</option>
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
            <input type="text" name="vehicleModel" value={formData.vehicleModel} onChange={handleChange} className="input-field" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
            <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className="input-field" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Registration No.</label>
            <input type="text" name="vehicleRegistrationNumber" value={formData.vehicleRegistrationNumber} onChange={handleChange} className="input-field" required />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof URL</label>
          <input type="url" name="idProofUrl" value={formData.idProofUrl} onChange={handleChange} className="input-field" placeholder="Link to your ID proof" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Zone</label>
          <input type="text" name="zone" value={formData.zone} onChange={handleChange} className="input-field" required />
        </div>
      </div>
    </>
  );
  
  // Reusable JSX for address fields
  const renderAddressFields = () => (
    <>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
        <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} className="input-field" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
        <input type="text" name="city" value={formData.city} onChange={handleChange} className="input-field" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
        <input type="text" name="state" value={formData.state} onChange={handleChange} className="input-field" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
        <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className="input-field" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <input type="text" name="country" value={formData.country} onChange={handleChange} className="input-field" required />
      </div>
    </>
  );

  // JSX for Customer specific fields (just the address)
  const renderCustomerAddressFields = () => (
    <>
      <hr className="my-4" />
      <h3 className="text-lg font-semibold mb-2">Address Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderAddressFields()}
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">
              {mode === "signin" ? "Sign In" : "Create Account"}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {mode === "signup" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">I am signing up as a</label>
              <select name="role" value={formData.role} onChange={handleChange} className="input-field">
                <option value="customer">Customer</option>
                <option value="restaurant">Restaurant Owner</option>
                <option value="delivery">Delivery Partner</option>
              </select>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="input-field pl-10" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field pl-10" required />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field pl-10" required />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="input-field pl-10 pr-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="input-field pl-10" required />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Conditionally render role-specific fields */}
            {mode === "signup" && formData.role === "restaurant" && renderRestaurantFields()}
            {mode === "signup" && formData.role === "delivery" && renderDeliveryFields()}
            {mode === "signup" && formData.role === "customer" && renderCustomerAddressFields()}

            <button type="submit" disabled={isLoading} className="w-full btn-primary py-3 disabled:opacity-50">
              {isLoading ? "Processing..." : (mode === "signin" ? "Sign In" : "Create Account")}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button onClick={onSwitchMode} className="font-semibold text-primary-600 hover:underline">
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
