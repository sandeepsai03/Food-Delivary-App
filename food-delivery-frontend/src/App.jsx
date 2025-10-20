import { AuthProvider } from "./contexts/AuthContext";
import { OrderProvider } from './contexts/OrderProvider';
import AppContent from "./components/AppContent";

// ★ STEP 1: Import the necessary Stripe libraries
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// ★ STEP 2: Initialize Stripe outside of your component's render to avoid re-creating the object on every render.
// IMPORTANT: Replace this with your ACTUAL Stripe Publishable Key.
// You can find this in your application.properties file or your Stripe Dashboard. It starts with "pk_test_".
const stripePromise = loadStripe('pk_test_51Ry69uLD7gMLV8EqgsMNv1WwC0u6rpLREOjSlik5f1gXJzuFYmDihREdflmgAvMej98VKwRhd0HEVVLanYYw9LTP00uDGtfK7C');

function App() {
  return (
    // ★ STEP 3: Wrap your entire application with the Elements provider.
    // It can go outside or inside your other providers. Outside is a clean approach.
    <Elements stripe={stripePromise}>
      <AuthProvider>
        <OrderProvider>
          <div className="min-h-screen bg-gray-50">
            <AppContent />
          </div>
        </OrderProvider>
      </AuthProvider>
    </Elements>
  );
}

export default App;