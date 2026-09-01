import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error('Uncaught component error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
          <div className="glass-elevated" style={{ padding: '36px 28px', textAlign: 'center', borderRadius: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#ef4444',
              }}
            >
              <AlertTriangle size={30} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
              {this.props.fallbackTitle || 'Произошла ошибка при отображении страницы'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
              {this.state.error?.message || 'Непредвиденная ошибка компонента. Попробуйте обновить страницу.'}
            </p>
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            >
              <RefreshCw size={16} /> Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
