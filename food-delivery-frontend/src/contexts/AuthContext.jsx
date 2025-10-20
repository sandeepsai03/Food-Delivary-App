"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Create the context
const AuthContext = createContext(null);

// Create the Provider component
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // Initialize state by reading from localStorage
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('quickeats_user_session');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user session from localStorage", error);
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // This effect runs only once on app load to remove the initial loading state
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // This effect runs whenever the 'user' object changes to keep localStorage in sync
  useEffect(() => {
    if (user) {
      localStorage.setItem('quickeats_user_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('quickeats_user_session');
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Login failed. Please check your credentials.');
      }

      const data = await response.json();

      if (data && data.token) {
        // 1. Set the user state. This will trigger the useEffect to save to localStorage.
        setUser(data);

        // 2. AFTER setting state, navigate to the correct dashboard.
        if (data.role === 'CUSTOMER') {
          navigate('/'); // Or your customer dashboard route
        } else if (data.role === 'RESTAURANT') {
          navigate('/dashboard'); // Your restaurant dashboard route
        } else {
          navigate('/'); // A sensible default
        }
      } else {
        throw new Error('Login response did not include an authentication token.');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Re-throw the error so the AuthModal can display it
    }
  };

  const logout = () => {
    setUser(null); // This triggers the useEffect to clear localStorage
    navigate('/login'); // Redirect to the login page
  };
  
  const value = {
    user,
    isLoading,
    login,
    logout,
    // Provide the token directly for convenience in API helpers
    authToken: user?.token,
    isAuthenticated: !!user?.token,
  };

  // Render children only when not in the initial loading state
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily consume the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};