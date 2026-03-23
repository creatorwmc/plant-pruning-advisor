import SilhouetteIcon from './SilhouetteIcon';
import './AnalysisScreen.css';

function getDifficultyClass(difficulty) {
  if (!difficulty) return 'pill pill-moderate';
  const d = difficulty.toLowerCase();
  if (d === 'easy' || d === 'beginner') return 'pill pill-easy';
  if (d === 'experienced' || d === 'advanced' || d === 'hard') return 'pill pill-experienced';
  return 'pill pill-moderate';
}

function getConfidenceClass(confidence) {
  if (!confidence) return 'pill pill-medium';
  const c = confidence.toLowerCase();
  if (c === 'high') return 'pill pill-high';
  if (c === 'low') return 'pill pill-low';
  return 'pill pill-medium';
}

export default function AnalysisScreen({ imageData, analysis, onSelectGoal, onBack }) {
  if (!analysis) return null;

  const {
    species_name,
    confidence,
    current_analysis,
    health_notes,
    structure_notes,
    pruning_timing,
    goals,
  } = analysis;

  const hasHealthConcerns = health_notes && !health_notes.toLowerCase().includes('healthy') && !health_notes.toLowerCase().includes('good condition');

  return (
    <div className="analysis-screen fade-in">
      {/* Header */}
      <header className="analysis-header">
        <button className="back-btn" onClick={onBack} aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1>Analysis</h1>
      </header>

      {/* Photo */}
      {imageData && (
        <div className="analysis-photo-card">
          <img className="analysis-photo" src={imageData} alt="Captured plant" />
        </div>
      )}

      {/* Plant ID */}
      <div className="plant-id-card">
        <h2 className="plant-species-name">{species_name || 'Unknown Species'}</h2>
        {confidence && (
          <span className={getConfidenceClass(confidence)}>
            {confidence} confidence
          </span>
        )}
        {current_analysis && (
          <p className="plant-analysis-text">{current_analysis}</p>
        )}
      </div>

      {/* Health Notes */}
      {health_notes && (
        <div className={`analysis-section section-health ${hasHealthConcerns ? '' : 'healthy'}`}>
          <h3>Health Notes</h3>
          <p>{health_notes}</p>
        </div>
      )}

      {/* Structure Notes */}
      {structure_notes && (
        <div className="analysis-section section-structure">
          <h3>Structure</h3>
          <p>{structure_notes}</p>
        </div>
      )}

      {/* Pruning Timing */}
      {pruning_timing && (
        <div className="analysis-section section-timing">
          <h3>Pruning Timing</h3>
          <p>{pruning_timing}</p>
        </div>
      )}

      {/* Goals */}
      {goals && goals.length > 0 && (
        <>
          <h2 className="goals-heading">Choose Your Pruning Goal</h2>
          {goals.map((goal, i) => (
            <div
              key={goal.id || i}
              className="goal-card"
              onClick={() => onSelectGoal(goal)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelectGoal(goal)}
            >
              <div className="goal-icon">
                <SilhouetteIcon shape={goal.shape || goal.id} size={64} />
              </div>
              <div className="goal-content">
                <div className="goal-name">{goal.name}</div>
                <p className="goal-description">{goal.description}</p>
                <div className="goal-meta">
                  {goal.difficulty && (
                    <span className={getDifficultyClass(goal.difficulty)}>
                      {goal.difficulty}
                    </span>
                  )}
                  {goal.timing && (
                    <span className="goal-timing">{goal.timing}</span>
                  )}
                </div>
              </div>
              <svg className="goal-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
