import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('React Error Boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, color: '#ff6b6b', background: '#1a1a2e', minHeight: '100vh' }}>
          <h2>渲染错误</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#16213e', padding: 16, borderRadius: 8, fontSize: 13 }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            style={{ marginTop: 16, padding: '8px 24px', cursor: 'pointer' }}
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
