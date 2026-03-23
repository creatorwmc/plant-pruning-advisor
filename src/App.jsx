import { useState, useEffect } from 'react';
import { getSessions, saveSession, deleteSession } from './db';
import { analyzePhoto, getPruningInstructions, getApiKey, setApiKey } from './api';
import HomeScreen from './components/HomeScreen';
import AnalysisScreen from './components/AnalysisScreen';
import PlanScreen from './components/PlanScreen';
import LoadingScreen from './components/LoadingScreen';
import ApiKeyModal from './components/ApiKeyModal';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [imageData, setImageData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [plan, setPlan] = useState(null);
  const [savedSessions, setSavedSessions] = useState([]);
  const [saved, setSaved] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    refreshSessions();
  }, []);

  const refreshSessions = () => {
    getSessions().then(setSavedSessions).catch(() => {});
  };

  const ensureApiKey = (action) => {
    const key = getApiKey();
    if (!key) {
      setPendingAction(() => action);
      setShowApiKeyModal(true);
      return false;
    }
    return true;
  };

  const handleApiKeySave = (key) => {
    setApiKey(key);
    setShowApiKeyModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handlePhotoCapture = (base64) => {
    setImageData(base64);
    setError(null);
    setSaved(false);

    const doAnalysis = async () => {
      setScreen('analyzing');
      const result = await analyzePhoto(base64);
      if (result.error) {
        setError(result.error);
        setScreen('home');
        return;
      }
      setAnalysis(result);
      setScreen('analysis');
    };

    if (ensureApiKey(doAnalysis)) {
      doAnalysis();
    }
  };

  const handleSelectGoal = async (goal) => {
    setSelectedGoal(goal);
    setScreen('generating');

    const result = await getPruningInstructions(
      imageData,
      analysis.species_name || analysis.species,
      goal
    );
    if (result.error) {
      setError(result.error);
      setScreen('analysis');
      return;
    }
    setPlan(result);
    setScreen('plan');
  };

  const handleSave = async () => {
    if (saved) return;
    try {
      await saveSession({
        imageData,
        species: analysis.species_name || analysis.species,
        analysis,
        selectedGoal,
        pruningPlan: plan,
      });
      setSaved(true);
      refreshSessions();
    } catch {
      // silently fail
    }
  };

  const handleDeleteSession = async (id) => {
    await deleteSession(id);
    refreshSessions();
  };

  const handleLoadSession = (session) => {
    setImageData(session.imageData);
    setAnalysis(session.analysis);
    setSelectedGoal(session.selectedGoal);
    setPlan(session.pruningPlan);
    setSaved(true);
    setScreen('plan');
  };

  const goHome = () => {
    setScreen('home');
    setImageData(null);
    setAnalysis(null);
    setSelectedGoal(null);
    setPlan(null);
    setSaved(false);
    setError(null);
    refreshSessions();
  };

  const tryDifferent = () => {
    setPlan(null);
    setSelectedGoal(null);
    setSaved(false);
    setScreen('analysis');
  };

  return (
    <div className="app-container">
      {error && screen === 'home' && (
        <div style={{
          padding: '12px 16px',
          margin: '12px 0',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(139, 46, 30, 0.08)',
          border: '1px solid rgba(139, 46, 30, 0.2)',
          color: 'var(--barn-red)',
          fontSize: '0.9rem',
        }}>
          {error}
        </div>
      )}

      {screen === 'home' && (
        <HomeScreen
          onPhotoCapture={handlePhotoCapture}
          savedSessions={savedSessions}
          onLoadSession={handleLoadSession}
          onDeleteSession={handleDeleteSession}
        />
      )}

      {screen === 'analyzing' && (
        <LoadingScreen
          imageData={imageData}
          message="Identifying your plant..."
        />
      )}

      {screen === 'analysis' && (
        <AnalysisScreen
          imageData={imageData}
          analysis={analysis}
          onSelectGoal={handleSelectGoal}
          onBack={goHome}
        />
      )}

      {screen === 'generating' && (
        <LoadingScreen
          imageData={imageData}
          message="Creating your pruning plan..."
        />
      )}

      {screen === 'plan' && (
        <PlanScreen
          imageData={imageData}
          analysis={analysis}
          selectedGoal={selectedGoal}
          plan={plan}
          onSave={handleSave}
          onTryDifferent={tryDifferent}
          onBack={() => setScreen('analysis')}
          saved={saved}
        />
      )}

      {showApiKeyModal && (
        <ApiKeyModal
          onSave={handleApiKeySave}
          onCancel={() => setShowApiKeyModal(false)}
        />
      )}
    </div>
  );
}
