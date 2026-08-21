import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import App from './App.jsx';
import './styles/globals.css';

/**
 * Base path for the GitHub Pages deployment.
 * In production the app is served under the repository sub-path, so React
 * Router must be told the basename to build correct route / asset URLs.
 * In development the app is served at the root, so no basename is applied.
 */
const PROD_BASE =
  '/Site_Pulse-Smart_Construction_Site_Management_Platform';

const routerBasename = import.meta.env.PROD ? PROD_BASE : undefined;

/**
 * QueryClient with sensible defaults.
 * - staleTime: 5 minutes (data considered fresh for 5 min)
 * - retry: 1 (retry failed requests once)
 * - refetchOnWindowFocus: false (don't refetch on tab switch)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter basename={routerBasename}>
            <ThemeProvider>
              <AuthProvider>
                <NotificationProvider>
                  <Toaster
                    position="top-right"
                    toastOptions={{
                      duration: 4000,
                      style: {
                        borderRadius: '8px',
                        background: '#333',
                        color: '#fff',
                      },
                      success: {
                        duration: 3000,
                      },
                      error: {
                        duration: 5000,
                      },
                    }}
                  />
                  <App />
                </NotificationProvider>
              </AuthProvider>
            </ThemeProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);