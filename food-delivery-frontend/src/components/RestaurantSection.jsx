"use client"

import { useState, useEffect, useCallback } from "react";
import { Star, Clock, Truck, Heart } from "lucide-react";

// This is a new, unauthenticated API helper hook.
const usePublicApi = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  
  const publicApiFetch = useCallback(async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }
    return response.json();
  }, []);

  return publicApiFetch;
};

export default function RestaurantSection() {
  const publicApi = usePublicApi();
  
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [favorites, setFavorites] = useState(new Set()); // This remains client-side for now

  // Fetch restaurants from the backend whenever the filter changes
  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoading(true);
      setError("");
      try {
        let endpoint = '/api/restaurants';
        if (activeFilter !== "All") {
          endpoint += `?category=${activeFilter}`;
        }
        const data = await publicApi(endpoint);
        setRestaurants(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, [activeFilter, publicApi]);

  const toggleFavorite = (id) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }
    setFavorites(newFavorites);
  };

  const filters = ["All", "Pizza", "Burgers", "Chinese", "Biryani", "Indian"]; // Updated filters

  return (
    <section id="restaurants" className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold text-black mb-4">Restaurants near you</h2>
          <p className="text-xl text-gray-600">Discover local favorites and new cuisines</p>
        </div>

        <div className="flex space-x-2 mb-12 overflow-x-auto pb-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? "bg-black text-white shadow-lg"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
        
        {isLoading && <div className="text-center py-10">Loading restaurants...</div>}
        {error && <div className="text-center py-10 text-red-500">Error: {error}</div>}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer group overflow-hidden border">
                <div className="relative overflow-hidden">
                  <img src={restaurant.imageUrl || "/placeholder.svg"} alt={restaurant.name} className="w-full h-48 object-cover group-hover:scale-110 transition-transform" />
                  <button onClick={() => toggleFavorite(restaurant.id)} className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white">
                    <Heart className={`h-4 w-4 ${favorites.has(restaurant.id) ? "text-red-500 fill-current" : "text-gray-600"}`} />
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-black truncate pr-2">{restaurant.name}</h3>
                    <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-lg">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-semibold">{restaurant.rating || "N/A"}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 font-medium">{restaurant.categories}</p>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-1"><Clock className="h-4 w-4 text-primary-500" /><span>{restaurant.estimatedDeliveryTime || 30} min</span></div>
                    <div className="flex items-center space-x-1"><Truck className="h-4 w-4 text-blue-500" /><span>Free Delivery</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!isLoading && restaurants.length === 0 && (
            <div className="text-center py-12">
                <h3 className="text-lg font-semibold">No restaurants found</h3>
                <p className="text-gray-600">Try a different category or check back later!</p>
            </div>
        )}

        {/* View More Button */}
        
      </div>
    </section>
  )
}
