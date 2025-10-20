"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Truck,
  MapPin,
  DollarSign,
  Package,
  LogOut,
  ToggleLeft,
  ToggleRight,
  User,
  Loader2,
} from "lucide-react";

// --- Reusable API Hook for Authenticated Calls ---
const useApi = () => {
  const { authToken, logout } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  const apiFetch = useCallback(async (endpoint, options = {}) => {
      if (!authToken) {
          logout();
          throw new Error("Authentication token not found.");
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        throw new Error(errorData.message);
      }
      
      if (response.status === 204) return null; // Handle No Content responses
      return response.json();
    }, [authToken, logout]);

  return apiFetch;
};

export default function DeliveryDashboard() {
  const { user, logout } = useAuth();
  const api = useApi();

  const [activeTab, setActiveTab] = useState("available");
  const [profile, setProfile] = useState(null);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [earningsData, setEarningsData] = useState(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetches all necessary data for the dashboard in parallel
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [profileData, availableData, activeData, newEarningsData] = await Promise.all([
        api("/api/delivery-partner/profile"),
        api("/api/delivery-partner/deliveries/available"),
        api("/api/delivery-partner/deliveries/active"),
        api("/api/delivery-partner/earnings"),
      ]);

      setProfile(profileData);
      setIsAvailable(profileData.available);
      setAvailableDeliveries(availableData);
      setActiveDeliveries(activeData);
      setEarningsData(newEarningsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleAvailability = async () => {
    const newAvailability = !isAvailable;
    try {
      setIsAvailable(newAvailability); // Optimistic UI update
      await api("/api/delivery-partner/availability", {
        method: "PUT",
        body: JSON.stringify({ isAvailable: newAvailability }),
      });
      // Optionally refetch available orders after going online
      if (newAvailability) {
        const availableData = await api("/api/delivery-partner/deliveries/available");
        setAvailableDeliveries(availableData);
      }
    } catch (err) {
      setIsAvailable(!newAvailability); // Revert on error
      alert(`Error updating availability: ${err.message}`);
    }
  };

  const acceptDelivery = async (deliveryId) => {
    try {
      const updatedDelivery = await api(`/api/delivery-partner/deliveries/${deliveryId}/accept`, { method: "PUT" });
      setAvailableDeliveries((prev) => prev.filter((d) => d.id !== deliveryId));
      setActiveDeliveries((prev) => [...prev, updatedDelivery]);
      setActiveTab("active");
    } catch (err) {
      alert(`Error accepting delivery: ${err.message}`);
    }
  };

  const updateDeliveryStatus = async (deliveryId, action) => {
    try {
        const endpoint = `/api/delivery-partner/deliveries/${deliveryId}/${action}`;
        const updatedDelivery = await api(endpoint, { method: "PUT" });

        if (action === 'deliver') {
            setActiveDeliveries((prev) => prev.filter((d) => d.id !== deliveryId));
            // Refetch earnings data after a delivery is completed
            const newEarningsData = await api("/api/delivery-partner/earnings");
            setEarningsData(newEarningsData);
        } else {
            setActiveDeliveries((prev) =>
                prev.map((d) => (d.id === deliveryId ? updatedDelivery : d))
            );
        }
    } catch (err) {
        alert(`Error updating delivery status: ${err.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "ASSIGNED": return "bg-yellow-100 text-yellow-800";
      case "ACCEPTED": return "bg-blue-100 text-blue-800";
      case "PICKED_UP": return "bg-purple-100 text-purple-800";
      case "DELIVERED": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-600 p-4 text-center">
        <h2 className="text-xl font-semibold">An Error Occurred</h2>
        <p className="mt-2">{error}</p>
        <button onClick={logout} className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg">Log In Again</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Truck className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-xl font-bold">Delivery Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {profile?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Available</span>
              <button onClick={handleToggleAvailability} className={`p-1 rounded-full ${isAvailable ? "text-green-500" : "text-gray-400"}`}>
                {isAvailable ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <img src={profile?.avatarUrl || `https://ui-avatars.com/api/?name=${profile?.name}`} alt={profile?.name} className="h-8 w-8 rounded-full"/>
              <div className="hidden md:block text-right"><p className="text-sm font-medium">{profile?.name}</p><p className="text-xs text-gray-500">Delivery Partner</p></div>
              <button onClick={logout} className="p-2 text-gray-600 hover:text-red-600"><LogOut className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards - Now fully functional */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow border p-4"><p className="text-sm text-gray-600">Today's Deliveries</p><p className="text-2xl font-bold">{earningsData?.todaysDeliveries || 0}</p></div>
            <div className="bg-white rounded-xl shadow border p-4"><p className="text-sm text-gray-600">Earnings</p><p className="text-2xl font-bold">₹{(earningsData?.todaysEarnings || 0).toFixed(2)}</p></div>
            <div className="bg-white rounded-xl shadow border p-4"><p className="text-sm text-gray-600">Rating</p><p className="text-2xl font-bold">{earningsData?.averageRating || 'N/A'}</p></div>
            <div className="bg-white rounded-xl shadow border p-4"><p className="text-sm text-gray-600">Distance</p><p className="text-2xl font-bold">{(earningsData?.totalDistanceKm || 0).toFixed(1)} km</p></div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow border p-4">
              <ul className="space-y-2">
                {[
                  { id: "available", name: "Available Orders", icon: Package },
                  { id: "active", name: "Active Deliveries", icon: Truck },
                  { id: "earnings", name: "Earnings", icon: DollarSign },
                  { id: "profile", name: "Profile", icon: User },
                ].map((item) => <li key={item.id}><button onClick={() => setActiveTab(item.id)} className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${activeTab === item.id ? "bg-orange-50 text-orange-700" : "text-gray-700 hover:bg-gray-50"}`}><item.icon className="h-5 w-5" /><span className="font-medium">{item.name}</span></button></li>)}
              </ul>
            </nav>
          </aside>

          <div className="flex-1">
            {activeTab === "available" && (
                <div className="bg-white rounded-xl shadow border p-4">
                    <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">Available Orders</h2><div className={`px-3 py-1 rounded-full text-sm font-medium ${isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{isAvailable ? "Online" : "Offline"}</div></div>
                    {!isAvailable ? (
                        <div className="text-center py-12"><Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-semibold">You're currently offline</h3><p className="text-gray-600 mb-4">Turn on availability to see new delivery requests.</p><button onClick={handleToggleAvailability} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg">Go Online</button></div>
                    ) : (
                        <div className="space-y-4">
                            {availableDeliveries.length > 0 ? availableDeliveries.map((delivery) => (
                                <div key={delivery.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div><h3 className="font-semibold">Order #{delivery.order?.id}</h3><p className="text-gray-600">{delivery.order?.restaurant?.name}</p><p className="text-sm text-gray-500">{delivery.estimatedMinutes} min • {delivery.distanceKm} km</p></div>
                                        <div className="text-right"><p className="font-bold">₹{(delivery.payoutAmount || 0).toFixed(2)}</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>{delivery.status?.replace("_", " ")}</span></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                                        <div><p className="font-medium flex items-center"><MapPin className="h-4 w-4 mr-1 text-red-500"/>Pickup</p><p className="text-gray-600 pl-5">{delivery.pickupAddress?.line1}, {delivery.pickupAddress?.city}</p></div>
                                        <div><p className="font-medium flex items-center"><MapPin className="h-4 w-4 mr-1 text-green-500"/>Delivery</p><p className="text-gray-600 pl-5">{delivery.deliveryAddress?.line1}, {delivery.deliveryAddress?.city}</p></div>
                                    </div>
                                    <button onClick={() => acceptDelivery(delivery.id)} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg">Accept Delivery</button>
                                </div>
                            )) : <div className="text-center py-12"><Package className="h-16 w-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-semibold">No orders available</h3><p className="text-gray-600">New delivery requests will appear here.</p></div>}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "active" && (
                <div className="bg-white rounded-xl shadow border p-4">
                    <h2 className="text-2xl font-bold mb-4">Active Deliveries</h2>
                    {activeDeliveries.length > 0 ? activeDeliveries.map((delivery) => (
                        <div key={delivery.id} className="border rounded-lg p-4 mb-4">
                            <div className="flex justify-between items-start mb-3">
                                <div><h3 className="font-semibold">Order #{delivery.order?.id}</h3><p className="text-gray-600">{delivery.order?.restaurant?.name}</p><p className="text-sm text-gray-500">{delivery.estimatedMinutes} min • {delivery.distanceKm} km</p></div>
                                <div className="text-right"><p className="font-bold">₹{(delivery.payoutAmount || 0).toFixed(2)}</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>{delivery.status?.replace("_", " ")}</span></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                                <div><p className="font-medium flex items-center"><MapPin className="h-4 w-4 mr-1 text-red-500"/>Pickup</p><p className="text-gray-600 pl-5">{delivery.pickupAddress?.line1}</p></div>
                                <div><p className="font-medium flex items-center"><MapPin className="h-4 w-4 mr-1 text-green-500"/>Delivery</p><p className="text-gray-600 pl-5">{delivery.deliveryAddress?.line1}</p></div>
                            </div>
                            <div className="flex space-x-3">
                                {delivery.status?.toUpperCase() === "ACCEPTED" && <button onClick={() => updateDeliveryStatus(delivery.id, 'pickup')} className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg">Mark as Picked Up</button>}
                                {delivery.status?.toUpperCase() === "PICKED_UP" && <button onClick={() => updateDeliveryStatus(delivery.id, 'deliver')} className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg">Mark as Delivered</button>}
                            </div>
                        </div>
                    )) : <div className="text-center py-12"><Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-semibold">No active deliveries</h3><p className="text-gray-600">Accepted deliveries will appear here.</p></div>}
                </div>
            )}
            
            {activeTab === "earnings" && (
              <div className="bg-white rounded-xl shadow border p-4">
                <h2 className="text-2xl font-bold mb-4">Today's Completed Deliveries</h2>
                <div className="space-y-4">
                  {earningsData?.completedDeliveries?.length > 0 ? earningsData.completedDeliveries.map((delivery) => (
                    <div key={delivery.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">Order #{delivery.order?.id} from {delivery.order?.restaurant?.name}</p>
                          <p className="text-sm text-gray-500">
                            Delivered on: {new Date(delivery.deliveredAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">+ ₹{(delivery.payoutAmount || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-600 text-center py-8">No deliveries completed yet today.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="bg-white rounded-xl shadow border p-4">
                <h2 className="text-2xl font-bold mb-4">Profile</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4"><img src={profile?.avatarUrl || `https://ui-avatars.com/api/?name=${profile?.name}`} alt={profile?.name} className="h-20 w-20 rounded-full" /><div><h3 className="text-xl font-semibold">{profile?.name}</h3><p className="text-gray-600">{profile?.email}</p><p className="text-sm text-gray-500">Delivery Partner since Jan 1, 2024</p></div></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div><label className="block text-sm font-medium">Full Name</label><input type="text" value={profile?.name || ''} className="input-field mt-1 bg-gray-100" readOnly /></div>
                    <div><label className="block text-sm font-medium">Email</label><input type="email" value={profile?.email || ''} className="input-field mt-1 bg-gray-100" readOnly /></div>
                    <div><label className="block text-sm font-medium">Vehicle Type</label><input type="text" value={profile?.deliveryPartnerProfile?.vehicleType || 'N/A'} className="input-field mt-1 bg-gray-100" readOnly /></div>
                    <div><label className="block text-sm font-medium">Status</label><input type="text" value={isAvailable ? "Available" : "Offline"} className="input-field mt-1 bg-gray-100" readOnly /></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}