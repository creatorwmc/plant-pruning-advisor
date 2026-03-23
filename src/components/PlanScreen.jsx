import { useState, useRef, useEffect, useCallback } from 'react';
import './PlanScreen.css';

// Annotation colors
const COLORS = {
  remove: '#D4785C',
  shorten: '#C8922A',
  leave: '#4A7C3F',
};

// Convert clock position string to canvas coordinates
function clockToPosition(clockStr, width, height) {
  // Parse clock positions like "2 o'clock", "high center", "lower left"
  const s = (clockStr || '').toLowerCase();
  let x = width / 2;
  let y = height / 2;

  // Clock position mapping
  const clockMap = {
    '12': { x: 0.5, y: 0.12 },
    '1': { x: 0.7, y: 0.15 },
    '2': { x: 0.82, y: 0.3 },
    '3': { x: 0.88, y: 0.5 },
    '4': { x: 0.82, y: 0.7 },
    '5': { x: 0.7, y: 0.82 },
    '6': { x: 0.5, y: 0.88 },
    '7': { x: 0.3, y: 0.82 },
    '8': { x: 0.18, y: 0.7 },
    '9': { x: 0.12, y: 0.5 },
    '10': { x: 0.18, y: 0.3 },
    '11': { x: 0.3, y: 0.15 },
  };

  // Try matching clock position
  const clockMatch = s.match(/(\d{1,2})\s*o'?clock/);
  if (clockMatch) {
    const pos = clockMap[clockMatch[1]];
    if (pos) {
      x = pos.x * width;
      y = pos.y * height;
      return { x, y };
    }
  }

  // Positional keywords
  if (s.includes('top') || s.includes('upper') || s.includes('high')) y = height * 0.2;
  else if (s.includes('bottom') || s.includes('lower') || s.includes('base')) y = height * 0.8;
  else if (s.includes('middle') || s.includes('center')) y = height * 0.5;

  if (s.includes('left')) x = width * 0.22;
  else if (s.includes('right')) x = width * 0.78;
  else if (s.includes('center') || s.includes('central')) x = width * 0.5;

  return { x, y };
}

function drawAnnotations(canvas, plan, imgEl) {
  if (!canvas || !imgEl) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = imgEl.clientWidth;
  const h = canvas.height = imgEl.clientHeight;
  ctx.clearRect(0, 0, w, h);

  const r = 16;

  const drawItems = (items, type) => {
    if (!items) return;
    items.forEach((item) => {
      const loc = item.location || item.area || '';
      const { x, y } = clockToPosition(loc, w, h);
      const color = COLORS[type] || COLORS.leave;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color + '33';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (type === 'remove') {
        // X mark
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5);
        ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5);
        ctx.stroke();
      } else if (type === 'shorten') {
        // Down arrow
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 4);
        ctx.moveTo(x - 4, y + 1); ctx.lineTo(x, y + 6); ctx.lineTo(x + 4, y + 1);
        ctx.stroke();
      } else {
        // Checkmark
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x - 5, y); ctx.lineTo(x - 1, y + 5); ctx.lineTo(x + 6, y - 4);
        ctx.stroke();
      }
    });
  };

  drawItems(plan.priority_cuts, 'remove');
  drawItems(plan.shaping_cuts, 'shorten');
  drawItems(plan.leave_alone, 'leave');
}

// Tool icon SVGs
function ToolSvg({ name }) {
  const n = (name || '').toLowerCase();
  if (n.includes('shear') || n.includes('hedge')) {
    return (
      <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3l6 6M18 3l-6 6M6 21l6-6M18 21l-6-6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    );
  }
  if (n.includes('saw') || n.includes('pruning saw')) {
    return (
      <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21L14 3h7" />
        <path d="M14 3l-2 4 2 4-2 4 2 4" />
      </svg>
    );
  }
  if (n.includes('lopper')) {
    return (
      <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="3" x2="6" y2="15" />
        <line x1="18" y1="3" x2="18" y2="15" />
        <path d="M6 15 Q12 20 18 15" />
      </svg>
    );
  }
  // Default: pruner/secateur
  return (
    <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20l4-4" />
      <path d="M14 4l-8.5 8.5a2.12 2.12 0 0 0 3 3L17 7" />
      <path d="M16 4l4 4" />
    </svg>
  );
}

