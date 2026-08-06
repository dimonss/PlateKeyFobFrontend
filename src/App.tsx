import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SundayDeliveryNotice } from './components/SundayDeliveryNotice';
import { KeychainCustomizer } from './components/KeychainCustomizer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import type { PlateConfig } from './components/PlateVisualizer2D';
import type { OrderItem } from './api/orders';

export const AppContent: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'customizer' | 'track' | 'orders' | 'admin'>('customizer');

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutConfig, setCheckoutConfig] = useState<PlateConfig | null>(null);
  const [checkoutPrice, setCheckoutPrice] = useState(500);

  // Auth modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Automatically reset tab when user logs out or permission changes
  React.useEffect(() => {
    if (activeTab === 'admin' && !user?.isAdmin) {
      setActiveTab('customizer');
    } else if (activeTab === 'orders' && !user) {
      setActiveTab('customizer');
    }
  }, [user, activeTab]);

  const handleOrderClick = (config: PlateConfig, price: number) => {
    if (!user) {
      showToast({
        type: 'warning',
        title: 'Требуется авторизация',
        message: 'Для оформления заказа необходимо войти в аккаунт или зарегистрироваться',
      });
      setIsAuthOpen(true);
      return;
    }
    setCheckoutConfig(config);
    setCheckoutPrice(price);
    setIsCheckoutOpen(true);
  };

  const handleOrderCompleted = (_order: OrderItem) => {
    // Order successfully created
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0 24px' }}>
        {/* Top Banner: Sunday Delivery Notice */}
        <SundayDeliveryNotice />

        {/* Tab Routing */}
        {activeTab === 'customizer' && (
          <KeychainCustomizer onOrderClick={handleOrderClick} />
        )}

        {activeTab === 'track' && <OrderTrackingPage />}

        {activeTab === 'orders' && (
          <MyOrdersPage
            onGoToCustomizer={() => setActiveTab('customizer')}
            onGoToTrack={() => setActiveTab('track')}
          />
        )}

        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      <Footer />

      {/* Checkout Modal */}
      {isCheckoutOpen && checkoutConfig && (
        <CheckoutModal
          config={checkoutConfig}
          price={checkoutPrice}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderCompleted={handleOrderCompleted}
        />
      )}

      {/* Auth Modal */}
      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
