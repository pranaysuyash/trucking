import React from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('P09 render error', error, info);
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            margin: 24,
            borderRadius: 12,
            border: '1px solid var(--p09-border-strong)',
            background: 'var(--p09-bg-2)',
            color: 'var(--p09-text-1)',
          }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: 16 }}>Something went wrong</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--p09-text-3)' }}>
            {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            style={{ marginTop: 12 }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}