import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
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
    console.error('ErrorBoundary caught an unhandled exception:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[40vh] flex items-center justify-center p-6 text-center">
          <div className="bright-card max-w-md w-full p-8 border-2 border-rose-200 bg-rose-50/30 shadow-lg rounded-3xl">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2">
              {this.props.fallbackTitle || 'Terjadi Kendala Tampilan'}
            </h3>

            <p className="text-xs text-slate-600 mb-6 font-medium leading-relaxed">
              Komponen mengalami error sesaat. Klik tombol di bawah untuk memuat ulang tampilan tanpa kehilangan data.
            </p>

            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Pulihkan Tampilan</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
