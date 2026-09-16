import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { ref, getDownloadURL } from 'firebase/storage'
import { db, storage, auth } from '../firebase'
import ChatPanel from '../components/ChatPanel'
import { useAuth } from '../components/AuthGate'
import './PlantDetail.css'

export default function PlantDetail() {
  const { plantId } = useParams()
  const navigate = useNavigate()
  const { kairosMembership } = useAuth()
  const [plant, setPlant] = useState(null)
  const [speciesInfo, setSpeciesInfo] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [pruningLoading, setPruningLoading] = useState(false)
  const [pruningGoal, setPruningGoal] = useState('')
  const [cameraOpen, setCameraOpen] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadPlant()
  }, [plantId])

  async function loadPlant() {
    setLoading(true)
    try {
      const plantDoc = await getDoc(doc(db, 'plants', plantId))
      if (!plantDoc.exists()) { navigate('/'); return }
      const plantData = { id: plantDoc.id, ...plantDoc.data() }
      setPlant(plantData)

      if (plantData.photoStoragePath) {
        getDownloadURL(ref(storage, plantData.photoStoragePath))
          .then(setPhotoUrl).catch(() => {})
      }

      if (plantData.speciesSlug) {
        const siDoc = await getDoc(doc(db, 'species_info', plantData.speciesSlug))
        if (siDoc.exists()) setSpeciesInfo(siDoc.data())
      }

      const sessionsQ = query(
        collection(db, 'pruning_sessions'),
        where('plantId', '==', plantId),
        orderBy('createdAt', 'desc'),
      )
      const sessionsSnap = await getDocs(sessionsQ)
      setSessions(sessionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
    } catch (err) {
      console.error('Failed to load plant:', err)
    } finally {
      setLoading(false)
    }
  }

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      setCameraOpen(true)
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      }, 50)
    } catch {
      fileInputRef.current?.click()
    }
  }, [])

  const closeCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null }
    setCameraOpen(false)
  }, [])

  const captureForPruning = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg', 0.85)
    closeCamera()
    doPruningAdvice(base64)
  }, [closeCamera, plant, speciesInfo, pruningGoal])

  const handlePruningFile = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX = 1920
        let w = img.width, h = img.height
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round((h * MAX) / w); w = MAX }
          else { w = Math.round((w * MAX) / h); h = MAX }
        }
        canvas.width = w; canvas.height = h
        canvas.getContext('2d').drawImage(img, 0, 0, w, h)
        doPruningAdvice(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [plant, speciesInfo, pruningGoal])

  async function doPruningAdvice(imageBase64) {
    setPruningLoading(true)
    try {
      const speciesName = speciesInfo?.scientificName || plant?.speciesSlug?.replace(/-/g, ' ') || 'Unknown'
      const token = await auth.currentUser.getIdToken()
      const res = await fetch('/.netlify/functions/pruning-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ speciesName, goal: pruningGoal || 'general maintenance', imageBase64 }),
      })
      if (!res.ok) throw new Error('Pruning advice failed')
      const result = await res.json()
      navigate(`/plants/${plantId}/prune`, { state: { result, imageBase64, speciesName } })
    } catch (err) {
      console.error('Pruning advice failed:', err)
    } finally {
      setPruningLoading(false)
    }
  }

  function startPruning() {
    openCamera()
  }

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '40vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!plant) return null

  const commonName = speciesInfo?.commonNames?.[0] || plant.nickname
  const scientificName = speciesInfo?.scientificName || plant.speciesSlug?.replace(/-/g, ' ')

  return (
    <div className="plant-detail-page">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate('/')} aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1>{plant.nickname || commonName}</h1>
      </header>

      {photoUrl && <img className="detail-photo" src={photoUrl} alt={plant.nickname} />}

      {speciesInfo && (
        <div className="species-card fade-in">
          <h2>{speciesInfo.scientificName}</h2>
          {speciesInfo.commonNames?.length > 0 && (
            <p className="common-names">{speciesInfo.commonNames.join(', ')}</p>
          )}
          <p className="species-description">{speciesInfo.description}</p>

          {speciesInfo.herbalAndMedicinalUses && (
            <div className="info-section">
              <h3>Herbal & Medicinal Uses</h3>
              <p>{speciesInfo.herbalAndMedicinalUses}</p>
            </div>
          )}

          {speciesInfo.symbolicReadings?.length > 0 && (
            <div className="info-section">
              <h3>Symbolic Readings</h3>
              <div className="readings-list">
                {speciesInfo.symbolicReadings.map((r, i) => (
                  <div
                    key={i}
                    className={`reading-card ${r.groundedness === 'documented' ? 'reading-documented' : 'reading-synthesized'}`}
                  >
                    <div className="reading-header">
                      <span className="reading-tradition">{r.tradition}</span>
                      {r.groundedness === 'synthesized' && (
                        <span className="reading-label">synthesized</span>
                      )}
                    </div>
                    <p className="reading-correspondence">{r.correspondence}</p>
                    {r.notes && <p className="reading-notes">{r.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pruning-section">
        <h2>Pruning Advice</h2>
        <input
          type="text"
          className="pruning-goal-input"
          placeholder="Goal (e.g. shorter, bushier, remove dead)"
          value={pruningGoal}
          onChange={(e) => setPruningGoal(e.target.value)}
        />
        <button className="pruning-btn" onClick={startPruning} disabled={pruningLoading}>
          {pruningLoading ? (
            <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> Getting advice...</>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              Get Pruning Advice
            </>
          )}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden-input" onChange={handlePruningFile} />
      </div>

      {sessions.length > 0 && (
        <div className="sessions-section">
          <h2>Past Pruning Sessions</h2>
          {sessions.map((s) => (
            <div
              key={s.id}
              className="session-entry"
              onClick={() => navigate(`/plants/${plantId}/prune`, { state: { result: s, fromHistory: true } })}
            >
              <span className="session-date">
                {s.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown date'}
              </span>
              <span className="session-summary">{s.summary?.slice(0, 80) || s.goal || 'View session'}</span>
            </div>
          ))}
        </div>
      )}

      <ChatPanel
        plantContext={{ commonName, speciesName: scientificName }}
        kairosMembership={kairosMembership}
      />

      {cameraOpen && (
        <div className="viewfinder-overlay">
          <div className="viewfinder-tip">Get the whole plant in frame</div>
          <video ref={videoRef} className="viewfinder-video" autoPlay playsInline muted />
          <div className="viewfinder-controls">
            <button className="viewfinder-close" onClick={closeCamera} aria-label="Close camera">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <button className="viewfinder-capture" onClick={captureForPruning} aria-label="Capture photo" />
            <div className="viewfinder-spacer" />
          </div>
          <canvas ref={canvasRef} className="capture-canvas" />
        </div>
      )}
    </div>
  )
}
