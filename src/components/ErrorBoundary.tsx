import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last-resort error boundary so a thrown component error shows a useful
 * message (and recovery buttons) instead of a blank white/black screen.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private reload = () => {
    this.setState({ error: null });
    window.location.hash = '#/';
    window.location.reload();
  };

  private clearAllLocal = () => {
    if (!confirm('Clear all local Vegas/Tournament data on this device? Saved rounds and local events will be removed.')) {
      return;
    }
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    this.reload();
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-black text-neutral-100 p-6 flex flex-col items-center justify-center">
        <div className="max-w-md w-full">
          <div className="text-5xl mb-3 text-center">⛳</div>
          <h1 className="text-xl font-bold text-center mb-2">Something broke</h1>
          <p className="text-sm text-neutral-400 text-center mb-4">
            The screen crashed while rendering. You can return to the home screen,
            or reset local data if the error keeps coming back.
          </p>
          <pre className="bg-neutral-900 text-red-300 text-xs rounded-lg p-3 overflow-auto max-h-40 mb-4">
            {this.state.error.message}
          </pre>
          <div className="space-y-2">
            <button
              onClick={this.reload}
              className="w-full py-3 bg-emerald-600 rounded-lg text-white font-semibold"
            >
              Back to home
            </button>
            <button
              onClick={this.clearAllLocal}
              className="w-full py-2 bg-neutral-900 text-red-400 rounded-lg text-sm"
            >
              Clear local data and reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