export default function PlanScreen({
  imageData,
  analysis,
  selectedGoal,
  plan,
  onSave,
  onTryDifferent,
  onBack,
  saved,
}) {
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [expandedCuts, setExpandedCuts] = useState({});
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const redraw = useCallback(() => {
    if (showAnnotations && plan && imgRef.current) {
      drawAnnotations(canvasRef.current, plan, imgRef.current);
    } else if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [showAnnotations, plan]);

  useEffect(() => {
    redraw();
    window.addEventListener('resize', redraw);
    return () => window.removeEventListener('resize', redraw);
  }, [redraw]);

  const toggleExpand = (section, idx) => {
    const key = `${section}-${idx}`;
    setExpandedCuts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!plan) return null;

  return (
    <div className="plan-screen fade-in">
      {/* Header */}
      <header className="plan-header">
        <button className="back-btn" onClick={onBack} aria-label="Go back">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1>Pruning Plan</h1>
      </header>

      {/* Photo with annotations */}
      {imageData && (
        <div className="plan-photo-wrapper">
          <img
            ref={imgRef}
            className="plan-photo"
            src={imageData}
            alt="Plant"
            onLoad={redraw}
          />
          <canvas ref={canvasRef} className="plan-annotation-canvas" />
          <button
            className="annotation-toggle"
            onClick={() => setShowAnnotations((v) => !v)}
          >
            {showAnnotations ? 'Hide Markers' : 'Show Markers'}
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="annotation-legend">
        <span className="legend-item"><span className="legend-dot legend-remove" /> Remove</span>
        <span className="legend-item"><span className="legend-dot legend-shorten" /> Shorten</span>
        <span className="legend-item"><span className="legend-dot legend-leave" /> Leave</span>
      </div>

      {/* Summary */}
      {plan.summary && (
        <p className="plan-summary">{plan.summary}</p>
      )}

      {/* Priority Cuts */}
      {plan.priority_cuts && plan.priority_cuts.length > 0 && (
        <div className="plan-section">
          <h2 className="plan-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4785C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            Priority Cuts
          </h2>
          <div className="cut-list">
            {plan.priority_cuts.map((cut, i) => {
              const isExpanded = expandedCuts[`priority-${i}`];
              return (
                <div key={i} className="cut-item cut-item-priority">
                  <div className="cut-header" onClick={() => toggleExpand('priority', i)}>
                    <span className="cut-number">{i + 1}</span>
                    <span className="cut-location">{cut.location || cut.area}</span>
                    {cut.cut_type && <span className="cut-type-pill">{cut.cut_type}</span>}
                    <svg
                      className={`cut-expand-icon ${isExpanded ? 'expanded' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  <p className="cut-action">{cut.action}</p>
                  {isExpanded && cut.reason && (
                    <p className="cut-details">{cut.reason}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shaping Cuts */}
      {plan.shaping_cuts && plan.shaping_cuts.length > 0 && (
        <div className="plan-section">
          <h2 className="plan-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C8922A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20V10" />
              <path d="M18 20V4" />
              <path d="M6 20v-6" />
            </svg>
            Shaping Cuts
          </h2>
          <div className="cut-list">
            {plan.shaping_cuts.map((cut, i) => {
              const isExpanded = expandedCuts[`shaping-${i}`];
              return (
                <div key={i} className="cut-item cut-item-shaping">
                  <div className="cut-header" onClick={() => toggleExpand('shaping', i)}>
                    <span className="cut-number">{i + 1}</span>
                    <span className="cut-location">{cut.location || cut.area}</span>
                    {cut.cut_type && <span className="cut-type-pill">{cut.cut_type}</span>}
                    <svg
                      className={`cut-expand-icon ${isExpanded ? 'expanded' : ''}`}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                  <p className="cut-action">{cut.action}</p>
                  {isExpanded && (
                    <div className="cut-details">
                      {cut.direction && <p>Direction: {cut.direction}</p>}
                      {cut.amount && <p>Amount: {cut.amount}</p>}
                      {cut.reason && <p>{cut.reason}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leave Alone */}
      {plan.leave_alone && plan.leave_alone.length > 0 && (
        <div className="plan-section">
          <h2 className="plan-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A7C3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Leave Alone
          </h2>
          <div className="leave-section">
            {plan.leave_alone.map((item, i) => (
              <div key={i} className="leave-item">
                <svg className="leave-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{typeof item === 'string' ? item : item.description || item.area || item.location}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tools & Time */}
      {(plan.tools || plan.estimated_time) && (
        <div className="plan-section">
          <h2 className="plan-section-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
            Tools &amp; Time
          </h2>
          <div className="tools-time-bar">
            {plan.tools && plan.tools.map((tool, i) => (
              <div key={i} className="tool-item">
                <ToolSvg name={typeof tool === 'string' ? tool : tool.name} />
                <span>{typeof tool === 'string' ? tool : tool.name}</span>
              </div>
            ))}
            {plan.tools && plan.estimated_time && <div className="tools-divider" />}
            {plan.estimated_time && (
              <div className="time-estimate">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {plan.estimated_time}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Follow-up */}
      {plan.followup && (
        <div className="plan-section">
          <h2 className="plan-section-title">Follow-up Care</h2>
          <div className="followup-section">
            {typeof plan.followup === 'string' ? (
              <p>{plan.followup}</p>
            ) : (
              plan.followup.map((item, i) => <p key={i} style={{ marginBottom: i < plan.followup.length - 1 ? 8 : 0 }}>{typeof item === 'string' ? item : item.note || item.text}</p>)
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {plan.warnings && plan.warnings.length > 0 && (
        <div className="plan-section">
          <h2 className="plan-section-title" style={{ color: '#a07520' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a07520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Warnings
          </h2>
          <div className="warnings-section">
            {plan.warnings.map((warn, i) => (
              <div key={i} className="warning-item">
                <svg className="warning-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a07520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{typeof warn === 'string' ? warn : warn.text || warn.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="plan-actions">
        <button
          className={`save-plan-btn ${saved ? 'saved' : ''}`}
          onClick={onSave}
          disabled={saved}
        >
          {saved ? 'Plan Saved' : 'Save This Plan'}
        </button>
        <button className="try-different-btn" onClick={onTryDifferent}>
          Try a Different Shape
        </button>
      </div>
    </div>
  );
}
