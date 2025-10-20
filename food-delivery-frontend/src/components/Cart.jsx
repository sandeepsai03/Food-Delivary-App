"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

// Stripe Imports
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Icon Imports
import { 
    ShoppingCart, Plus, Minus, CheckCircle, Loader2
} from 'lucide-react';

// --- API HELPER HOOK ---
const useApi = (authToken) => {
  const api = useMemo(() => {
    const instance = axios.create({ baseURL: "http://localhost:8080" });
    instance.interceptors.request.use(
      (config) => {
        if (authToken) config.headers["Authorization"] = `Bearer ${authToken}`;
        return config;
      },
      (error) => Promise.reject(error)
    );
    return instance;
  }, [authToken]);
  return api;
};


// --- MAIN CART COMPONENT ---
export default function Cart({ onBrowse, onOrderSuccess }) {
  const { authToken } = useAuth();
  const api = useApi(authToken);

  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [mutatingItemId, setMutatingItemId] = useState(null);

  useEffect(() => {
    if (!authToken) {
      setIsLoading(false);
      setError("Please log in to view your cart.");
      return;
    }
    
    const fetchCart = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/api/customer/cart');
        setCart(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch cart.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCart();
  }, [authToken, api]);

  const handleAddToCart = async (menuItem) => {
    setMutatingItemId(menuItem.id);
    try {
      const response = await api.post(`/api/customer/cart/items?menuItemId=${menuItem.id}&quantity=1`);
      setCart(response.data);
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setMutatingItemId(null);
    }
  };

  const handleRemoveFromCart = async (cartItemId) => {
    setMutatingItemId(cartItemId);
    try {
      const response = await api.delete(`/api/customer/cart/items/${cartItemId}`);
      setCart(response.data);
    } catch (err) {
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setMutatingItemId(null);
    }
  };

  const handleProceedToCheckout = () => { if (cart?.items?.length > 0) setCheckoutStep('payment'); };
  const handleBackToCart = () => setCheckoutStep('cart');
  const totalPrice = useMemo(() => cart?.items?.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0).toFixed(2) || '0.00', [cart]);

  if (isLoading) return <div className="card flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-primary-500" /></div>;
  if (error) return <div className="card text-center p-12 text-red-600">Error: {error}</div>;

  switch (checkoutStep) {
    case 'payment': return <PaymentPage totalPrice={totalPrice} onBack={handleBackToCart} />;
    case 'success': return <OrderSuccess onBrowse={onBrowse} />; // This case is now mainly for non-redirect flows
    default:
      if (!cart || cart.items.length === 0) return <EmptyCart onBrowse={onBrowse} />;
      return <CartView cartItems={cart.items} onAddToCart={handleAddToCart} onRemoveFromCart={handleRemoveFromCart} onCheckout={handleProceedToCheckout} totalPrice={totalPrice} mutatingItemId={mutatingItemId} />;
  }
}

