import { createContext, useContext, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const NotificationContext = createContext();

/**
 * Notification Provider using react-hot-toast.
 * Provides a centralized way to show success/error/info messages.
 */
function NotificationProvider({ children }) {
  const showSuccess = useCallback((message, options) => {
    toast.success(message, options);
  }, []);

  const showError = useCallback((message, options) => {
    toast.error(message, options);
  }, []);

  const showInfo = useCallback((message, options) => {
    toast(message, { icon: 'ℹ️', ...options });
  }, []);

  const showLoading = useCallback((message) => {
    return toast.loading(message);
  }, []);

  const dismiss = useCallback((toastId) => {
    toast.dismiss(toastId);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ showSuccess, showError, showInfo, showLoading, dismiss }}
    >
      <Toaster position="top-right" />
      {children}
    </NotificationContext.Provider>
  );
}

function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export { NotificationProvider, useNotification };