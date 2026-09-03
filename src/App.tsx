import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SundayDeliveryNotice } from './components/SundayDeliveryNotice';
import { KeychainCustomizer } from './components/KeychainCustomizer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { MyOrdersPage } from './pages/MyOrdersPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { GlobalLoadingBar } from './components/GlobalLoadingBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import type { PlateConfig } from './components/PlateVisualizer2D';
import type { OrderItem } from './api/orders';

export const AppContent: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const { tab: activeTab, navigate } = useRouter();

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutConfig, setCheckoutConfig] = useState<PlateConfig | null>(null);
  const [checkoutPrice, setCheckoutPrice] = useState(300);

  // Auth modal state
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Automatically reset tab when user logs out or permission changes (only after auth state is loaded)
  React.useEffect(() => {
    if (isAuthLoading) return;

    if (activeTab === 'admin' && !user?.isAdmin) {
      navigate('customizer', { replace: true });
    } else if (activeTab === 'orders' && !user) {
      navigate('customizer', { replace: true });
    }
  }, [user, isAuthLoading, activeTab, navigate]);

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
      <GlobalLoadingBar />
      <Header onOpenAuth={() => setIsAuthOpen(true)} />

      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '0 24px' }}>
        {/* Top Banner: Sunday Delivery Notice */}
        <SundayDeliveryNotice />

        <ErrorBoundary fallbackTitle="Ошибка отображения страницы">
          {isAuthLoading && (activeTab === 'admin' || activeTab === 'orders') ? (
            <div className="glass-elevated" style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '500px', margin: '40px auto', borderRadius: '16px' }}>
              <div className="loading-spinner-ring" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Проверка авторизации...
              </div>
            </div>
          ) : (
            <>
              {/* Tab Routing */}
              {activeTab === 'customizer' && (
                <KeychainCustomizer onOrderClick={handleOrderClick} />
              )}

              {activeTab === 'track' && <OrderTrackingPage />}

              {activeTab === 'orders' && (
                <MyOrdersPage
                  onGoToCustomizer={() => navigate('customizer')}
                  onGoToTrack={(orderNumber) => navigate('track', orderNumber ? { query: { number: orderNumber } } : undefined)}
                />
              )}

              {activeTab === 'admin' && <AdminDashboard />}
            </>
          )}
        </ErrorBoundary>
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
          <RouterProvider>
            <AppContent />
          </RouterProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
