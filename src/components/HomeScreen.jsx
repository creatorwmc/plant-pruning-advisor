import { useState, useRef, useCallback } from 'react';
import './HomeScreen.css';

export default function HomeScreen({ onPhotoCapture, savedSessions, onLoadSession, onDeleteSession }) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      // Wait for the video element to be mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 50);
    } catch (err) {
      console.warn('Camera not available, falling back to file input:', err);
      fileInputRef.current?.click();
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    closeCamera();
    onPhotoCapture(base64);
  }, [closeCamera, onPhotoCapture]);

  const handleFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        // Compress via canvas
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX = 1920;
          let w = img.width;
          let h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round((h * MAX) / w); w = MAX; }
            else { w = Math.round((w * MAX) / h); h = MAX; }
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          const base64 = canvas.toDataURL('image/jpeg', 0.85);
          onPhotoCapture(base64);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [onPhotoCapture]
  );

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    onDeleteSession(id);
  };

  return (
    <div className="home-screen">
      {/* Header */}
      <header className="home-header">
        <svg className="home-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s1 2.5-1.5 6c2-.5 3.5-.5 3.5-.5s-1 3.5-4 5.5" />
          <path d="M11 20L12 14" />
        </svg>
        <h1>Plant Pruning Advisor</h1>
      </header>

      {/* Camera Actions */}
      <div className="camera-actions">
        <button className="camera-btn" onClick={openCamera} aria-label="Open camera">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </button>
        <span className="camera-btn-label">Take a Photo</span>

        <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload Photo
        </button>

        <p className="tip-text">Get the whole plant in frame — step back if needed</p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden-input"
          onChange={handleFileChange}
        />
      </div>

      {/* Saved Sessions */}
      <section className="saved-sessions">
        <h2>Saved Sessions</h2>
        {(!savedSessions || savedSessions.length === 0) ? (
          <div className="saved-sessions-empty">
            No saved sessions yet. Take a photo to get started!
          </div>
        ) : (
          savedSessions.map((session) => (
            <div
              key={session.id}
              className="session-card"
              onClick={() => onLoadSession(session)}
            >
              {session.imageData && (
                <img
                  className="session-thumb"
                  src={session.imageData}
                  alt={session.species || 'Plant'}
                />
              )}
              <div className="session-info">
                <div className="session-species">{session.species || 'Unknown Plant'}</div>
                <div className="session-date">{session.date || ''}</div>
              </div>
              <button
                className="session-delete"
                onClick={(e) => handleDeleteClick(e, session.id)}
                aria-label="Delete session"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))
        )}
      </section>

      {/* Camera Viewfinder Overlay */}
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
  );
}
