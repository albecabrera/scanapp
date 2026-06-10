import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 32,
        background: 'var(--color-bg, #F4F6EF)', fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{
          fontSize: 40, marginBottom: 16, userSelect: 'none',
        }}>⚠️</div>
        <h2 style={{
          fontSize: 20, fontWeight: 700, color: 'var(--color-ink, #1C2A1E)',
          margin: '0 0 8px', textAlign: 'center',
        }}>
          Algo salió mal
        </h2>
        <p style={{
          fontSize: 14, color: 'var(--color-ink-soft, #6B7F6E)',
          margin: '0 0 28px', textAlign: 'center', maxWidth: 280,
        }}>
          {this.state.error?.message ?? 'Error inesperado'}
        </p>
        <button
          onClick={() => { this.setState({ error: null }); window.location.reload() }}
          style={{
            height: 48, borderRadius: 24, background: 'var(--color-primary, #237A4B)',
            color: '#fff', border: 'none', padding: '0 28px',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }
}
