import { Component } from 'react'
import { runtimeConfig } from '../config/runtime'

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('VetPaw encontró un error de interfaz:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="vp-fatal-error" role="alert" aria-live="assertive">
        <div className="vp-fatal-error-card">
          <span className="vp-fatal-error-icon" aria-hidden="true">🐾</span>
          <p className="vp-fatal-error-kicker">VETPAW SIGUE CUIDANDO TUS DATOS</p>
          <h1>Esta pantalla tuvo un inconveniente</h1>
          <p>No se perdió ninguna información. Recargá VetPaw para continuar desde una pantalla limpia.</p>
          <small>Versión de la app: {runtimeConfig.appVersion}</small>
          <div className="vp-fatal-error-actions">
            <button type="button" onClick={() => window.location.reload()}>Recargar VetPaw</button>
            <a href="/">Volver a Comunidad</a>
          </div>
        </div>
      </main>
    )
  }
}
