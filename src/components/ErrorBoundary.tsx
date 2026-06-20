// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from 'react';

export class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if ((this.state as any).hasError) {
      if ((this.props as any).fallback) {
        return (this.props as any).fallback;
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Something went wrong.</h1>
            <p className="text-gray-500 mb-8">An unexpected error occurred. Please refresh the page or try again later.</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-900 hover:bg-gray-800"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return (this.props as any).children;
  }
}