// --- CART VIEW COMPONENT ---
function CartView({ cartItems, onAddToCart, onRemoveFromCart, onCheckout, totalPrice, mutatingItemId }) {
  return (
    <div className="card">
      <h2 className="text-xl sm:text-2xl font-bold mb-6">Shopping Cart</h2>
      <div className="space-y-4">
        {cartItems.map((cartItem) => {
          const isMutating = mutatingItemId === cartItem.id || mutatingItemId === cartItem.menuItem.id;
          return (
            <div key={cartItem.id} className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 bg-gray-50 rounded-lg">
              <img src={cartItem.menuItem.imageUrl || "/placeholder.svg"} alt={cartItem.menuItem.name} className="w-full sm:w-16 h-24 sm:h-16 object-cover rounded-lg" />
              <div className="flex-1"><h3 className="font-semibold">{cartItem.menuItem.name}</h3></div>
              <div className="flex items-center justify-between w-full sm:w-auto">
                <div className="flex items-center space-x-2">
                  <button onClick={() => onRemoveFromCart(cartItem.id)} disabled={isMutating} className="p-1 disabled:opacity-50"><Minus className="h-4 w-4" /></button>
                  <span className="font-semibold w-8 text-center">{isMutating ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : cartItem.quantity}</span>
                  <button onClick={() => onAddToCart(cartItem.menuItem)} disabled={isMutating} className="p-1 disabled:opacity-50"><Plus className="h-4 w-4" /></button>
                </div>
                <p className="font-bold text-right ml-4">₹{(cartItem.menuItem.price * cartItem.quantity).toFixed(2)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t pt-4 mt-6">
        <div className="flex justify-between items-center mb-4"><span className="text-xl font-bold">Total:</span><span className="text-xl font-bold">₹{totalPrice}</span></div>
        <button onClick={onCheckout} className="w-full btn-primary py-3">Proceed to Checkout</button>
      </div>
    </div>
  );
}

// --- PAYMENT PAGE COMPONENT ---
function PaymentPage({ totalPrice, onBack }) {
    const { authToken } = useAuth();
    const api = useApi(authToken);
    const [clientSecret, setClientSecret] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const createPaymentIntent = async () => {
            try {
                const amount = parseFloat(totalPrice);
                if (isNaN(amount) || amount <= 0) {
                    setError("Invalid cart total.");
                    setIsLoading(false);
                    return;
                }
                const response = await api.post('/api/payments/create-payment-intent', { amount });
                setClientSecret(response.data.clientSecret);
            } catch (err) {
                setError('Failed to initialize payment. Please try again.');
                console.error("Error creating payment intent:", err);
            } finally {
                setIsLoading(false);
            }
        };
        createPaymentIntent();
    }, [api, totalPrice]);

    if (isLoading) {
        return <div className="card text-center p-12"><Loader2 className="animate-spin h-8 w-8 mx-auto" /> <p className="mt-2">Initializing Secure Payment...</p></div>;
    }
    if (error) {
        return <div className="card text-center p-12 text-red-600">{error}</div>;
    }

    const appearance = { theme: 'stripe' };
    const options = { clientSecret, appearance };

    return (
        <div className="card max-w-4xl mx-auto">
            <button onClick={onBack} className="text-primary-600 hover:underline mb-6 text-sm font-medium flex items-center">← Back to Cart</button>
            <h2 className="text-2xl font-bold mb-6">Complete Your Payment</h2>
            {clientSecret && (
                <Elements key={clientSecret} options={options} stripe={useStripe()}>
                    <CheckoutForm totalPrice={totalPrice} />
                </Elements>
            )}
        </div>
    );
}

// --- STRIPE CHECKOUT FORM COMPONENT ---
function CheckoutForm({ totalPrice }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // After payment, redirect the user directly to their "My Orders" page.
                // The backend webhook will handle creating the order and clearing the cart.
                return_url: `${window.location.origin}/my-orders`,
            },
        });

        if (error.type === "card_error" || error.type === "validation_error") {
            setMessage(error.message);
        } else {
            setMessage("An unexpected error occurred.");
        }
        
        setIsProcessing(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit}>
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
                <div className="flex justify-between items-center text-lg">
                    <span className="font-medium">Amount to Pay:</span>
                    <span className="font-bold text-xl">₹{parseFloat(totalPrice).toFixed(2)}</span>
                </div>
            </div>
            
            <PaymentElement id="payment-element" />

            <button disabled={isProcessing || !stripe || !elements} id="submit" className="w-full btn-primary py-3 mt-8">
                <span id="button-text">
                    {isProcessing ? <Loader2 className="animate-spin h-5 w-5 inline" /> : "Pay Securely"}
                </span>
            </button>
            
            {message && <div id="payment-message" className="text-red-600 text-center mt-2">{message}</div>}
        </form>
    );
}

// --- ORDER SUCCESS COMPONENT ---
function OrderSuccess({ onBrowse }) {
    return (
      <div className="card text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Order Placed Successfully!</h2>
        <p className="text-gray-600 my-4">Your payment was successful. You can now track your order in the "My Orders" section.</p>
        <button onClick={onBrowse} className="btn-primary">Browse More Restaurants</button>
      </div>
    );
}

// --- EMPTY CART COMPONENT ---
function EmptyCart({ onBrowse }) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
          <p className="text-gray-600 mb-4">Add some delicious items to get started!</p>
          <button onClick={onBrowse} className="btn-primary">Browse Restaurants</button>
        </div>
      </div>
    );
}