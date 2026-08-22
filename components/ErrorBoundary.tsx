"use client";

import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error boundary caught:", error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback?.(this.state.error!, this.retry) || (
          <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
              <p className="text-gray-600 mb-6">
                An unexpected error occurred. Please try again.
              </p>
              <button
                onClick={this.retry}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition"
              >
                Try Again
              </button>
              <p className="text-xs text-gray-500 mt-4">
                If this persists, contact{" "}
                <a
                  href="mailto:support@senebiclabs.com"
                  className="text-blue-600 hover:text-blue-700"
                >
                  support@senebiclabs.com
                </a>
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
