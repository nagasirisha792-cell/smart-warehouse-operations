import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f1319] text-white flex flex-col items-center justify-center p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8" />
            <div>
              <h2 className="font-extrabold text-lg">Application Render Error</h2>
              <p className="text-xs text-red-300 font-mono mt-1">
                {this.state.error?.message || 'A JavaScript exception occurred.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
