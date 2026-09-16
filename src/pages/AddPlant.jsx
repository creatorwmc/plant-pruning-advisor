import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref as storageRef, uploadBytes } from 'firebase/storage'
import { db, storage, auth } from '../firebase'
import './AddPlant.css'

export default function AddPlant() {
  const [step, setStep] = useState('capture')
  const [imageData, setImageData] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [selected, setSelected] = useState(null)
  const [speciesInfo, setSpeciesInfo] = useState(null)
  const [nickname, setNickname] = useState('')
  const [scope, setScope] = useState('personal')
  const [error, setError] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const navigate = useNavigate()

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      setCameraOpen(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      }, 50)
    } catch {
      fileInputRef.current?.click()
    }
  }, [])

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraOpen(false)
  }, [])

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const base64 = canvas.toDataURL('image/jpeg', 0.85)
    closeCamera()
    handleImageReady(base64)
  }, [closeCamera])

  const handleFileChange = useCallback((e) => {
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
        handleImageReady(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  async function handleImageReady(base64) {
    setImageData(base64)
    setStep('identifying')
    setError(null)
    try {
      const token = await auth.currentUser.getIdToken()
      const res = await fetch('/.netlify/functions/identify-plant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageBase64: base64 }),
      })
      if (!res.ok) throw new Error('Identification failed')
      const data = await res.json()
      setCandidates(data.candidates || [])
      setStep('confirm')
    } catch (err) {
      setError(err.message)
      setStep('capture')
    }
  }

  async function handleSelectCandidate(candidate) {
    setSelected(candidate)
    setStep('loading-info')
    setError(null)
    try {
      const token = await auth.currentUser.getIdToken()
      const res = await fetch('/.netlify/functions/generate-species-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          scientificName: candidate.scientificName,
          commonName: candidate.commonNames[0] || null,
        }),
      })
      if (!res.ok) throw new Error('Failed to load species info')
      const data = await res.json()
      setSpeciesInfo(data)
      setNickname(candidate.commonNames[0] || candidate.scientificName)
      setStep('save')
    } catch (err) {
      setError(err.message)
      setStep('confirm')
    }
  }

  async function handleSave() {
    if (!selected || !imageData) return
    setStep('saving')
    try {
      const uid = auth.currentUser.uid
      const timestamp = Date.now()
      const path = `plants/${uid}/${timestamp}.jpg`

      const base64 = imageData.split(',')[1]
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
      await uploadBytes(storageRef(storage, path), bytes, { contentType: 'image/jpeg' })

      const slug = selected.scientificName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const doc = await addDoc(collection(db, 'plants'), {
        ownerId: uid,
        scope,
        ...(scope === 'household' ? { householdId: 'pajhar3fS7vb7eafqfj4' } : {}),
        nickname: nickname.trim() || selected.commonNames[0] || selected.scientificName,
        speciesSlug: slug,
        photoStoragePath: path,
        plantnetConfidence: selected.score,
        plantnetCandidates: candidates.slice(0, 3),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      navigate(`/plants/${doc.id}`)
    } catch (err) {
      setError(err.message)
      setStep('save')
    }
  }

  return (
    <div className="add-plant-page">
      <header className="add-plant-header">
        <button className="back-btn" onClick={() => navigate('/')} aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1>Add Plant</h1>
      </header>

      {error && <div className="add-plant-error">{error}</div>}

      {step === 'capture' && (
        <div className="capture-section">
          <div className="capture-actions">
            <button className="camera-btn" onClick={() => cameraInputRef.current?.click()} aria-label="Open camera">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </button>
            <span className="camera-btn-label">Take a Photo</span>
            <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Photo
            </button>
            <p className="tip-text">Get the whole plant in frame</p>
          </div>
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden-input" onChange={handleFileChange} />
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden-input" onChange={handleFileChange} />
        </div>
      )}

      {(step === 'identifying' || step === 'loading-info' || step === 'saving') && (
        <div className="loading-section fade-in">
          {imageData && <img className="preview-photo" src={imageData} alt="Plant" />}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 0' }}>
            <div className="spinner" />
            <p style={{ color: 'var(--soil-brown)', fontSize: '0.9rem' }}>
              {step === 'identifying' && 'Identifying your plant...'}
              {step === 'loading-info' && 'Loading species information...'}
              {step === 'saving' && 'Saving your plant...'}
            </p>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="confirm-section fade-in">
          {imageData && <img className="preview-photo" src={imageData} alt="Plant" />}
          <h2>Select your plant</h2>
          <div className="candidate-list">
            {candidates.map((c, i) => (
              <button key={i} className="candidate-card" onClick={() => handleSelectCandidate(c)}>
                <div className="candidate-names">
                  <span className="candidate-scientific">{c.scientificName}</span>
                  {c.commonNames[0] && <span className="candidate-common">{c.commonNames[0]}</span>}
                </div>
                <span className={`pill pill-${c.score > 0.5 ? 'high' : c.score > 0.2 ? 'medium' : 'low'}`}>
                  {Math.round(c.score * 100)}%
                </span>
              </button>
            ))}
          </div>
          <button className="retake-btn" onClick={() => { setStep('capture'); setImageData(null); setCandidates([]) }}>
            Retake photo
          </button>
        </div>
      )}

      {step === 'save' && speciesInfo && (
        <div className="save-section fade-in">
          {imageData && <img className="preview-photo" src={imageData} alt="Plant" />}
          <div className="species-preview">
            <h3>{speciesInfo.scientificName}</h3>
            <p className="species-desc">{speciesInfo.description}</p>
          </div>
          <div className="save-form">
            <label>
              <span className="field-label">Nickname</span>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Give your plant a name"
              />
            </label>
            <label>
              <span className="field-label">Visibility</span>
              <select value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="personal">Just me</option>
                <option value="household">Household</option>
              </select>
            </label>
            <button className="save-btn" onClick={handleSave}>Save Plant</button>
          </div>
        </div>
      )}

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
            <button className="viewfinder-capture" onClick={capturePhoto} aria-label="Capture photo" />
            <div className="viewfinder-spacer" />
          </div>
          <canvas ref={canvasRef} className="capture-canvas" />
        </div>
      )}
    </div>
  )
}
