import './LoadingScreen.css';

export default function LoadingScreen({ imageData, message }) {
  return (
    <div className="loading-screen">
      {imageData && (
        <div
          className="loading-bg"
          style={{ backgroundImage: `url(${imageData})` }}
        />
      )}
      <div className="loading-bg-overlay" />
      <div className="loading-card fade-in">
        <div className="spinner" />
        <p className="loading-message">{message || 'Analyzing...'}</p>
      </div>
    </div>
  );
}
