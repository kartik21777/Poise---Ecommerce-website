import React from 'react';

export const ErrorState: React.FC<{ title?: string; message?: string; onRetry?: () => void }> = ({ 
  title = 'Something went wrong', 
  message = 'We encountered an error loading this content.',
  onRetry
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <h3 className="text-xl font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6">{message}</p>
    {onRetry && (
      <button 
        onClick={onRetry}
        className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{ title: string; message: string; action?: React.ReactNode }> = ({
  title,
  message,
  action
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <h3 className="text-2xl font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6 max-w-md mx-auto">{message}</p>
    {action}
  </div>
);

export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />
);
