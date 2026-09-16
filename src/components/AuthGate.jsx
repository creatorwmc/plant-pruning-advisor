import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { useNavigate, useLocation } from 'react-router-dom'
import { auth } from '../firebase'
import { getKairosMembership, readCachedMembership } from '../lib/kairosHandshake'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined)
  const [kairosMembership, setKairosMembership] = useState(() =>
    readCachedMembership(auth.currentUser?.email)
  )
  const navigate = useNavigate()
  const location = useLocation()
  const locationRef = useRef(location.pathname)
  locationRef.current = location.pathname

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) {
        setKairosMembership(null)
        if (locationRef.current !== '/login') navigate('/login', { replace: true })
      } else {
        getKairosMembership(firebaseUser).then(setKairosMembership)
      }
    })
  }, [navigate])

  if (user === undefined) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '40vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, kairosMembership }}>
      {children}
    </AuthContext.Provider>
  )
}
