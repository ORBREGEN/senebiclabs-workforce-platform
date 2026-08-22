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
          <div className="min-h-screen bg-bg flex items-center justify-center px-8 py-12">
            <div className="w-full max-w-[560px]">
              <div className="bg-surface border border-hairline rounded-lg shadow-sm p-12 text-center">
                <h1 className="text-h1 font-serif text-ink mb-3">
                  Something went wrong
                </h1>
                <p className="text-body text-slate mb-8">
                  An unexpected error interrupted things. Trying again usually
                  sorts it out.
                </p>
                <button
                  onClick={this.retry}
                  className="inline-flex items-center justify-center h-12 px-6 bg-teal-deep hover:bg-teal text-white font-semibold rounded-md transition-all duration-160"
                >
                  Try again
                </button>
                <p className="text-small text-muted mt-6">
                  If this keeps happening, reach us at{" "}
                  <a
                    href="mailto:support@senebiclabs.com"
                    className="text-teal hover:text-teal-deep font-semibold"
                  >
                    support@senebiclabs.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
