import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error | undefined) => ReactNode);
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error?.message, error?.stack, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const fb = this.props.fallback;
        return typeof fb === 'function' ? fb(this.state.error) : fb;
      }
      const err = this.state.error;
      const msg = err?.message ?? 'Unknown error';
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
            {msg}
          </p>
          {import.meta.env.DEV && err?.stack && (
            <pre className="mt-3 max-h-32 overflow-auto rounded bg-muted p-2 text-[10px] text-left">
              {err.stack}
            </pre>
          )}
          <Button onClick={this.handleRetry} className="mt-6">
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
