import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  const getStyles = () => {
    if (type === 'error') {
      return {
        bg: 'bg-red-50',
        border: 'border-red-100',
        text: 'text-red-600',
        icon: (
          <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        )
      };
    }
    if (type === 'warning') {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        text: 'text-amber-700',
        icon: (
          <svg className="w-5 h-5 text-amber-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        )
      };
    }
    // Default success
    return {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      text: 'text-emerald-600',
      icon: (
        <svg className="w-5 h-5 text-emerald-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
      )
    };
  };

  const styles = getStyles();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center shadow-lg rounded-2xl animate-fade-in-up">
      <div className={`flex items-center px-6 py-4 border ${styles.bg} ${styles.border} rounded-2xl`}>
        {styles.icon}
        <span className={`font-medium text-[15px] ${styles.text}`}>{message}</span>
        <button
          onClick={onClose}
          className={`ml-6 p-1 rounded-full opacity-50 hover:opacity-100 transition-opacity ${styles.text}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;
