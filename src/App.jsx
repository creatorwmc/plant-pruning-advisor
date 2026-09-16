import { Component } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AuthGate from './components/AuthGate'
import Login from './pages/Login'
import Home from './pages/Home'
import AddPlant from './pages/AddPlant'
import PlantDetail from './pages/PlantDetail'
import PruneResult from './pages/PruneResult'

class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', color: '#8B2E1E' }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8, fontSize: 12, opacity: 0.7 }}>{this.state.error.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthGate>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/add" element={<AddPlant />} />
            <Route path="/plants/:plantId" element={<PlantDetail />} />
            <Route path="/plants/:plantId/prune" element={<PruneResult />} />
          </Routes>
        </AuthGate>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
