"use client"

import { useState, useEffect } from "react"
import { MapPin, Users, Clock, Star } from "lucide-react"
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps"


// I've added latitude and longitude to your cities data for map marker placement.
// Replace these with the exact coordinates for your locations.
const cities = [
  {
    id: 1,
    name: "Hyderabad",
    restaurants: 2500,
    avgDelivery: "25 min",
    rating: 4.8,
    popular: true,
    position: { lat: 17.385044, lng: 78.486671 },
  },
  {
    id: 2,
    name: "Bengaluru",
    restaurants: 1800,
    avgDelivery: "30 min",
    rating: 4.6,
    popular: true,
    position: { lat: 12.971599, lng: 77.594566 },
  },
  {
    id: 3,
    name: "Pune",
    restaurants: 1200,
    avgDelivery: "28 min",
    rating: 4.7,
    popular: false,
    position: { lat: 18.52043, lng: 73.856743 },
  },
  {
    id: 4,
    name: "Mumbai",
    restaurants: 900,
    avgDelivery: "22 min",
    rating: 4.5,
    popular: false,
    position: { lat: 19.07609, lng: 72.877426 },
  },
  {
    id: 5,
    name: "Chennai",
    restaurants: 800,
    avgDelivery: "26 min",
    rating: 4.6,
    popular: false,
    position: { lat: 13.08268, lng: 80.270721 },
  },
  {
    id: 6,
    name: "Indore",
    restaurants: 650,
    avgDelivery: "24 min",
    rating: 4.7,
    popular: true,
    position: { lat: 22.719568, lng: 75.857727 },
  },
]

export default function CitiesSection() {
  const [isVisible, setIsVisible] = useState(false)
  // Initialize selectedCity with the first city in the array
  const [selectedCity, setSelectedCity] = useState(cities[0])
  const [mapCenter, setMapCenter] = useState(cities[0].position)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById("cities")
    if (element) observer.observe(element)

    return () => {
      if (element) observer.unobserve(element)
    }
  }, [])
  
  // Update map center when a new city is selected
  useEffect(() => {
    if (selectedCity) {
      setMapCenter(selectedCity.position);
    }
  }, [selectedCity]);


  // It's best practice to store your API key in an environment variable
  const API_KEY = "AIzaSyDXl-dcbjgme56sS_5EPk53DP27x0oraXU";

  if (!API_KEY) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-red-600">Google Maps API Key is missing.</h2>
        <p className="text-lg text-gray-600">Please add your API key to your environment variables.</p>
      </div>
    );
  }

  return (
    <section id="cities" className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div
          className={`text-center mb-16 transform transition-all duration-1000 ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-10 opacity-0"
          }`}
        >
          <h2 className="text-4xl font-bold text-black mb-6">
            Available in{" "}
            <span className="bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
              cities near you
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're expanding rapidly across the country. Find QuickEats in your
            city and discover amazing local restaurants.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Map Container */}
          <div
            className={`relative transform transition-all duration-1000 delay-300 ${
              isVisible
                ? "translate-x-0 opacity-100"
                : "-translate-x-10 opacity-0"
            }`}
          >
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 shadow-2xl border border-gray-200">
              <div className="relative w-full h-96 rounded-2xl overflow-hidden bg-gray-200">
                <APIProvider apiKey={API_KEY}>
                  <Map
                    center={mapCenter}
                    zoom={10}
                    mapId="YOUR_MAP_ID" // Optional: for Cloud-based map styling
                    className="w-full h-full"
                  >
                    {cities.map((city) => (
                      <AdvancedMarker
                        key={city.id}
                        position={city.position}
                        onClick={() => setSelectedCity(city)}
                      >
                        <MapPin
                          className={`w-8 h-8 transition-transform duration-300 ease-in-out ${
                            selectedCity?.id === city.id
                              ? "text-primary-600 scale-125"
                              : "text-gray-600"
                          }`}
                        />
                      </AdvancedMarker>
                    ))}
                  </Map>
                </APIProvider>
              </div>
            </div>
          </div>

          {/* City Information */}
          <div
            className={`transform transition-all duration-1000 delay-500 ${
              isVisible
                ? "translate-x-0 opacity-100"
                : "translate-x-10 opacity-0"
            }`}
          >
            {selectedCity ? (
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-3xl p-8 shadow-xl border border-primary-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-black">
                      {selectedCity.name}
                    </h3>
                    {selectedCity.popular && (
                      <span className="inline-block bg-primary-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        Popular
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center">
                    <Users className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-black">
                      {selectedCity.restaurants}
                    </div>
                    <div className="text-sm text-gray-600">Restaurants</div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center">
                    <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-black">
                      {selectedCity.avgDelivery}
                    </div>
                    <div className="text-sm text-gray-600">Avg Delivery</div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center">
                    <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-black">
                      {selectedCity.rating}
                    </div>
                    <div className="text-sm text-gray-600">Rating</div>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 hover:scale-105 transform shadow-lg">
                  Order in {selectedCity.name}
                </button>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-r from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-12 h-12 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-4">
                  Select a city on the map
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Click on any city marker to see detailed information about
                  restaurants, delivery times, and ratings in that area.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* City Grid */}
        <div
          className={`mt-20 transform transition-all duration-1000 delay-700 ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-10 opacity-0"
          }`}
        >
          <h3 className="text-2xl font-bold text-black mb-8 text-center">
            All Available Cities
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {cities.map((city, index) => (
              <button
                key={city.id}
                onClick={() => setSelectedCity(city)}
                className={`p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition-all duration-300 hover:scale-105 transform group ${
                  selectedCity?.id === city.id
                    ? "border-primary-500 bg-primary-50"
                    : ""
                } ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
                style={{ transitionDelay: `${800 + index * 50}ms` }}
              >
                <div className="text-center">
                  <div
                    className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                      city.popular
                        ? "bg-gradient-to-r from-primary-500 to-primary-600"
                        : "bg-gradient-to-r from-primary-500 to-primary-600"
                    } group-hover:scale-110 transition-transform duration-300`}
                  >
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div className="font-semibold text-black text-sm">
                    {city.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {city.restaurants} restaurants
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}