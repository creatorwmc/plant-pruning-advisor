import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, where, getDocs, or } from 'firebase/firestore'
import { ref, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { useAuth } from '../components/AuthGate'
import './Home.css'

export default function Home() {
  const { user } = useAuth()
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    loadPlants()
  }, [user])

  async function loadPlants() {
    setLoading(true)
    try {
      const plantsRef = collection(db, 'plants')
      const ownedQ = query(plantsRef, where('ownerId', '==', user.uid))
      const householdQ = query(plantsRef, where('scope', '==', 'household'))

      const [ownedSnap, householdSnap] = await Promise.all([
        getDocs(ownedQ),
        getDocs(householdQ),
      ])

      const seen = new Set()
      const all = []

      for (const doc of ownedSnap.docs) {
        seen.add(doc.id)
        all.push({ id: doc.id, ...doc.data() })
      }
      for (const doc of householdSnap.docs) {
        if (!seen.has(doc.id)) all.push({ id: doc.id, ...doc.data() })
      }

      // Resolve photo URLs
      const withUrls = await Promise.all(all.map(async (plant) => {
        if (!plant.photoStoragePath) return plant
        try {
          const url = await getDownloadURL(ref(storage, plant.photoStoragePath))
          return { ...plant, photoUrl: url }
        } catch {
          return plant
        }
      }))

      withUrls.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0)
        const bTime = b.createdAt?.toDate?.() || new Date(0)
        return bTime - aTime
      })

      setPlants(withUrls)
    } catch (err) {
      console.error('Failed to load plants:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-page">
      <header className="home-page-header">
        <svg className="home-page-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s1 2.5-1.5 6c2-.5 3.5-.5 3.5-.5s-1 3.5-4 5.5" />
          <path d="M11 20L12 14" />
        </svg>
        <h1>Plants 101</h1>
      </header>

      <button className="add-plant-btn" onClick={() => navigate('/add')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Plant
      </button>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div className="spinner" />
        </div>
      ) : plants.length === 0 ? (
        <div className="empty-state">
          <p>No plants yet. Take a photo to get started!</p>
        </div>
      ) : (
        <div className="plant-grid">
          {plants.map((plant) => (
            <div
              key={plant.id}
              className="plant-card"
              onClick={() => navigate(`/plants/${plant.id}`)}
            >
              {plant.photoUrl ? (
                <img className="plant-card-photo" src={plant.photoUrl} alt={plant.nickname || 'Plant'} />
              ) : (
                <div className="plant-card-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s1 2.5-1.5 6c2-.5 3.5-.5 3.5-.5s-1 3.5-4 5.5" />
                    <path d="M11 20L12 14" />
                  </svg>
                </div>
              )}
              <div className="plant-card-info">
                <span className="plant-card-name">{plant.nickname || 'Unnamed'}</span>
                <span className="plant-card-species">{plant.speciesSlug?.replace(/-/g, ' ') || ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
